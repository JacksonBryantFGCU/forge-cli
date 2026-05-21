// src/commands/component/index.ts
import path7 from "path";
import { Args, Command, Flags } from "@oclif/core";

// src/modules/compforge/index.ts
import path6 from "path";

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

// src/modules/compforge/index.ts
var COMPONENT_TYPES = [
  "component",
  "page",
  "hook",
  "form",
  "layout",
  "section",
  "modal",
  "card"
];
var COMPONENT_TEMPLATE_FILE = {
  component: "component.tsx.eta",
  page: "page.tsx.eta",
  hook: "hook.ts.eta",
  form: "form.tsx.eta",
  layout: "layout.tsx.eta",
  section: "section.tsx.eta",
  modal: "modal.tsx.eta",
  card: "card.tsx.eta"
};
async function generateComponent(options) {
  const config = await readForgeConfig();
  const name = options.type === "hook" ? toHookName(options.name) : toPascalCase(options.name);
  const targetDir = resolveTargetDir(options, name);
  const warnings = await collectWarnings(options, config);
  const planned = await buildPlannedFiles({
    name,
    targetDir,
    type: options.type,
    withTest: options.withTest,
    withTypes: options.withTypes,
    withMotion: options.withMotion,
    componentStyle: config.componentStyle,
    testFramework: config.testFramework
  });
  const files = [];
  for (const file of planned) {
    const exists = await fileExists(file.path);
    let action;
    if (!exists) {
      action = "create";
    } else if (options.force) {
      action = "overwrite";
    } else {
      action = "skip";
    }
    if (!options.dryRun && action !== "skip") {
      await writeTextFile(file.path, file.content);
    }
    files.push({ ...file, action });
  }
  return {
    name,
    type: options.type,
    targetDir,
    files,
    warnings,
    componentStyle: config.componentStyle,
    testFramework: config.testFramework
  };
}
function resolveTargetDir(options, name) {
  if (options.customPath) {
    return path6.isAbsolute(options.customPath) ? options.customPath : path6.join(options.cwd, options.customPath);
  }
  switch (options.type) {
    case "page":
      return path6.join(options.cwd, "src", "pages", name);
    case "hook":
      return path6.join(options.cwd, "src", "hooks");
    case "form":
      return path6.join(options.cwd, "src", "components", "forms", name);
    case "component":
    case "card":
    case "modal":
    case "section":
    case "layout":
      return path6.join(options.cwd, "src", "components", name);
  }
}
async function collectWarnings(options, config) {
  const warnings = [];
  if (options.withMotion) {
    const ctx = await detectProjectContext(options.cwd);
    const hasFramerMotion = Boolean(
      ctx.dependencies["framer-motion"] || ctx.devDependencies["framer-motion"]
    );
    if (!hasFramerMotion) {
      warnings.push(
        "framer-motion is not listed in package.json. Install it with `npm install framer-motion` before running the generated component."
      );
    }
  }
  if (options.withTest && config.testFramework === "none") {
    warnings.push(
      "testFramework is set to 'none' in forge config \u2014 skipping test file generation. Run `forge config set testFramework vitest` to re-enable."
    );
  }
  return warnings;
}
async function buildPlannedFiles(input) {
  const exportName = input.name;
  const isHook = input.type === "hook";
  const useDefaultExport = !isHook && input.componentStyle === "default-export";
  const data = {
    name: input.name,
    exportName,
    type: input.type,
    useMotion: input.withMotion && !isHook,
    hasTypes: input.withTypes && !isHook,
    componentStyle: input.componentStyle,
    testFramework: input.testFramework,
    exportPrefix: useDefaultExport ? "export default function" : "export function",
    indexExport: useDefaultExport ? `export { default as ${exportName} } from "./${input.name}.js";` : `export { ${exportName} } from "./${input.name}.js";`,
    testFrameworkImport: testFrameworkImport(input.testFramework),
    componentImport: isHook ? `import { ${exportName} } from "./${input.name}.js";` : useDefaultExport ? `import ${exportName} from "./${input.name}.js";` : `import { ${exportName} } from "./${input.name}.js";`
  };
  const includeTest = input.withTest && input.testFramework !== "none";
  if (isHook) {
    const files2 = [
      {
        path: path6.join(input.targetDir, `${input.name}.ts`),
        content: await renderTextTemplate(
          ["components", "hook.ts.eta"],
          data
        )
      }
    ];
    if (includeTest) {
      files2.push({
        path: path6.join(input.targetDir, `${input.name}.test.ts`),
        content: await renderTextTemplate(
          ["components", "test.tsx.eta"],
          data
        )
      });
    }
    return files2;
  }
  const files = [];
  files.push({
    path: path6.join(input.targetDir, `${input.name}.tsx`),
    content: await renderTextTemplate(
      ["components", COMPONENT_TEMPLATE_FILE[input.type]],
      data
    )
  });
  files.push({
    path: path6.join(input.targetDir, "index.ts"),
    content: await renderTextTemplate(["components", "index.ts.eta"], data)
  });
  if (input.withTypes) {
    files.push({
      path: path6.join(input.targetDir, `${input.name}.types.ts`),
      content: await renderTextTemplate(["components", "types.ts.eta"], data)
    });
  }
  if (includeTest) {
    files.push({
      path: path6.join(input.targetDir, `${input.name}.test.tsx`),
      content: await renderTextTemplate(["components", "test.tsx.eta"], data)
    });
  }
  return files;
}
function testFrameworkImport(framework) {
  switch (framework) {
    case "jest":
      return `import { describe, expect, it } from "@jest/globals";`;
    case "vitest":
    case "none":
      return `import { describe, expect, it } from "vitest";`;
  }
}
function toPascalCase(value) {
  return value.replace(
    /[-_\s]+(.)?/g,
    (_, char) => char ? char.toUpperCase() : ""
  ).replace(/^(.)/, (char) => char.toUpperCase());
}
function toHookName(value) {
  const pascal = toPascalCase(value);
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  return camel.startsWith("use") ? camel : `use${pascal}`;
}

