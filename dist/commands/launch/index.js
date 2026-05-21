// src/commands/launch/index.ts
import { Command, Flags } from "@oclif/core";

// src/core/project-detector.ts
import path3 from "path";

// src/core/fs.ts
import fs from "fs/promises";
import path from "path";
async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}
async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
async function readTextFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
async function readJsonFile(filePath) {
  const raw = await readTextFile(filePath);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// src/core/package-manager.ts
import path2 from "path";
async function detectPackageManager(rootDir) {
  if (await fileExists(path2.join(rootDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (await fileExists(path2.join(rootDir, "yarn.lock"))) {
    return "yarn";
  }
  if (await fileExists(path2.join(rootDir, "bun.lockb"))) {
    return "bun";
  }
  if (await fileExists(path2.join(rootDir, "bun.lock"))) {
    return "bun";
  }
  if (await fileExists(path2.join(rootDir, "package-lock.json"))) {
    return "npm";
  }
  return "unknown";
}

// src/core/project-detector.ts
async function detectProjectContext(cwd) {
  const rootDir = cwd;
  const packageJsonPath = path3.join(rootDir, "package.json");
  const packageJson = await readJsonFile(packageJsonPath);
  const dependencies = packageJson?.dependencies ?? {};
  const devDependencies = packageJson?.devDependencies ?? {};
  const scripts = packageJson?.scripts ?? {};
  const packageManager = await detectPackageManager(rootDir);
  const envFiles = await detectEnvFiles(rootDir);
  return {
    rootDir,
    packageJson,
    packageManager,
    framework: await detectFramework(rootDir, dependencies, devDependencies),
    language: await detectLanguage(rootDir, dependencies, devDependencies),
    hasGit: await directoryExists(path3.join(rootDir, ".git")),
    hasTailwind: await detectTailwind(rootDir, dependencies, devDependencies),
    hasReactRouter: hasDependency(
      dependencies,
      devDependencies,
      "react-router-dom"
    ),
    envFiles,
    scripts,
    dependencies,
    devDependencies
  };
}
async function detectFramework(rootDir, dependencies, devDependencies) {
  if (hasDependency(dependencies, devDependencies, "next")) {
    return "next";
  }
  if (hasDependency(dependencies, devDependencies, "vite") && hasDependency(dependencies, devDependencies, "react")) {
    return "react-vite";
  }
  if (hasDependency(dependencies, devDependencies, "express")) {
    return "express";
  }
  if (await fileExists(path3.join(rootDir, "package.json"))) {
    return "node";
  }
  return "unknown";
}
async function detectLanguage(rootDir, dependencies, devDependencies) {
  if (await fileExists(path3.join(rootDir, "tsconfig.json")) || hasDependency(dependencies, devDependencies, "typescript")) {
    return "typescript";
  }
  if (await fileExists(path3.join(rootDir, "package.json"))) {
    return "javascript";
  }
  return "unknown";
}
async function detectTailwind(rootDir, dependencies, devDependencies) {
  return hasDependency(dependencies, devDependencies, "tailwindcss") || await fileExists(path3.join(rootDir, "tailwind.config.js")) || await fileExists(path3.join(rootDir, "tailwind.config.ts")) || await fileExists(path3.join(rootDir, "tailwind.config.cjs")) || await fileExists(path3.join(rootDir, "tailwind.config.mjs"));
}
async function detectEnvFiles(rootDir) {
  const candidates = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.example"
  ];
  const existing = [];
  for (const candidate of candidates) {
    if (await fileExists(path3.join(rootDir, candidate))) {
      existing.push(candidate);
    }
  }
  return existing;
}
function hasDependency(dependencies, devDependencies, name) {
  return Boolean(dependencies[name] || devDependencies[name]);
}

// src/core/shell.ts
import { execa } from "execa";
async function runCommand(command, args, options) {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd,
      stdout: options.inherit ? "inherit" : "pipe",
      stderr: options.inherit ? "inherit" : "pipe"
    });
    return {
      success: true,
      stdout: typeof result.stdout === "string" ? result.stdout : "",
      stderr: typeof result.stderr === "string" ? result.stderr : ""
    };
  } catch (error) {
    if (error instanceof Error && "stdout" in error && "stderr" in error) {
      const commandError = error;
      return {
        success: false,
        stdout: commandError.stdout ?? "",
        stderr: commandError.stderr ?? error.message
      };
    }
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown command error"
    };
  }
}

