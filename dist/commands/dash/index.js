// src/commands/dash/index.ts
import { Command, Flags } from "@oclif/core";

// src/modules/devdash/index.ts
import { execa as execa2 } from "execa";

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
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}
async function readTextFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
async function writeTextFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
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

// src/modules/repo-doctor/rules/express-security.ts
import path5 from "path";

// src/modules/repo-doctor/fixes/express.ts
import path4 from "path";

// src/modules/repo-doctor/utils/safe-text-replace.ts
function replaceLiteralOnce(input, find, replace) {
  const idx = input.indexOf(find);
  if (idx === -1) return null;
  return input.slice(0, idx) + replace + input.slice(idx + find.length);
}
function insertAfter(input, anchor, insertion) {
  const idx = input.indexOf(anchor);
  if (idx === -1) return null;
  const cut = idx + anchor.length;
  return input.slice(0, cut) + insertion + input.slice(cut);
}

// src/modules/repo-doctor/fixes/express.ts
var CANDIDATES = [
  path4.join("src", "index.ts"),
  path4.join("src", "server.ts"),
  "index.ts",
  "server.ts",
  path4.join("src", "index.js"),
  path4.join("src", "server.js"),
  "index.js",
  "server.js"
];
async function findPrimaryServerFile(rootDir) {
  const matches = [];
  for (const candidate of CANDIDATES) {
    const filePath = path4.join(rootDir, candidate);
    if (!await fileExists(filePath)) continue;
    const contents = await readTextFile(filePath);
    if (contents && /express\s*\(/.test(contents)) {
      matches.push({ filePath, contents });
    }
  }
  if (matches.length !== 1) return null;
  return matches[0];
}
function findLastImportEnd(source) {
  const lines = source.split("\n");
  let lastIdx = -1;
  let charCount = 0;
  for (const line of lines) {
    const lineLength = line.length + 1;
    if (/^\s*import\b/.test(line) || /^\s*const\s+\w+\s*=\s*require\(/.test(line)) {
      lastIdx = charCount + line.length;
    }
    charCount += lineLength;
  }
  return lastIdx;
}
async function fixExpressMissingHelmet(ctx, options) {
  const found = await findPrimaryServerFile(ctx.rootDir);
  if (!found) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not identify a single Express entrypoint to modify safely."
    };
  }
  const { filePath, contents } = found;
  if (contents.includes("helmet(")) {
    return {
      fixed: false,
      skipped: true,
      message: "helmet() is already used \u2014 nothing to do."
    };
  }
  const importEnd = findLastImportEnd(contents);
  if (importEnd === -1) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not find a safe place to insert the helmet import \u2014 leaving the file alone."
    };
  }
  const withImport = contents.slice(0, importEnd) + `
import helmet from "helmet";` + contents.slice(importEnd);
  const expressDecl = /const\s+app\s*=\s*express\s*\([^)]*\)\s*;?/;
  const declMatch = withImport.match(expressDecl);
  if (!declMatch) {
    return {
      fixed: false,
      skipped: true,
      message: "Found `helmet` import target but no `const app = express(...)` declaration \u2014 leaving the file alone."
    };
  }
  const next = insertAfter(withImport, declMatch[0], "\n\napp.use(helmet());");
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not insert app.use(helmet()) safely."
    };
  }
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would add helmet import and app.use(helmet()) to ${path4.relative(ctx.rootDir, filePath)}.`
    };
  }
  await writeTextFile(filePath, next);
  return {
    fixed: true,
    message: `Added helmet to ${path4.relative(ctx.rootDir, filePath)}.`
  };
}
async function fixExpressMissingJsonLimit(ctx, options) {
  const found = await findPrimaryServerFile(ctx.rootDir);
  if (!found) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not identify a single Express entrypoint to modify safely."
    };
  }
  const { filePath, contents } = found;
  if (contents.includes("express.json({ limit:")) {
    return {
      fixed: false,
      skipped: true,
      message: "express.json already has a limit configured."
    };
  }
  if (!contents.includes("express.json()")) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not find a literal `express.json()` call to upgrade \u2014 leaving the file alone."
    };
  }
  const next = replaceLiteralOnce(
    contents,
    "express.json()",
    `express.json({ limit: "1mb" })`
  );
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not replace express.json() safely."
    };
  }
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would set express.json({ limit: "1mb" }) in ${path4.relative(ctx.rootDir, filePath)}.`
    };
  }
  await writeTextFile(filePath, next);
  return {
    fixed: true,
    message: `Set express.json({ limit: "1mb" }) in ${path4.relative(ctx.rootDir, filePath)}.`
  };
}

