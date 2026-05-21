// src/commands/prompt/index.ts
import { Args, Command, Flags } from "@oclif/core";

// src/core/config.ts
import os from "os";
import path2 from "path";

// src/schemas/forge-config.schema.ts
import { z } from "zod";
var ForgeConfigSchema = z.object({
  version: z.string().default("0.1.0"),
  preferredPackageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
  defaultPromptMode: z.enum(["plan", "implement", "review"]).default("plan"),
  componentStyle: z.enum(["named-export", "default-export"]).default("named-export"),
  testFramework: z.enum(["vitest", "jest", "none"]).default("vitest")
});

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
async function writeJsonFile(filePath, data) {
  await writeTextFile(filePath, `${JSON.stringify(data, null, 2)}
`);
}

// src/core/config.ts
function getForgeHomeDir() {
  return path2.join(os.homedir(), ".forge");
}
function getForgeConfigPath() {
  return path2.join(getForgeHomeDir(), "config.json");
}
async function ensureForgeHome() {
  await ensureDir(getForgeHomeDir());
  await ensureDir(path2.join(getForgeHomeDir(), "recipes"));
  await ensureDir(path2.join(getForgeHomeDir(), "prompts"));
  await ensureDir(path2.join(getForgeHomeDir(), "templates"));
}
async function readForgeConfig() {
  await ensureForgeHome();
  const configPath = getForgeConfigPath();
  const rawConfig = await readJsonFile(configPath);
  if (!rawConfig) {
    const defaultConfig = ForgeConfigSchema.parse({});
    await writeForgeConfig(defaultConfig);
    return defaultConfig;
  }
  const parsed = ForgeConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    const defaultConfig = ForgeConfigSchema.parse({});
    await writeForgeConfig(defaultConfig);
    return defaultConfig;
  }
  return parsed.data;
}
async function writeForgeConfig(config) {
  await ensureForgeHome();
  await writeJsonFile(getForgeConfigPath(), ForgeConfigSchema.parse(config));
}

// src/core/project-detector.ts
import path4 from "path";

