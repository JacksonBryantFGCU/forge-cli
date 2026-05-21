// src/commands/doctor/index.ts
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

// src/commands/doctor/index.ts
var CATEGORIES = [
  "project",
  "env",
  "deployment",
  "react",
  "express",
  "security"
];
function statusFor(issue) {
  if (issue.fixed) return "FIXED";
  if (issue.fixPreview) return "PREVIEW";
  if (issue.fixSkipped) return "SKIPPED";
  return "OPEN";
}
function markerFor(status) {
  switch (status) {
    case "FIXED":
      return "\u2713";
    case "PREVIEW":
      return "\u2192";
    case "SKIPPED":
      return "\u21B7";
    case "OPEN":
      return "\u2022";
  }
}
var Doctor = class _Doctor extends Command {
  static description = "Scan the current project for common setup, config, and deployment issues.";
  static examples = [
    "forge doctor",
    "forge doctor --fix",
    "forge doctor --fix --dry-run",
    "forge doctor --json",
    "forge doctor --category deployment",
    "forge doctor --category deployment --fix",
    "forge doctor --rule missing-env-example"
  ];
  static flags = {
    fix: Flags.boolean({
      description: "Attempt to automatically fix supported issues.",
      default: false
    }),
    "dry-run": Flags.boolean({
      description: "When used with --fix, preview the changes without writing files.",
      default: false
    }),
    json: Flags.boolean({
      description: "Output results as JSON.",
      default: false
    }),
    category: Flags.string({
      description: "Only run rules in this category.",
      options: CATEGORIES
    }),
    rule: Flags.string({
      description: "Only run the rule with this id."
    })
  };
  async run() {
    const { flags } = await this.parse(_Doctor);
    const result = await runDoctor({
      cwd: process.cwd(),
      fix: flags.fix,
      dryRun: flags["dry-run"],
      category: flags.category,
      rule: flags.rule
    });
    if (flags.json) {
      this.log(JSON.stringify(result, null, 2));
      return;
    }
    this.log("Forge Doctor");
    this.log(`Checked: ${result.projectRoot}`);
    if (flags.fix && flags["dry-run"]) {
      this.log("(dry-run \u2014 no files will be written)");
    }
    this.log("");
    if (result.issues.length === 0) {
      this.log("\u2713 No issues found.");
      return;
    }
    for (const issue of result.issues) {
      const status = statusFor(issue);
      const label = status === "OPEN" ? issue.severity.toUpperCase() : status;
      this.log(
        `${markerFor(status)} [${label}] [${issue.category}] ${issue.title}`
      );
      this.log(`  ${issue.message}`);
      this.log("");
    }
    const counts = {
      fixed: result.issues.filter((i) => i.fixed).length,
      preview: result.issues.filter((i) => i.fixPreview).length,
      skipped: result.issues.filter((i) => i.fixSkipped).length
    };
    const remaining = result.issues.length - counts.fixed - counts.preview - counts.skipped;
    if (flags.fix) {
      this.log(
        `${counts.fixed} fixed, ${counts.preview} previewed, ${counts.skipped} skipped, ${remaining} still open (${result.issues.length} total).`
      );
    } else {
      this.log(`${result.issues.length} issue(s) found.`);
    }
  }
};
export {
  Doctor as default
};
//# sourceMappingURL=index.js.map