// src/modules/repo-doctor/rules/express-security.ts
async function readExpressServerSources(rootDir) {
  const candidates = [
    path5.join(rootDir, "src", "index.ts"),
    path5.join(rootDir, "src", "server.ts"),
    path5.join(rootDir, "index.ts"),
    path5.join(rootDir, "server.ts"),
    path5.join(rootDir, "src", "index.js"),
    path5.join(rootDir, "src", "server.js"),
    path5.join(rootDir, "index.js"),
    path5.join(rootDir, "server.js")
  ];
  const contents = [];
  for (const candidate of candidates) {
    const raw = await readTextFile(candidate);
    if (raw) {
      contents.push(raw);
    }
  }
  return contents.join("\n");
}
async function getServerSourceIfExpress(ctx) {
  if (ctx.framework !== "express") {
    return null;
  }
  const combined = await readExpressServerSources(ctx.rootDir);
  return combined || null;
}
var expressMissingHelmetRule = {
  id: "express-missing-helmet",
  title: "Express app may be missing helmet",
  category: "express",
  severity: "medium",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);
    if (!source || source.includes("helmet(")) {
      return null;
    }
    return {
      id: "express-missing-helmet",
      title: "Express app may be missing helmet",
      category: "express",
      severity: "medium",
      message: "Use helmet() to add common security headers."
    };
  },
  fix: fixExpressMissingHelmet
};
var expressMissingJsonLimitRule = {
  id: "express-missing-json-limit",
  title: "Express JSON body limit may be missing",
  category: "express",
  severity: "medium",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);
    if (!source || source.includes("express.json({ limit:")) {
      return null;
    }
    return {
      id: "express-missing-json-limit",
      title: "Express JSON body limit may be missing",
      category: "express",
      severity: "medium",
      message: "Use express.json({ limit: '1mb' }) or similar to avoid accepting huge request bodies."
    };
  },
  fix: fixExpressMissingJsonLimit
};
var expressWildcardCorsRule = {
  id: "express-wildcard-cors",
  title: "Express CORS may allow all origins",
  category: "security",
  severity: "high",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);
    if (!source || !source.includes('origin: "*"') && !source.includes("origin: '*'")) {
      return null;
    }
    return {
      id: "express-wildcard-cors",
      title: "Express CORS may allow all origins",
      category: "security",
      severity: "high",
      message: "Avoid wildcard CORS in production. Use an explicit allowed origin list."
    };
  }
};
var expressSecurityRules = [
  expressMissingHelmetRule,
  expressMissingJsonLimitRule,
  expressWildcardCorsRule
];

