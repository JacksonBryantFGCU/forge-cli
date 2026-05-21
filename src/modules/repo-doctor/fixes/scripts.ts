import path from "node:path";
import { readJsonFile, writeTextFile } from "../../../core/fs.js";
import type { ProjectContext } from "../../../core/project-detector.js";
import type { DoctorFixContext, DoctorFixResult } from "../types.js";
import {
  addScript,
  serializePackageJson,
  type PackageJsonShape,
} from "../utils/update-package-json.js";

function suggestedBuildCommand(ctx: ProjectContext): string | null {
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

function hasEslint(ctx: ProjectContext): boolean {
  return Boolean(
    ctx.dependencies["eslint"] || ctx.devDependencies["eslint"],
  );
}

async function applyScriptFix(input: {
  ctx: ProjectContext;
  options: DoctorFixContext;
  scriptName: string;
  command: string | null;
  reasonWhenSkipped: string;
}): Promise<DoctorFixResult> {
  if (input.command === null) {
    return {
      fixed: false,
      skipped: true,
      message: input.reasonWhenSkipped,
    };
  }

  const pkgPath = path.join(input.ctx.rootDir, "package.json");
  const raw = await readJsonFile<PackageJsonShape>(pkgPath);

  if (!raw) {
    return {
      fixed: false,
      skipped: true,
      message: "package.json could not be read.",
    };
  }

  const { next, added } = addScript(raw, input.scriptName, input.command);

  if (!added) {
    return {
      fixed: false,
      skipped: true,
      message: `Script "${input.scriptName}" already exists — preserving it.`,
    };
  }

  if (input.options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would add "${input.scriptName}": "${input.command}" to package.json.`,
    };
  }

  await writeTextFile(pkgPath, serializePackageJson(next));
  return {
    fixed: true,
    message: `Added "${input.scriptName}": "${input.command}" to package.json.`,
  };
}

export function fixMissingBuildScript(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  return applyScriptFix({
    ctx,
    options,
    scriptName: "build",
    command: suggestedBuildCommand(ctx),
    reasonWhenSkipped:
      "Cannot auto-fix a build script: framework is not a known type with a default build command.",
  });
}

export function fixMissingLintScript(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  return applyScriptFix({
    ctx,
    options,
    scriptName: "lint",
    command: hasEslint(ctx) ? "eslint ." : null,
    reasonWhenSkipped:
      "Cannot auto-fix a lint script: ESLint is not installed. Add `eslint` first.",
  });
}
