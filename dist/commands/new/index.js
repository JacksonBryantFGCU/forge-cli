// src/commands/new/index.ts
import { Args, Command, Flags } from "@oclif/core";

// src/modules/devforge/index.ts
import path5 from "path";

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
async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
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

// src/core/package-manager.ts
import path3 from "path";
function getInstallCommand(packageManager) {
  switch (packageManager) {
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn install";
    case "bun":
      return "bun install";
    case "npm":
      return "npm install";
    default:
      return "npm install";
  }
}
function getRunCommand(packageManager, script) {
  switch (packageManager) {
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    case "bun":
      return `bun run ${script}`;
    case "npm":
      return `npm run ${script}`;
    default:
      return `npm run ${script}`;
  }
}

// src/core/template-loader.ts
import fs2 from "fs/promises";
import os2 from "os";
import path4 from "path";
import { fileURLToPath } from "url";
import { Eta } from "eta";
var eta = new Eta({
  useWith: true,
  autoEscape: false,
  autoTrim: false
});
var moduleDir = path4.dirname(fileURLToPath(import.meta.url));
var cachedBundledRoot = null;
async function findUpwards(startDir, relativeTarget) {
  let current = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path4.join(current, relativeTarget);
    if (await directoryExists(candidate)) {
      return candidate;
    }
    const parent = path4.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
async function resolveBundledTemplatesRoot() {
  if (cachedBundledRoot) return cachedBundledRoot;
  const distRoot = await findUpwards(moduleDir, path4.join("dist", "templates"));
  if (distRoot) {
    cachedBundledRoot = distRoot;
    return cachedBundledRoot;
  }
  const srcRoot = await findUpwards(moduleDir, path4.join("src", "templates"));
  if (srcRoot) {
    cachedBundledRoot = srcRoot;
    return cachedBundledRoot;
  }
  throw new Error(
    "Could not locate a bundled templates directory (looked for dist/templates and src/templates)."
  );
}
function getUserTemplatesRoot() {
  return path4.join(os2.homedir(), ".forge", "templates");
}
function resolveUserTemplatePath(...segments) {
  return path4.join(getUserTemplatesRoot(), ...segments);
}
async function resolveBundledTemplatePath(...segments) {
  const root = await resolveBundledTemplatesRoot();
  return path4.join(root, ...segments);
}
function renderTemplateString(template, data) {
  const result = eta.renderString(template, data);
  return typeof result === "string" ? result : "";
}
async function renderTemplateFile(filePath, data) {
  const raw = await fs2.readFile(filePath, "utf8");
  return renderTemplateString(raw, data);
}
async function resolveTemplatePath(...segments) {
  const userPath = resolveUserTemplatePath(...segments);
  if (await fileExists(userPath)) {
    return userPath;
  }
  return resolveBundledTemplatePath(...segments);
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

// src/schemas/template.schema.ts
import { z as z2 } from "zod";
var TemplateFileOperationSchema = z2.enum(["create", "overwrite"]);
var TemplateFileSchema = z2.object({
  path: z2.string().min(1),
  template: z2.string().min(1),
  operation: TemplateFileOperationSchema.default("create")
});
var ProjectTemplateSchema = z2.object({
  id: z2.string().min(1),
  name: z2.string().min(1),
  description: z2.string().default(""),
  tags: z2.array(z2.string()).default([]),
  files: z2.array(TemplateFileSchema).default([])
});
var ComponentTemplateSchema = z2.object({
  id: z2.string().min(1),
  name: z2.string().min(1),
  description: z2.string().default(""),
  tags: z2.array(z2.string()).default([]),
  files: z2.array(TemplateFileSchema).default([])
});

// src/schemas/recipe.schema.ts
import { z as z3 } from "zod";
var RecipeFileOperationSchema = z3.enum([
  "create",
  "overwrite",
  "append"
]);
var RecipeFileSchema = z3.object({
  path: z3.string().min(1),
  operation: RecipeFileOperationSchema,
  content: z3.string()
});
var RecipeSchema = z3.object({
  id: z3.string().min(1).regex(/^[a-z0-9][a-z0-9-_]*$/, "id must be a lowercase slug"),
  name: z3.string().min(1),
  description: z3.string().default(""),
  tags: z3.array(z3.string()).default([]),
  files: z3.array(RecipeFileSchema).default([]),
  notes: z3.string().optional()
});

// src/schemas/prompt-template.schema.ts
import { z as z4 } from "zod";
var PromptModeSchema = z4.enum(["plan", "implement", "review"]);
var PromptTypeSchema = z4.enum([
  "feature",
  "debug",
  "refactor",
  "audit",
  "test",
  "cleanup",
  "deploy",
  "review"
]);
var PromptTemplateSchema = z4.object({
  type: PromptTypeSchema,
  headline: z4.string().min(1),
  intent: z4.string().min(1),
  steps: z4.array(z4.string()).default([]),
  constraints: z4.array(z4.string()).optional()
});

// src/schemas/doctor-rule.schema.ts
import { z as z5 } from "zod";
var DoctorSeveritySchema = z5.enum(["low", "medium", "high"]);
var DoctorCategorySchema = z5.enum([
  "project",
  "env",
  "deployment",
  "react",
  "express",
  "security"
]);
var DoctorIssueSchema = z5.object({
  id: z5.string().min(1),
  title: z5.string().min(1),
  message: z5.string().default(""),
  category: DoctorCategorySchema,
  severity: DoctorSeveritySchema,
  fixed: z5.boolean().optional()
});

// src/modules/devforge/types.ts
var TEMPLATE_NAMES = [
  "react-vite",
  "react-vite-tailwind",
  "express-api",
  "client-static-site"
];

// src/modules/devforge/index.ts
async function createProject(options) {
  const projectName = sanitizeProjectName(options.name);
  if (!projectName) {
    throw new Error("Project name cannot be empty.");
  }
  const template = resolveTemplate(options.template);
  const manifest = await loadTemplateManifest(template);
  const projectPath = path5.join(options.cwd, projectName);
  const config = await readForgeConfig();
  const packageManager = config.preferredPackageManager;
  const files = [];
  for (const file of manifest.files) {
    const templateAbsPath = await resolveTemplatePath(
      "projects",
      template,
      ...file.template.split("/")
    );
    const content = await renderTemplateFile(templateAbsPath, {
      projectName
    });
    files.push({
      outputPath: file.path,
      content
    });
  }
  if (!options.dryRun) {
    await assertProjectDoesNotExist(projectPath);
    for (const file of files) {
      await writeTextFile(path5.join(projectPath, file.outputPath), file.content);
    }
    if (options.install) {
      const { command, args } = getPackageManagerInstallExec(packageManager);
      const result = await runCommand(command, args, {
        cwd: projectPath,
        inherit: true
      });
      if (!result.success) {
        throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr}`);
      }
    }
  }
  return {
    projectName,
    projectPath,
    template,
    files: files.map((f) => f.outputPath),
    packageManager,
    installCommand: getInstallCommand(packageManager),
    devCommand: getRunCommand(packageManager, "dev")
  };
}
function getPackageManagerInstallExec(packageManager) {
  switch (packageManager) {
    case "pnpm":
      return { command: "pnpm", args: ["install"] };
    case "yarn":
      return { command: "yarn", args: ["install"] };
    case "bun":
      return { command: "bun", args: ["install"] };
    case "npm":
    case "unknown":
      return { command: "npm", args: ["install"] };
  }
}
async function loadTemplateManifest(template) {
  const manifestPath = await resolveTemplatePath(
    "projects",
    template,
    "template.json"
  );
  const raw = await readJsonFile(manifestPath);
  if (!raw) {
    throw new Error(`Template manifest not found: ${manifestPath}`);
  }
  return ProjectTemplateSchema.parse(raw);
}
function resolveTemplate(template) {
  const match = TEMPLATE_NAMES.find((name) => name === template);
  if (!match) {
    throw new Error(
      `Unknown template: ${template}. Supported: ${TEMPLATE_NAMES.join(", ")}`
    );
  }
  return match;
}
function sanitizeProjectName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
async function assertProjectDoesNotExist(projectPath) {
  if (await pathExists(projectPath)) {
    throw new Error(`Project already exists at ${projectPath}`);
  }
}

// src/commands/new/index.ts
var New = class _New extends Command {
  static description = "Create a new project from a Forge template.";
  static examples = [
    "forge new my-app",
    "forge new my-app --template react-vite-tailwind --dry-run",
    "forge new api --template express-api --dry-run",
    "forge new contractor-site --template client-static-site --dry-run",
    "forge new client-site --template client-static-site --install",
    "forge new lab --template react-vite"
  ];
  static args = {
    name: Args.string({
      description: "Project name.",
      required: true
    })
  };
  static flags = {
    template: Flags.string({
      char: "t",
      description: "Project template to use.",
      options: [...TEMPLATE_NAMES],
      default: "react-vite-tailwind"
    }),
    install: Flags.boolean({
      description: "Install dependencies after creating the project.",
      default: false
    }),
    "dry-run": Flags.boolean({
      description: "Preview files without writing them.",
      default: false
    })
  };
  async run() {
    const { args, flags } = await this.parse(_New);
    const result = await createProject({
      cwd: process.cwd(),
      name: args.name,
      template: flags.template,
      install: flags.install,
      dryRun: flags["dry-run"]
    });
    this.log(
      `${flags["dry-run"] ? "Previewed" : "Created"} project: ${result.projectName} (${result.template})`
    );
    this.log(`Location: ${result.projectPath}`);
    this.log("");
    for (const file of result.files) {
      this.log(`${flags["dry-run"] ? "Would create" : "Created"} ${file}`);
    }
    if (!flags["dry-run"] && !flags.install) {
      this.log("");
      this.log("Next steps:");
      this.log(`cd ${result.projectName}`);
      this.log(result.installCommand);
      this.log(result.devCommand);
    }
  }
};
export {
  New as default
};
//# sourceMappingURL=index.js.map