// src/modules/repo-doctor/rules/frontend-env-secrets.ts
import fs2 from "fs/promises";
import path6 from "path";
var SUSPICIOUS_PATTERNS = [
  "SERVICE_ROLE",
  "SECRET",
  "PRIVATE_KEY",
  "ACCESS_TOKEN"
];
var SCANNABLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts"
]);
var IGNORED_DIRECTORIES = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".vercel",
  "coverage"
]);
async function collectSourceFiles(dir) {
  const files = [];
  const entries = await fs2.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") {
      continue;
    }
    const fullPath = path6.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      files.push(...await collectSourceFiles(fullPath));
      continue;
    }
    if (entry.isFile() && SCANNABLE_EXTENSIONS.has(path6.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}
async function scanForSuspiciousEnvUsage(srcDir) {
  const files = await collectSourceFiles(srcDir);
  const matches = [];
  for (const file of files) {
    const content = await readTextFile(file);
    if (!content) {
      continue;
    }
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (content.includes(pattern)) {
        matches.push({ file, pattern });
      }
    }
  }
  return matches;
}
var frontendEnvSecretsRule = {
  id: "frontend-env-secrets",
  title: "Frontend may reference secret env variables",
  category: "security",
  severity: "high",
  async check(ctx) {
    if (ctx.framework !== "react-vite") {
      return null;
    }
    const srcDir = path6.join(ctx.rootDir, "src");
    if (!await directoryExists(srcDir)) {
      return null;
    }
    const matches = await scanForSuspiciousEnvUsage(srcDir);
    if (matches.length === 0) {
      return null;
    }
    const unique = Array.from(new Set(matches.map((m) => m.pattern))).join(
      ", "
    );
    return {
      id: "frontend-env-secrets",
      title: "Frontend may reference secret env variables",
      category: "security",
      severity: "high",
      message: `Found references to suspicious names (${unique}) in src/. Vite only exposes variables prefixed with VITE_ to the browser, and any such value is publicly readable. Keep secrets on the server.`
    };
  }
};

// src/modules/repo-doctor/rules/index-html-metadata.ts
import path8 from "path";

// src/modules/repo-doctor/fixes/metadata.ts
import path7 from "path";