// src/core/package-manager.ts
import path3 from "path";
async function detectPackageManager(rootDir) {
  if (await fileExists(path3.join(rootDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (await fileExists(path3.join(rootDir, "yarn.lock"))) {
    return "yarn";
  }
  if (await fileExists(path3.join(rootDir, "bun.lockb"))) {
    return "bun";
  }
  if (await fileExists(path3.join(rootDir, "bun.lock"))) {
    return "bun";
  }
  if (await fileExists(path3.join(rootDir, "package-lock.json"))) {
    return "npm";
  }
  return "unknown";
}

// src/core/project-detector.ts
async function detectProjectContext(cwd) {
  const rootDir = cwd;
  const packageJsonPath = path4.join(rootDir, "package.json");
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
    hasGit: await directoryExists(path4.join(rootDir, ".git")),
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
  if (await fileExists(path4.join(rootDir, "package.json"))) {
    return "node";
  }
  return "unknown";
}
async function detectLanguage(rootDir, dependencies, devDependencies) {
  if (await fileExists(path4.join(rootDir, "tsconfig.json")) || hasDependency(dependencies, devDependencies, "typescript")) {
    return "typescript";
  }
  if (await fileExists(path4.join(rootDir, "package.json"))) {
    return "javascript";
  }
  return "unknown";
}
async function detectTailwind(rootDir, dependencies, devDependencies) {
  return hasDependency(dependencies, devDependencies, "tailwindcss") || await fileExists(path4.join(rootDir, "tailwind.config.js")) || await fileExists(path4.join(rootDir, "tailwind.config.ts")) || await fileExists(path4.join(rootDir, "tailwind.config.cjs")) || await fileExists(path4.join(rootDir, "tailwind.config.mjs"));
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
    if (await fileExists(path4.join(rootDir, candidate))) {
      existing.push(candidate);
    }
  }
  return existing;
}
function hasDependency(dependencies, devDependencies, name) {
  return Boolean(dependencies[name] || devDependencies[name]);
}

// src/core/template-loader.ts
import fs2 from "fs/promises";
import os2 from "os";
import path5 from "path";
import { fileURLToPath } from "url";
import { Eta } from "eta";
var eta = new Eta({
  useWith: true,
  autoEscape: false,
  autoTrim: false
});
var moduleDir = path5.dirname(fileURLToPath(import.meta.url));
var cachedBundledRoot = null;
async function findUpwards(startDir, relativeTarget) {
  let current = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path5.join(current, relativeTarget);
    if (await directoryExists(candidate)) {
      return candidate;
    }
    const parent = path5.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
async function resolveBundledTemplatesRoot() {
  if (cachedBundledRoot) return cachedBundledRoot;
  const distRoot = await findUpwards(moduleDir, path5.join("dist", "templates"));
  if (distRoot) {
    cachedBundledRoot = distRoot;
    return cachedBundledRoot;
  }
  const srcRoot = await findUpwards(moduleDir, path5.join("src", "templates"));
  if (srcRoot) {
    cachedBundledRoot = srcRoot;
    return cachedBundledRoot;
  }
  throw new Error(
    "Could not locate a bundled templates directory (looked for dist/templates and src/templates)."
  );
}
function getUserTemplatesRoot() {
  return path5.join(os2.homedir(), ".forge", "templates");
}
function resolveUserTemplatePath(...segments) {
  return path5.join(getUserTemplatesRoot(), ...segments);
}
async function resolveBundledTemplatePath(...segments) {
  const root = await resolveBundledTemplatesRoot();
  return path5.join(root, ...segments);
}
function renderTemplateString(template, data) {
  const result = eta.renderString(template, data);
  return typeof result === "string" ? result : "";
}
async function resolveTemplatePath(...segments) {
  const userPath = resolveUserTemplatePath(...segments);
  if (await fileExists(userPath)) {
    return userPath;
  }
  return resolveBundledTemplatePath(...segments);
}
async function loadTextTemplate(...segments) {
  const filePath = await resolveTemplatePath(...segments);
  const raw = await readTextFile(filePath);
  if (raw === null) {
    throw new Error(`Template not found: ${filePath}`);
  }
  return raw;
}
async function renderTextTemplate(segments, data) {
  const template = await loadTextTemplate(...segments);
  return renderTemplateString(template, data);
}

// src/modules/promptkit/types.ts
var PROMPT_TYPES = [
  "feature",
  "debug",
  "refactor",
  "audit",
  "test",
  "cleanup",
  "deploy",
  "review"
];

// src/modules/promptkit/index.ts
var TEMPLATE_FILES = {
  feature: "feature.md.eta",
  debug: "debug.md.eta",
  refactor: "refactor.md.eta",
  audit: "audit.md.eta",
  test: "test.md.eta",
  cleanup: "cleanup.md.eta",
  deploy: "deploy.md.eta",
  review: "review.md.eta"
};
async function generatePrompt(options) {
  const type = normalizeType(options.type);
  const mode = await resolveMode(options.mode);
  const context = await detectProjectContext(options.cwd);
  const data = {
    task: options.task,
    mode,
    framework: context.framework,
    language: context.language,
    packageManager: context.packageManager,
    hasTailwind: context.hasTailwind,
    hasReactRouter: context.hasReactRouter,
    scripts: formatScripts(context),
    constraints: [],
    modeInstructions: renderModeInstruction(mode)
  };
  const rendered = await renderTextTemplate(
    ["prompts", TEMPLATE_FILES[type]],
    data
  );
  return rendered.trimEnd() + "\n";
}
function formatScripts(context) {
  const keys = Object.keys(context.scripts);
  return keys.length > 0 ? keys.join(", ") : "none";
}
function renderModeInstruction(mode) {
  switch (mode) {
    case "plan":
      return "Inspect the relevant files and produce a clear implementation plan. Do not edit code yet \u2014 wait for approval before applying changes.";
    case "implement":
      return "Inspect the relevant files, implement the change, update or add tests where appropriate, and finish with a summary of what changed and why.";
    case "review":
      return "Read the relevant code and report findings with suggested changes. Do not edit files unless explicitly instructed to apply the suggestions.";
  }
}
function isPromptMode(value) {
  return value === "implement" || value === "review" || value === "plan";
}
async function resolveMode(mode) {
  if (mode && isPromptMode(mode)) {
    return mode;
  }
  if (mode && mode.length > 0) {
    throw new Error(
      `Unknown prompt mode: ${mode}. Supported: plan, implement, review`
    );
  }
  const config = await readForgeConfig();
  return config.defaultPromptMode;
}
function normalizeType(type) {
  const match = PROMPT_TYPES.find((t) => t === type);
  if (!match) {
    throw new Error(
      `Unknown prompt type: ${type}. Supported: ${PROMPT_TYPES.join(", ")}`
    );
  }
  return match;
}

// src/commands/prompt/index.ts
var Prompt = class _Prompt extends Command {
  static description = "Generate structured Claude Code prompts for features, debugging, refactors, audits, tests, cleanups, deploys, and reviews.";
  static examples = [
    'forge prompt feature "add Supabase auth"',
    'forge prompt feature "add contact form" --mode implement',
    'forge prompt debug "Vercel refresh gives 404"',
    'forge prompt refactor "split large React component" --mode plan',
    'forge prompt audit "check Express security" --mode review',
    'forge prompt cleanup "remove Stripe after Square migration" --mode plan',
    'forge prompt deploy "ship to Vercel" --mode plan',
    'forge prompt test "cover the checkout flow"',
    'forge prompt feature "add settings page" --copy'
  ];
  static args = {
    type: Args.string({
      description: `Prompt type: ${PROMPT_TYPES.join(", ")}`,
      required: true,
      options: [...PROMPT_TYPES]
    }),
    task: Args.string({
      description: "The task you want help with.",
      required: true
    })
  };
  static flags = {
    mode: Flags.string({
      description: "Prompt mode. plan = inspect and propose, implement = build and test, review = read and report. Defaults to defaultPromptMode from `forge config`.",
      options: ["plan", "implement", "review"]
    }),
    copy: Flags.boolean({
      description: "Copy the prompt to the clipboard if clipboardy is installed.",
      default: false
    })
  };
  async run() {
    const { args, flags } = await this.parse(_Prompt);
    const prompt = await generatePrompt({
      cwd: process.cwd(),
      type: args.type,
      task: args.task,
      mode: flags.mode
    });
    this.log(prompt);
    if (flags.copy) {
      const copied = await tryCopyToClipboard(prompt);
      if (copied) {
        this.log("");
        this.log("(Copied to clipboard.)");
      } else {
        this.log("");
        this.log(
          "(Clipboard copy skipped \u2014 install `clipboardy` to enable --copy.)"
        );
      }
    }
  }
};
async function tryCopyToClipboard(text) {
  try {
    const moduleName = "clipboardy";
    const mod = await import(moduleName);
    const write = mod.default?.write ?? mod.write;
    if (!write) {
      return false;
    }
    await write(text);
    return true;
  } catch {
    return false;
  }
}
export {
  Prompt as default
};
//# sourceMappingURL=index.js.map