// src/modules/launchcheck/checks/build.ts
var buildChecks = async ({
  context,
  skipBuild
}) => {
  if (!context.packageJson || !context.scripts.build) {
    return [];
  }
  if (skipBuild) {
    return [
      {
        id: "build-skipped",
        title: "Production build skipped",
        status: "warn",
        message: "Re-run without --skip-build before launching for real."
      }
    ];
  }
  const { command, args } = getBuildCommand(context.packageManager);
  const result = await runCommand(command, args, { cwd: context.rootDir });
  const check = result.success ? {
    id: "build-passes",
    title: "Production build passes",
    status: "pass"
  } : {
    id: "build-fails",
    title: "Production build passes",
    status: "fail",
    message: "Build failed. Run your build command manually to inspect the full error."
  };
  return [check];
};
function getBuildCommand(packageManager) {
  switch (packageManager) {
    case "pnpm":
      return { command: "pnpm", args: ["build"] };
    case "yarn":
      return { command: "yarn", args: ["build"] };
    case "bun":
      return { command: "bun", args: ["run", "build"] };
    case "npm":
    case "unknown":
      return { command: "npm", args: ["run", "build"] };
  }
}

// src/modules/launchcheck/checks/env.ts
import path4 from "path";
var TEST_MODE_HINTS = [
  { key: "STRIPE_SECRET_KEY", marker: "sk_test_", provider: "Stripe" },
  { key: "STRIPE_PUBLISHABLE_KEY", marker: "pk_test_", provider: "Stripe" },
  { key: "VITE_STRIPE_PUBLISHABLE_KEY", marker: "pk_test_", provider: "Stripe" },
  { key: "SQUARE_ENVIRONMENT", marker: "sandbox", provider: "Square" },
  { key: "SQUARE_ACCESS_TOKEN", marker: "EAAAEa", provider: "Square sandbox" }
];
var envChecks = async ({ context }) => {
  if (!context.packageJson) {
    return [];
  }
  const checks = [];
  checks.push({
    id: "env-example",
    title: ".env.example exists",
    status: context.envFiles.includes(".env.example") ? "pass" : "warn",
    message: context.envFiles.includes(".env.example") ? void 0 : "Document required environment variables in .env.example."
  });
  const testModeFindings = await detectTestModeKeys(context.rootDir);
  if (testModeFindings.length > 0) {
    const providers = Array.from(new Set(testModeFindings.map((f) => f.provider)));
    checks.push({
      id: "payment-test-mode",
      title: "Payment env variables look like test/sandbox keys",
      status: "warn",
      message: `Found ${providers.join(", ")} test/sandbox values in local env files (${testModeFindings.map((f) => f.key).join(", ")}). Switch to live keys before launch.`
    });
  }
  return checks;
};
async function detectTestModeKeys(rootDir) {
  const candidates = [".env", ".env.local", ".env.production"];
  const findings = [];
  for (const candidate of candidates) {
    const raw = await readTextFile(path4.join(rootDir, candidate));
    if (!raw) continue;
    for (const hint of TEST_MODE_HINTS) {
      const line = raw.split("\n").find((l) => l.trim().startsWith(`${hint.key}=`));
      if (line && line.includes(hint.marker)) {
        findings.push({ key: hint.key, provider: hint.provider });
      }
    }
  }
  return findings;
}