// src/modules/repo-doctor/utils/insert-into-html.ts
function insertIntoHead(html, tag) {
  const match = html.match(/^([ \t]*)<\/head>/m);
  if (!match) return null;
  const indent = match[1] ?? "";
  const insertAt = html.indexOf(match[0]);
  const lineIndent = `${indent}  `;
  return html.slice(0, insertAt) + lineIndent + tag + "\n" + html.slice(insertAt);
}
function htmlHasMeta(html, name) {
  const pattern = new RegExp(`<meta[^>]+name=["']${name}["']`, "i");
  return pattern.test(html);
}
function htmlHasOgTags(html) {
  return /<meta[^>]+property=["']og:(title|description)["']/i.test(html);
}

// src/modules/repo-doctor/fixes/metadata.ts
var VIEWPORT_TAG = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';
function describeProject(ctx) {
  return ctx.packageJson?.name ?? "this project";
}
async function applyHtmlInsertion(input) {
  const indexPath = path7.join(input.ctx.rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html not found \u2014 nothing to update."
    };
  }
  const raw = await readTextFile(indexPath);
  if (raw === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html could not be read."
    };
  }
  if (input.alreadyPresent(raw)) {
    return {
      fixed: false,
      skipped: true,
      message: "Tag already present \u2014 nothing to do."
    };
  }
  const next = insertIntoHead(raw, input.buildTag(input.ctx));
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html has no </head> closing tag \u2014 refusing to edit blindly."
    };
  }
  if (input.options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would update index.html: ${input.successMessage}`
    };
  }
  await writeTextFile(indexPath, next);
  return { fixed: true, message: input.successMessage };
}
function fixMissingViewportMeta(ctx, options) {
  return applyHtmlInsertion({
    ctx,
    options,
    alreadyPresent: (html) => htmlHasMeta(html, "viewport"),
    buildTag: () => VIEWPORT_TAG,
    successMessage: "Added viewport meta tag to index.html."
  });
}
function fixMissingMetaDescription(ctx, options) {
  return applyHtmlInsertion({
    ctx,
    options,
    alreadyPresent: (html) => htmlHasMeta(html, "description"),
    buildTag: (c) => `<meta name="description" content="${describeProject(c)}" />`,
    successMessage: "Added meta description to index.html."
  });
}
async function fixMissingOpenGraphTags(ctx, options) {
  const indexPath = path7.join(ctx.rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html not found \u2014 nothing to update."
    };
  }
  const raw = await readTextFile(indexPath);
  if (raw === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html could not be read."
    };
  }
  if (htmlHasOgTags(raw)) {
    return {
      fixed: false,
      skipped: true,
      message: "Open Graph tags already present."
    };
  }
  const name = describeProject(ctx);
  const ogTitle = `<meta property="og:title" content="${name}" />`;
  const ogDescription = `<meta property="og:description" content="${name}" />`;
  const afterTitle = insertIntoHead(raw, ogTitle);
  if (afterTitle === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html has no </head> closing tag \u2014 refusing to edit blindly."
    };
  }
  const next = insertIntoHead(afterTitle, ogDescription);
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html has no </head> closing tag \u2014 refusing to edit blindly."
    };
  }
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: "Would add og:title and og:description meta tags to index.html."
    };
  }
  await writeTextFile(indexPath, next);
  return {
    fixed: true,
    message: "Added og:title and og:description meta tags to index.html."
  };
}

// src/modules/repo-doctor/rules/index-html-metadata.ts
async function readIndexHtml(rootDir) {
  const indexPath = path8.join(rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return null;
  }
  return readTextFile(indexPath);
}
var missingViewportMetaRule = {
  id: "missing-viewport-meta",
  title: "Missing viewport meta tag",
  category: "react",
  severity: "medium",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);
    if (!raw || raw.includes('name="viewport"')) {
      return null;
    }
    return {
      id: "missing-viewport-meta",
      title: "Missing viewport meta tag",
      category: "react",
      severity: "medium",
      message: "Add a viewport meta tag to index.html for proper responsive behavior."
    };
  },
  fix: fixMissingViewportMeta
};
var missingMetaDescriptionRule = {
  id: "missing-meta-description",
  title: "Missing meta description",
  category: "react",
  severity: "low",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);
    if (!raw || raw.includes('name="description"')) {
      return null;
    }
    return {
      id: "missing-meta-description",
      title: "Missing meta description",
      category: "react",
      severity: "low",
      message: "Add a meta description to improve search and link previews."
    };
  },
  fix: fixMissingMetaDescription
};
var missingOpenGraphTagsRule = {
  id: "missing-open-graph-tags",
  title: "Missing Open Graph metadata",
  category: "react",
  severity: "low",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);
    if (!raw || htmlHasOgTags(raw)) {
      return null;
    }
    return {
      id: "missing-open-graph-tags",
      title: "Missing Open Graph metadata",
      category: "react",
      severity: "low",
      message: "Add og:title and og:description meta tags before sharing the site publicly."
    };
  },
  fix: fixMissingOpenGraphTags
};
var indexHtmlMetadataRules = [
  missingViewportMetaRule,
  missingMetaDescriptionRule,
  missingOpenGraphTagsRule
];

// src/modules/repo-doctor/rules/missing-env-example.ts
import path9 from "path";
var missingEnvExampleRule = {
  id: "missing-env-example",
  title: "Missing .env.example",
  category: "env",
  severity: "medium",
  async check(ctx) {
    if (!ctx.packageJson || ctx.envFiles.includes(".env.example")) {
      return null;
    }
    return {
      id: "missing-env-example",
      title: "Missing .env.example",
      category: "env",
      severity: "medium",
      message: "Add .env.example so required environment variables are documented."
    };
  },
  async fix(ctx, options) {
    if (options.dryRun) {
      return {
        fixed: false,
        preview: true,
        message: "Would create .env.example."
      };
    }
    await writeTextFile(
      path9.join(ctx.rootDir, ".env.example"),
      "# Add required environment variables here.\n"
    );
    return {
      fixed: true,
      message: "Created .env.example."
    };
  }
};

// src/modules/repo-doctor/rules/missing-package-json.ts
var missingPackageJsonRule = {
  id: "missing-package-json",
  title: "Missing package.json",
  category: "project",
  severity: "high",
  async check(ctx) {
    if (ctx.packageJson) {
      return null;
    }
    return {
      id: "missing-package-json",
      title: "Missing package.json",
      category: "project",
      severity: "high",
      message: "This directory does not look like a Node/TypeScript project."
    };
  }
};

// src/modules/repo-doctor/fixes/scripts.ts
import path10 from "path";

// src/modules/repo-doctor/utils/update-package-json.ts
function addScript(pkg, name, command) {
  const existing = pkg.scripts ?? {};
  if (existing[name]) {
    return { next: pkg, added: false };
  }
  return {
    next: {
      ...pkg,
      scripts: { ...existing, [name]: command }
    },
    added: true
  };
}
function serializePackageJson(pkg) {
  return `${JSON.stringify(pkg, null, 2)}
`;
}

// src/modules/repo-doctor/fixes/scripts.ts
function suggestedBuildCommand(ctx) {
  switch (ctx.framework) {
    case "react-vite":
      return "tsc -b && vite build";
    case "next":
      return "next build";
    case "express":
      return ctx.language === "typescript" ? "tsc" : null;
    case "node":
    case "unknown":
      return null;
  }
}
function hasEslint(ctx) {
  return Boolean(
    ctx.dependencies["eslint"] || ctx.devDependencies["eslint"]
  );
}
async function applyScriptFix(input) {
  if (input.command === null) {
    return {
      fixed: false,
      skipped: true,
      message: input.reasonWhenSkipped
    };
  }
  const pkgPath = path10.join(input.ctx.rootDir, "package.json");
  const raw = await readJsonFile(pkgPath);
  if (!raw) {
    return {
      fixed: false,
      skipped: true,
      message: "package.json could not be read."
    };
  }
  const { next, added } = addScript(raw, input.scriptName, input.command);
  if (!added) {
    return {
      fixed: false,
      skipped: true,
      message: `Script "${input.scriptName}" already exists \u2014 preserving it.`
    };
  }
  if (input.options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would add "${input.scriptName}": "${input.command}" to package.json.`
    };
  }
  await writeTextFile(pkgPath, serializePackageJson(next));
  return {
    fixed: true,
    message: `Added "${input.scriptName}": "${input.command}" to package.json.`
  };
}
function fixMissingBuildScript(ctx, options) {
  return applyScriptFix({
    ctx,
    options,
    scriptName: "build",
    command: suggestedBuildCommand(ctx),
    reasonWhenSkipped: "Cannot auto-fix a build script: framework is not a known type with a default build command."
  });
}
function fixMissingLintScript(ctx, options) {
  return applyScriptFix({
    ctx,
    options,
    scriptName: "lint",
    command: hasEslint(ctx) ? "eslint ." : null,
    reasonWhenSkipped: "Cannot auto-fix a lint script: ESLint is not installed. Add `eslint` first."
  });
}

