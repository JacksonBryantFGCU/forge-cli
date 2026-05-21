import path from "node:path";
import { readForgeConfig } from "../../core/config.js";
import { pathExists, readJsonFile, writeTextFile } from "../../core/fs.js";
import {
  getInstallCommand,
  getRunCommand,
  type PackageManager,
} from "../../core/package-manager.js";
import {
  renderTemplateFile,
  resolveTemplatePath,
} from "../../core/template-loader.js";
import { runCommand } from "../../core/shell.js";
import { ProjectTemplateSchema } from "../../schemas/index.js";
import type { ProjectTemplate } from "../../schemas/index.js";
import {
  TEMPLATE_NAMES,
  type CreateProjectOptions,
  type CreateProjectResult,
  type TemplateName,
} from "./types.js";

export async function createProject(
  options: CreateProjectOptions,
): Promise<CreateProjectResult> {
  const projectName = sanitizeProjectName(options.name);

  if (!projectName) {
    throw new Error("Project name cannot be empty.");
  }

  const template = resolveTemplate(options.template);
  const manifest = await loadTemplateManifest(template);
  const projectPath = path.join(options.cwd, projectName);

  const config = await readForgeConfig();
  const packageManager = config.preferredPackageManager;

  const files: { outputPath: string; content: string }[] = [];

  for (const file of manifest.files) {
    const templateAbsPath = await resolveTemplatePath(
      "projects",
      template,
      ...file.template.split("/"),
    );

    const content = await renderTemplateFile(templateAbsPath, {
      projectName,
    });

    files.push({
      outputPath: file.path,
      content,
    });
  }

  if (!options.dryRun) {
    await assertProjectDoesNotExist(projectPath);

    for (const file of files) {
      await writeTextFile(path.join(projectPath, file.outputPath), file.content);
    }

    if (options.install) {
      const { command, args } = getPackageManagerInstallExec(packageManager);
      const result = await runCommand(command, args, {
        cwd: projectPath,
        inherit: true,
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
    devCommand: getRunCommand(packageManager, "dev"),
  };
}

function getPackageManagerInstallExec(packageManager: PackageManager): {
  command: string;
  args: string[];
} {
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

async function loadTemplateManifest(
  template: TemplateName,
): Promise<ProjectTemplate> {
  const manifestPath = await resolveTemplatePath(
    "projects",
    template,
    "template.json",
  );

  const raw = await readJsonFile<unknown>(manifestPath);

  if (!raw) {
    throw new Error(`Template manifest not found: ${manifestPath}`);
  }

  return ProjectTemplateSchema.parse(raw);
}

function resolveTemplate(template: string): TemplateName {
  const match = TEMPLATE_NAMES.find((name) => name === template);

  if (!match) {
    throw new Error(
      `Unknown template: ${template}. Supported: ${TEMPLATE_NAMES.join(", ")}`,
    );
  }

  return match;
}

function sanitizeProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function assertProjectDoesNotExist(projectPath: string): Promise<void> {
  if (await pathExists(projectPath)) {
    throw new Error(`Project already exists at ${projectPath}`);
  }
}

export type {
  CreateProjectOptions,
  CreateProjectResult,
  TemplateName,
} from "./types.js";
export { TEMPLATE_NAMES } from "./types.js";