// src/modules/launchcheck/checks/images.ts
import fs2 from "fs/promises";
import path5 from "path";
var MAX_BYTES = 1e6;
var imageChecks = async ({ context }) => {
  const publicDir = path5.join(context.rootDir, "public");
  if (!await directoryExists(publicDir)) {
    return [];
  }
  const largeFiles = await findLargeFiles(publicDir, MAX_BYTES);
  const check = largeFiles.length === 0 ? {
    id: "large-images",
    title: "No oversized public assets",
    status: "pass"
  } : {
    id: "large-images",
    title: "No oversized public assets",
    status: "warn",
    message: `${largeFiles.length} file(s) over 1 MB in public/. Compress before launch (${largeFiles.slice(0, 3).map((f) => path5.relative(context.rootDir, f)).join(", ")}${largeFiles.length > 3 ? ", ..." : ""}).`
  };
  return [check];
};
async function findLargeFiles(dir, maxBytes) {
  const results = [];
  const entries = await fs2.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path5.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findLargeFiles(fullPath, maxBytes));
      continue;
    }
    if (!entry.isFile()) continue;
    const stat = await fs2.stat(fullPath);
    if (stat.size > maxBytes) {
      results.push(fullPath);
    }
  }
  return results;
}

// src/modules/launchcheck/checks/links.ts
import fs3 from "fs/promises";
import path6 from "path";
var SCANNABLE_EXTENSIONS = /* @__PURE__ */ new Set([".tsx", ".jsx", ".ts", ".js", ".html"]);
var IGNORED_DIRECTORIES = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".vercel",
  ".turbo",
  "coverage"
]);
var SUSPICIOUS_PATTERNS = [
  /href=["']\s*#\s*["']/g,
  /href=["']TODO["']/gi,
  /href=["']FIXME["']/gi,
  /to=["']TODO["']/gi,
  /to=["']FIXME["']/gi,
  /href=["']javascript:void\(0\)["']/gi
];
var linkChecks = async ({ context }) => {
  const targets = [];
  const srcDir = path6.join(context.rootDir, "src");
  if (await directoryExists(srcDir)) {
    targets.push(...await collectFiles(srcDir));
  }
  const indexHtml = path6.join(context.rootDir, "index.html");
  if (await fileExists(indexHtml)) {
    targets.push(indexHtml);
  }
  if (targets.length === 0) {
    return [];
  }
  const findings = [];
  for (const file of targets) {
    const content = await readTextFile(file);
    if (!content) continue;
    for (const pattern of SUSPICIOUS_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);
      if (match) {
        findings.push({ file, snippet: match[0] });
        break;
      }
    }
  }
  const check = findings.length === 0 ? {
    id: "broken-links",
    title: "No obvious broken/placeholder links",
    status: "pass"
  } : {
    id: "broken-links",
    title: "Obvious placeholder or broken links found",
    status: "warn",
    message: `${findings.length} suspicious link(s) found, including: ${findings.slice(0, 3).map(
      (f) => `${path6.relative(context.rootDir, f.file)} (${f.snippet})`
    ).join("; ")}${findings.length > 3 ? "; ..." : ""}.`
  };
  return [check];
};
async function collectFiles(dir) {
  const results = [];
  const entries = await fs3.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path6.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      results.push(...await collectFiles(fullPath));
      continue;
    }
    if (entry.isFile() && SCANNABLE_EXTENSIONS.has(path6.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

// src/modules/launchcheck/live/analyze-html.ts
var LOCALHOST_PATTERNS = [
  /localhost(?::\d+)?/gi,
  /127\.0\.0\.1(?::\d+)?/g
];
var TEST_ENV_PATTERNS = [
  { label: "Stripe test key (pk_test_)", pattern: /pk_test_[A-Za-z0-9]{4,}/g },
  { label: "Stripe test key (sk_test_)", pattern: /sk_test_[A-Za-z0-9]{4,}/g },
  { label: "Square sandbox", pattern: /squareupsandbox\.com/gi },
  { label: "Square sandbox env", pattern: /SQUARE_ENVIRONMENT["']?:\s*["']sandbox/gi },
  { label: "Supabase local URL", pattern: /supabase\.co.*?test/gi }
];
function uniqueMatches(input, patterns) {
  const found = /* @__PURE__ */ new Set();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(input)) !== null) {
      found.add(match[0]);
      if (found.size >= 8) break;
    }
  }
  return Array.from(found);
}
function matchAttribute(html, regex) {
  const match = html.match(regex);
  if (!match) return null;
  const value = match[1];
  return value && value.trim().length > 0 ? value.trim() : null;
}
function analyzeHtml(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasDescription = /<meta[^>]+name=["']description["']/i.test(html);
  const hasOpenGraph = /<meta[^>]+property=["']og:(title|description)["']/i.test(html);
  const canonical = matchAttribute(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
  );
  const localhost = uniqueMatches(html, LOCALHOST_PATTERNS);
  const testEnv = TEST_ENV_PATTERNS.flatMap((entry) => {
    entry.pattern.lastIndex = 0;
    return entry.pattern.test(html) ? [entry.label] : [];
  });
  return {
    title: title && title.length > 0 ? title : null,
    hasViewport,
    hasDescription,
    hasOpenGraph,
    canonical,
    bodyBytes: Buffer.byteLength(html, "utf8"),
    localhostReferences: localhost,
    testEnvReferences: Array.from(new Set(testEnv))
  };
}

// src/modules/launchcheck/live/headers.ts
var COMPRESSION_VALUES = /* @__PURE__ */ new Set(["gzip", "br", "deflate", "zstd"]);
function analyzeHeaders(headers) {
  const contentType = headers.get("content-type") ?? null;
  const cacheControl = headers.get("cache-control") ?? null;
  const contentEncoding = headers.get("content-encoding") ?? null;
  const rawLength = headers.get("content-length");
  const contentLength = rawLength ? Number(rawLength) : null;
  const isHtml = contentType ? contentType.toLowerCase().startsWith("text/html") : false;
  const hasCompression = contentEncoding ? contentEncoding.toLowerCase().split(/,\s*/).some((value) => COMPRESSION_VALUES.has(value)) : false;
  const hasCacheControl = Boolean(
    cacheControl && cacheControl.trim().length > 0
  );
  return {
    contentType,
    cacheControl,
    contentEncoding,
    contentLength: Number.isFinite(contentLength) ? contentLength : null,
    isHtml,
    hasCompression,
    hasCacheControl
  };
}

// src/modules/launchcheck/live/fetch-url.ts
var DEFAULT_TIMEOUT_MS = 1e4;
async function fetchUrl(url, options = {}) {
  const fetcher = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== "function") {
    return {
      kind: "error",
      error: "fetch is not available in this Node runtime."
    };
  }
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetcher(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "forge-launch/0.1" }
    });
    const headersArrived = Date.now();
    const body = await response.text();
    const finished = Date.now();
    const headers = /* @__PURE__ */ new Map();
    response.headers.forEach((value, name) => {
      headers.set(name.toLowerCase(), value);
    });
    return {
      kind: "ok",
      status: response.status,
      headers,
      body,
      ttfbMs: headersArrived - started,
      totalMs: finished - started
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      kind: "error",
      error: controller.signal.aborted ? `Request timed out after ${timeoutMs}ms` : message
    };
  } finally {
    clearTimeout(timeout);
  }
}

// src/modules/launchcheck/live/lighthouse-lite.ts
var MAX_HTML_BYTES = 1e6;
var SLOW_TTFB_MS = 800;
async function runLiveChecks(options) {
  const checks = [];
  const result = await fetchUrl(options.url, {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs
  });
  if (result.kind === "error") {
    checks.push({
      id: "live-reachable",
      title: "Deployment URL is reachable",
      status: "fail",
      message: `Could not fetch ${options.url}: ${result.error}`
    });
    return checks;
  }
  checks.push({
    id: "live-reachable",
    title: "Deployment URL is reachable",
    status: "pass",
    message: `Fetched ${options.url} in ${result.totalMs}ms (TTFB ${result.ttfbMs}ms).`
  });
  checks.push({
    id: "live-status",
    title: "HTTP status is 200",
    status: result.status === 200 ? "pass" : "fail",
    message: result.status === 200 ? void 0 : `Got HTTP ${result.status}.`
  });
  const headers = analyzeHeaders(result.headers);
  checks.push({
    id: "live-content-type",
    title: "Content-Type is text/html",
    status: headers.isHtml ? "pass" : "fail",
    message: headers.isHtml ? void 0 : `Got Content-Type "${headers.contentType ?? "(none)"}".`
  });
  if (headers.isHtml) {
    const html = analyzeHtml(result.body);
    checks.push({
      id: "live-title",
      title: "HTML <title> is present",
      status: html.title ? "pass" : "fail",
      message: html.title ? `Title: "${html.title}"` : "Page has no non-empty <title>."
    });
    checks.push({
      id: "live-meta-description",
      title: "Meta description present",
      status: html.hasDescription ? "pass" : "warn",
      message: html.hasDescription ? void 0 : "Add a meta description for better search previews."
    });
    checks.push({
      id: "live-viewport",
      title: "Viewport meta tag present",
      status: html.hasViewport ? "pass" : "warn",
      message: html.hasViewport ? void 0 : "Add a viewport meta tag for responsive behavior."
    });
    checks.push({
      id: "live-open-graph",
      title: "Open Graph metadata present",
      status: html.hasOpenGraph ? "pass" : "warn",
      message: html.hasOpenGraph ? void 0 : "Add og:title and og:description for shareable previews."
    });
    checks.push({
      id: "live-canonical",
      title: "Canonical URL present",
      status: html.canonical ? "pass" : "warn",
      message: html.canonical ? `Canonical: ${html.canonical}` : 'Add a <link rel="canonical"> to disambiguate URLs for search engines.'
    });
    checks.push({
      id: "live-payload-size",
      title: "HTML payload under 1 MB",
      status: html.bodyBytes <= MAX_HTML_BYTES ? "pass" : "warn",
      message: html.bodyBytes <= MAX_HTML_BYTES ? `HTML is ${formatBytes(html.bodyBytes)}.` : `HTML is ${formatBytes(html.bodyBytes)} \u2014 consider trimming inline assets.`
    });
    checks.push({
      id: "live-no-localhost",
      title: "No localhost references in HTML",
      status: html.localhostReferences.length === 0 ? "pass" : "fail",
      message: html.localhostReferences.length === 0 ? void 0 : `Found ${html.localhostReferences.length} localhost reference(s): ${html.localhostReferences.slice(0, 3).join(", ")}`
    });
    checks.push({
      id: "live-no-test-env",
      title: "No obvious test/sandbox env references",
      status: html.testEnvReferences.length === 0 ? "pass" : "warn",
      message: html.testEnvReferences.length === 0 ? void 0 : `Found test/sandbox markers: ${html.testEnvReferences.join(", ")}`
    });
  }
  checks.push({
    id: "live-cache-control",
    title: "Cache-Control header present",
    status: headers.hasCacheControl ? "pass" : "warn",
    message: headers.hasCacheControl ? `Cache-Control: ${headers.cacheControl}` : "No Cache-Control header. Set explicit caching at the edge."
  });
  checks.push({
    id: "live-compression",
    title: "Response is compressed",
    status: headers.hasCompression ? "pass" : "warn",
    message: headers.hasCompression ? `Content-Encoding: ${headers.contentEncoding}` : "No gzip/br compression detected. Enable compression at the edge."
  });
  checks.push({
    id: "live-ttfb",
    title: "Time to first byte under 800ms",
    status: result.ttfbMs <= SLOW_TTFB_MS ? "pass" : "warn",
    message: result.ttfbMs <= SLOW_TTFB_MS ? `TTFB: ${result.ttfbMs}ms` : `TTFB is ${result.ttfbMs}ms \u2014 slower than ${SLOW_TTFB_MS}ms. Investigate caching or cold starts.`
  });
  return checks;
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

// src/modules/launchcheck/checks/live.ts
var liveChecks = async ({ url }) => {
  if (!url) {
    return [];
  }
  return runLiveChecks({ url });
};

// src/modules/launchcheck/checks/metadata.ts
import path7 from "path";
var metadataChecks = async ({ context }) => {
  if (context.framework !== "react-vite" && context.framework !== "next") {
    return [];
  }
  const indexPath = path7.join(context.rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return [];
  }
  const raw = await readTextFile(indexPath);
  if (!raw) {
    return [];
  }
  const checks = [];
  const hasTitle = /<title>[^<\s][^<]*<\/title>/i.test(raw);
  checks.push({
    id: "html-title",
    title: "index.html has a non-empty <title>",
    status: hasTitle ? "pass" : "fail",
    message: hasTitle ? void 0 : "Set a real <title> in index.html before launch."
  });
  const hasViewport = raw.includes('name="viewport"');
  checks.push({
    id: "viewport",
    title: "Viewport meta tag exists",
    status: hasViewport ? "pass" : "warn",
    message: hasViewport ? void 0 : "Add a viewport tag for responsive behavior."
  });
  const hasDescription = raw.includes('name="description"');
  checks.push({
    id: "meta-description",
    title: "Meta description exists",
    status: hasDescription ? "pass" : "warn",
    message: hasDescription ? void 0 : "Add a meta description for better search previews."
  });
  const hasOpenGraph = raw.includes("og:title") || raw.includes("og:description");
  checks.push({
    id: "open-graph",
    title: "Open Graph metadata exists",
    status: hasOpenGraph ? "pass" : "warn",
    message: hasOpenGraph ? void 0 : "Add og:title and og:description before sharing the site publicly."
  });
  return checks;
};

// src/modules/launchcheck/checks/package.ts
var packageChecks = async ({ context }) => {
  const checks = [];
  checks.push({
    id: "package-json",
    title: "package.json exists",
    status: context.packageJson ? "pass" : "fail",
    message: context.packageJson ? void 0 : "This does not look like a Node project."
  });
  if (!context.packageJson) {
    return checks;
  }
  checks.push({
    id: "build-script",
    title: "Build script exists",
    status: context.scripts.build ? "pass" : "fail",
    message: context.scripts.build ? void 0 : "Add a build script before deploying."
  });
  return checks;
};

// src/modules/launchcheck/checks/vercel.ts
import path8 from "path";
var vercelChecks = async ({ context }) => {
  if (context.framework !== "react-vite" || !context.hasReactRouter) {
    return [];
  }
  const vercelPath = path8.join(context.rootDir, "vercel.json");
  if (!await fileExists(vercelPath)) {
    return [
      {
        id: "vercel-json",
        title: "Vercel SPA rewrite exists",
        status: "fail",
        message: "React Router apps on Vercel need a fallback rewrite to /index.html."
      }
    ];
  }
  const raw = await readTextFile(vercelPath);
  const hasRewrite = Boolean(raw?.includes("index.html"));
  return [
    {
      id: "vercel-spa-rewrite",
      title: "Vercel SPA rewrite exists",
      status: hasRewrite ? "pass" : "fail",
      message: hasRewrite ? void 0 : "vercel.json exists, but it does not appear to rewrite to /index.html."
    }
  ];
};

// src/modules/launchcheck/checks/index.ts
var LOCAL_CHECKS = [
  packageChecks,
  envChecks,
  vercelChecks,
  metadataChecks,
  imageChecks,
  linkChecks,
  buildChecks
];
var LIVE_CHECKS = [liveChecks];
var ALL_CHECKS = [
  ...LOCAL_CHECKS,
  ...LIVE_CHECKS
];

// src/modules/launchcheck/index.ts
async function runLaunchCheck(options) {
  const context = await detectProjectContext(options.cwd);
  if (options.liveOnly && !options.url) {
    throw new Error("--live-only requires --url <url>.");
  }
  const runners = options.liveOnly ? LIVE_CHECKS : options.url ? [...LOCAL_CHECKS, ...LIVE_CHECKS] : LOCAL_CHECKS;
  const checks = [];
  for (const runner of runners) {
    const result = await runner({
      context,
      url: options.url,
      skipBuild: options.skipBuild
    });
    checks.push(...result);
  }
  return {
    projectRoot: context.rootDir,
    score: calculateScore(checks, options.strict),
    status: aggregateStatus(checks, options.strict),
    strict: options.strict,
    checks
  };
}
function calculateScore(checks, strict) {
  if (checks.length === 0) return 0;
  const weights = { pass: 10, warn: strict ? 0 : 5, fail: 0 };
  const earned = checks.reduce((sum, check) => sum + weights[check.status], 0);
  const total = checks.length * 10;
  return Math.round(earned / total * 100);
}
function aggregateStatus(checks, strict) {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return strict ? "fail" : "warn";
  return "pass";
}

// src/commands/launch/index.ts
var Launch = class _Launch extends Command {
  static description = "Run a practical pre-launch checklist for React/Vite/Vercel client sites.";
  static examples = [
    "forge launch",
    "forge launch --skip-build",
    "forge launch --json",
    "forge launch --strict",
    "forge launch --url https://example.com",
    "forge launch --url https://example.com --strict",
    "forge launch --url https://example.com --live-only"
  ];
  static flags = {
    url: Flags.string({
      description: "Production URL to fetch and validate (status, headers, HTML, TTFB)."
    }),
    json: Flags.boolean({
      description: "Output results as JSON.",
      default: false
    }),
    "skip-build": Flags.boolean({
      description: "Skip running the production build (faster but less safe).",
      default: false
    }),
    "live-only": Flags.boolean({
      description: "Skip local checks and only validate the live deployment. Requires --url.",
      default: false
    }),
    strict: Flags.boolean({
      description: "Treat warnings as launch blockers in the overall score and status.",
      default: false
    })
  };
  async run() {
    const { flags } = await this.parse(_Launch);
    const result = await runLaunchCheck({
      cwd: process.cwd(),
      url: flags.url,
      skipBuild: flags["skip-build"],
      strict: flags.strict,
      liveOnly: flags["live-only"]
    });
    if (flags.json) {
      this.log(JSON.stringify(result, null, 2));
      return;
    }
    this.log("Forge Launch Check");
    this.log(`Checked: ${result.projectRoot}`);
    this.log(
      `Score: ${result.score}/100 \u2014 ${result.status.toUpperCase()}${result.strict ? " (strict)" : ""}`
    );
    this.log("");
    for (const check of result.checks) {
      const symbol = check.status === "pass" ? "\u2713" : check.status === "warn" ? "!" : "\u2717";
      this.log(`${symbol} [${check.status.toUpperCase()}] ${check.title}`);
      if (check.message) {
        this.log(`  ${check.message}`);
      }
    }
    const counts = {
      pass: result.checks.filter((c) => c.status === "pass").length,
      warn: result.checks.filter((c) => c.status === "warn").length,
      fail: result.checks.filter((c) => c.status === "fail").length
    };
    this.log("");
    this.log(
      `${counts.pass} passed, ${counts.warn} warning(s), ${counts.fail} failing.`
    );
  }
};
export {
  Launch as default
};
//# sourceMappingURL=index.js.map