// src/modules/repo-doctor/rules/missing-scripts.ts
var missingBuildScriptRule = {
  id: "missing-build-script",
  title: "Missing build script",
  category: "project",
  severity: "medium",
  async check(ctx) {
    if (!ctx.packageJson || ctx.scripts.build) {
      return null;
    }
    return {
      id: "missing-build-script",
      title: "Missing build script",
      category: "project",
      severity: "medium",
      message: "Add a build script so deployment tools can build the project consistently."
    };
  },
  fix: fixMissingBuildScript
};
var missingLintScriptRule = {
  id: "missing-lint-script",
  title: "Missing lint script",
  category: "project",
  severity: "low",
  async check(ctx) {
    if (!ctx.packageJson || ctx.scripts.lint) {
      return null;
    }
    return {
      id: "missing-lint-script",
      title: "Missing lint script",
      category: "project",
      severity: "low",
      message: "Add a lint script so code quality checks are easy to run."
    };
  },
  fix: fixMissingLintScript
};
var missingScriptsRules = [
  missingBuildScriptRule,
  missingLintScriptRule
];

// src/modules/repo-doctor/rules/vercel-spa-rewrite.ts
import path12 from "path";

// src/modules/repo-doctor/fixes/vercel.ts
import path11 from "path";
var VERCEL_SPA_CONFIG = {
  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ]
};
async function fixVercelSpaRewrite(ctx, options) {
  const vercelPath = path11.join(ctx.rootDir, "vercel.json");
  if (await fileExists(vercelPath)) {
    return {
      fixed: false,
      skipped: true,
      message: "vercel.json already exists. Refusing to overwrite \u2014 edit it manually to add the SPA rewrite."
    };
  }
  const content = `${JSON.stringify(VERCEL_SPA_CONFIG, null, 2)}
`;
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: "Would create vercel.json with SPA fallback rewrite."
    };
  }
  await writeTextFile(vercelPath, content);
  return {
    fixed: true,
    message: "Created vercel.json with SPA fallback rewrite."
  };
}