// src/commands/component/index.ts
var Component = class _Component extends Command {
  static description = "Generate a React/Vite/Tailwind component, page, hook, form, layout, section, modal, or card.";
  static examples = [
    "forge component Navbar",
    "forge component Contact --type page",
    "forge component useContactForm --type hook",
    "forge component ContactForm --type form --with-types --with-test",
    "forge component Hero --type section --with-motion",
    "forge component ConfirmModal --type modal",
    "forge component PricingCard --type card --with-test",
    "forge component AppShell --type layout",
    "forge component Hero --dry-run",
    "forge component Banner --path src/marketing --force"
  ];
  static args = {
    name: Args.string({
      description: "Name of the component, page, hook, form, etc.",
      required: true
    })
  };
  static flags = {
    type: Flags.string({
      char: "t",
      description: "What to generate.",
      options: [...COMPONENT_TYPES],
      default: "component"
    }),
    "dry-run": Flags.boolean({
      description: "Preview files without writing them.",
      default: false
    }),
    "with-test": Flags.boolean({
      description: "Also generate a co-located test file.",
      default: false
    }),
    "with-types": Flags.boolean({
      description: "Also generate a co-located Props types file.",
      default: false
    }),
    "with-motion": Flags.boolean({
      description: "Wrap the root element with framer-motion (does not install the dependency).",
      default: false
    }),
    path: Flags.string({
      description: "Custom target directory (overrides the default location for this type)."
    }),
    force: Flags.boolean({
      description: "Overwrite existing files.",
      default: false
    })
  };
  async run() {
    const { args, flags } = await this.parse(_Component);
    const result = await generateComponent({
      cwd: process.cwd(),
      name: args.name,
      type: flags.type,
      dryRun: flags["dry-run"],
      withTest: flags["with-test"],
      withTypes: flags["with-types"],
      withMotion: flags["with-motion"],
      customPath: flags.path,
      force: flags.force
    });
    const verb = flags["dry-run"] ? "Previewed" : "Generated";
    this.log(`${verb} ${result.type}: ${result.name}`);
    this.log(`Target: ${path7.relative(process.cwd(), result.targetDir) || "."}`);
    this.log("");
    for (const file of result.files) {
      const rel = path7.relative(process.cwd(), file.path) || file.path;
      const label = describeAction(file.action, flags["dry-run"]);
      this.log(`${label} ${rel}`);
    }
    const skipped = result.files.filter((f) => f.action === "skip").length;
    if (skipped > 0 && !flags.force) {
      this.log("");
      this.log(
        `${skipped} file(s) already exist and were skipped. Pass --force to overwrite.`
      );
    }
    if (result.warnings.length > 0) {
      this.log("");
      for (const warning of result.warnings) {
        this.log(`! ${warning}`);
      }
    }
  }
};
function describeAction(action, dryRun) {
  if (action === "skip") return "Skipped (exists)";
  if (action === "overwrite") return dryRun ? "Would overwrite" : "Overwrote";
  return dryRun ? "Would create" : "Created";
}
export {
  Component as default
};
//# sourceMappingURL=index.js.map