// src/modules/repo-doctor/rules/vercel-spa-rewrite.ts
var vercelSpaRewriteRule = {
  id: "vercel-spa-rewrite",
  title: "Vercel SPA rewrite",
  category: "deployment",
  severity: "high",
  async check(ctx) {
    if (ctx.framework !== "react-vite" || !ctx.hasReactRouter) {
      return null;
    }
    const vercelPath = path12.join(ctx.rootDir, "vercel.json");
    if (!await fileExists(vercelPath)) {
      return {
        id: "vercel-spa-rewrite",
        title: "Missing vercel.json for React Router app",
        category: "deployment",
        severity: "high",
        message: "Create vercel.json with a fallback rewrite to /index.html to avoid 404s on refresh."
      };
    }
    const raw = await readTextFile(vercelPath);
    if (!raw?.includes("index.html")) {
      return {
        id: "vercel-spa-rewrite",
        title: "Vercel SPA rewrite may be missing",
        category: "deployment",
        severity: "high",
        message: "vercel.json exists, but it does not appear to rewrite unmatched routes to /index.html."
      };
    }
    return null;
  },
  fix: fixVercelSpaRewrite
};

// src/modules/repo-doctor/rules/index.ts
var allRules = [
  missingPackageJsonRule,
  ...missingScriptsRules,
  missingEnvExampleRule,
  vercelSpaRewriteRule,
  ...indexHtmlMetadataRules,
  ...expressSecurityRules,
  frontendEnvSecretsRule
];

// src/modules/repo-doctor/index.ts
async function runDoctor(options) {
  const ctx = await detectProjectContext(options.cwd);
  const selectedRules = allRules.filter(
    (rule) => matchesSelection(rule, options)
  );
  const issues = [];
  for (const rule of selectedRules) {
    const issue = await rule.check(ctx);
    if (!issue) {
      continue;
    }
    if (options.fix && rule.fix) {
      const fixResult = await rule.fix(ctx, {
        dryRun: Boolean(options.dryRun)
      });
      if (fixResult.fixed) {
        issue.fixed = true;
      }
      if (fixResult.preview) {
        issue.fixPreview = true;
      }
      if (fixResult.skipped) {
        issue.fixSkipped = true;
      }
      if (fixResult.message) {
        issue.message = fixResult.message;
      }
    }
    issues.push(issue);
  }
  return {
    projectRoot: ctx.rootDir,
    issues
  };
}
function matchesSelection(rule, options) {
  if (options.rule && rule.id !== options.rule) {
    return false;
  }
  if (options.category && rule.category !== options.category) {
    return false;
  }
  return true;
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
import path13 from "path";
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
    const raw = await readTextFile(path13.join(rootDir, candidate));
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
import fs3 from "fs/promises";
import path14 from "path";
var MAX_BYTES = 1e6;
var imageChecks = async ({ context }) => {
  const publicDir = path14.join(context.rootDir, "public");
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
    message: `${largeFiles.length} file(s) over 1 MB in public/. Compress before launch (${largeFiles.slice(0, 3).map((f) => path14.relative(context.rootDir, f)).join(", ")}${largeFiles.length > 3 ? ", ..." : ""}).`
  };
  return [check];
};
async function findLargeFiles(dir, maxBytes) {
  const results = [];
  const entries = await fs3.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path14.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findLargeFiles(fullPath, maxBytes));
      continue;
    }
    if (!entry.isFile()) continue;
    const stat = await fs3.stat(fullPath);
    if (stat.size > maxBytes) {
      results.push(fullPath);
    }
  }
  return results;
}

// src/modules/launchcheck/checks/links.ts
import fs4 from "fs/promises";
import path15 from "path";
var SCANNABLE_EXTENSIONS2 = /* @__PURE__ */ new Set([".tsx", ".jsx", ".ts", ".js", ".html"]);
var IGNORED_DIRECTORIES2 = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".vercel",
  ".turbo",
  "coverage"
]);
var SUSPICIOUS_PATTERNS2 = [
  /href=["']\s*#\s*["']/g,
  /href=["']TODO["']/gi,
  /href=["']FIXME["']/gi,
  /to=["']TODO["']/gi,
  /to=["']FIXME["']/gi,
  /href=["']javascript:void\(0\)["']/gi
];
var linkChecks = async ({ context }) => {
  const targets = [];
  const srcDir = path15.join(context.rootDir, "src");
  if (await directoryExists(srcDir)) {
    targets.push(...await collectFiles(srcDir));
  }
  const indexHtml = path15.join(context.rootDir, "index.html");
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
    for (const pattern of SUSPICIOUS_PATTERNS2) {
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
      (f) => `${path15.relative(context.rootDir, f.file)} (${f.snippet})`
    ).join("; ")}${findings.length > 3 ? "; ..." : ""}.`
  };
  return [check];
};
async function collectFiles(dir) {
  const results = [];
  const entries = await fs4.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path15.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES2.has(entry.name)) continue;
      results.push(...await collectFiles(fullPath));
      continue;
    }
    if (entry.isFile() && SCANNABLE_EXTENSIONS2.has(path15.extname(entry.name).toLowerCase())) {
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
import path16 from "path";
var metadataChecks = async ({ context }) => {
  if (context.framework !== "react-vite" && context.framework !== "next") {
    return [];
  }
  const indexPath = path16.join(context.rootDir, "index.html");
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
import path17 from "path";
var vercelChecks = async ({ context }) => {
  if (context.framework !== "react-vite" || !context.hasReactRouter) {
    return [];
  }
  const vercelPath = path17.join(context.rootDir, "vercel.json");
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

// src/modules/devdash/index.ts
async function getProjectDashboard(options) {
  const context = await detectProjectContext(options.cwd);
  if (!context.packageJson) {
    return {
      projectRoot: context.rootDir,
      rows: [
        { label: "Project", value: "Unknown" },
        { label: "Status", value: "No package.json found" }
      ],
      doctor: null,
      launch: null
    };
  }
  const doctor = await summarizeDoctor(context.rootDir);
  const launch = options.withLaunch ? await summarizeLaunch(context.rootDir, !options.withBuild) : null;
  const rows = [
    { label: "Project", value: context.packageJson.name ?? "Unnamed project" },
    { label: "Framework", value: formatFramework(context.framework) },
    { label: "Language", value: formatLanguage(context.language) },
    { label: "Package manager", value: context.packageManager },
    { label: "TypeScript", value: context.language === "typescript" ? "yes" : "no" },
    { label: "Tailwind", value: context.hasTailwind ? "yes" : "no" },
    { label: "React Router", value: context.hasReactRouter ? "yes" : "no" },
    { label: "Git", value: await getGitStatus(context.rootDir) },
    {
      label: "Env files",
      value: context.envFiles.length > 0 ? context.envFiles.join(", ") : "none"
    },
    {
      label: "Scripts",
      value: Object.keys(context.scripts).length > 0 ? Object.keys(context.scripts).join(", ") : "none"
    },
    { label: "Doctor", value: formatDoctorSummary(doctor) }
  ];
  if (launch) {
    rows.push({ label: "Launch", value: formatLaunchSummary(launch) });
  }
  return {
    projectRoot: context.rootDir,
    rows,
    doctor,
    launch
  };
}
async function summarizeDoctor(cwd) {
  const result = await runDoctor({ cwd, fix: false });
  return summarizeDoctorIssues(result.issues);
}
function summarizeDoctorIssues(issues) {
  const bySeverity = {
    low: 0,
    medium: 0,
    high: 0
  };
  for (const issue of issues) {
    bySeverity[issue.severity]++;
  }
  return {
    total: issues.length,
    bySeverity
  };
}
async function summarizeLaunch(cwd, skipBuild) {
  const result = await runLaunchCheck({
    cwd,
    skipBuild,
    strict: false
  });
  return summarizeLaunchResult(result, !skipBuild);
}
function summarizeLaunchResult(result, ranBuild) {
  return {
    score: result.score,
    status: result.status,
    pass: result.checks.filter((c) => c.status === "pass").length,
    warn: result.checks.filter((c) => c.status === "warn").length,
    fail: result.checks.filter((c) => c.status === "fail").length,
    ranBuild
  };
}
function formatDoctorSummary(summary) {
  if (summary.total === 0) return "clean";
  const parts = [`${summary.total} issue(s)`];
  if (summary.bySeverity.high > 0) parts.push(`${summary.bySeverity.high} high`);
  if (summary.bySeverity.medium > 0)
    parts.push(`${summary.bySeverity.medium} medium`);
  if (summary.bySeverity.low > 0) parts.push(`${summary.bySeverity.low} low`);
  return parts.join(", ");
}
function formatLaunchSummary(summary) {
  const buildNote = summary.ranBuild ? "with build" : "no build";
  return `${summary.score}/100 \u2014 ${summary.status.toUpperCase()} (${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail, ${buildNote})`;
}
function formatFramework(framework) {
  switch (framework) {
    case "react-vite":
      return "React + Vite";
    case "next":
      return "Next.js";
    case "express":
      return "Express";
    case "node":
      return "Node";
    default:
      return "Unknown";
  }
}
function formatLanguage(language) {
  switch (language) {
    case "typescript":
      return "TypeScript";
    case "javascript":
      return "JavaScript";
    default:
      return "Unknown";
  }
}
async function getGitStatus(cwd) {
  try {
    const result = await execa2("git", ["status", "--short"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe"
    });
    const changedFiles = result.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
    return changedFiles.length === 0 ? "clean" : `${changedFiles.length} changed file(s)`;
  } catch {
    return "not a git repo";
  }
}

// src/commands/dash/index.ts
var Dash = class _Dash extends Command {
  static description = "Show a terminal dashboard summarizing the current project.";
  static examples = [
    "forge dash",
    "forge dash --json",
    "forge dash --with-launch",
    "forge dash --with-launch --with-build"
  ];
  static flags = {
    json: Flags.boolean({
      description: "Output the dashboard as JSON.",
      default: false
    }),
    "with-launch": Flags.boolean({
      description: "Include a launch-check summary (skips the build by default).",
      default: false
    }),
    "with-build": Flags.boolean({
      description: "When combined with --with-launch, run the production build as part of the launch check.",
      default: false
    })
  };
  async run() {
    const { flags } = await this.parse(_Dash);
    const dashboard = await getProjectDashboard({
      cwd: process.cwd(),
      withLaunch: flags["with-launch"],
      withBuild: flags["with-build"]
    });
    if (flags.json) {
      this.log(JSON.stringify(dashboard, null, 2));
      return;
    }
    this.log("Forge Dashboard");
    this.log("");
    for (const row of dashboard.rows) {
      this.log(`${row.label}: ${row.value}`);
    }
  }
};
export {
  Dash as default
};
//# sourceMappingURL=index.js.map