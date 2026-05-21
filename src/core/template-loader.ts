import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Eta } from "eta";
import { directoryExists, fileExists, readTextFile } from "./fs.js";

const eta = new Eta({
  useWith: true,
  autoEscape: false,
  autoTrim: false,
});

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

let cachedBundledRoot: string | null = null;

async function findUpwards(
  startDir: string,
  relativeTarget: string,
): Promise<string | null> {
  let current = startDir;

  for (let i = 0; i < 8; i++) {
    const candidate = path.join(current, relativeTarget);

    if (await directoryExists(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}

export async function resolveBundledTemplatesRoot(): Promise<string> {
  if (cachedBundledRoot) return cachedBundledRoot;

  const distRoot = await findUpwards(moduleDir, path.join("dist", "templates"));
  if (distRoot) {
    cachedBundledRoot = distRoot;
    return cachedBundledRoot;
  }

  const srcRoot = await findUpwards(moduleDir, path.join("src", "templates"));
  if (srcRoot) {
    cachedBundledRoot = srcRoot;
    return cachedBundledRoot;
  }

  throw new Error(
    "Could not locate a bundled templates directory (looked for dist/templates and src/templates).",
  );
}

export function getUserTemplatesRoot(): string {
  return path.join(os.homedir(), ".forge", "templates");
}

export function resolveUserTemplatePath(...segments: string[]): string {
  return path.join(getUserTemplatesRoot(), ...segments);
}

export async function resolveBundledTemplatePath(
  ...segments: string[]
): Promise<string> {
  const root = await resolveBundledTemplatesRoot();
  return path.join(root, ...segments);
}

export function renderTemplateString(
  template: string,
  data: Record<string, unknown>,
): string {
  const result = eta.renderString(template, data);
  return typeof result === "string" ? result : "";
}

export async function renderTemplateFile(
  filePath: string,
  data: Record<string, unknown>,
): Promise<string> {
  const raw = await fs.readFile(filePath, "utf8");
  return renderTemplateString(raw, data);
}

/**
 * Resolve a template file path. Tries `~/.forge/templates/<segments>` first
 * and falls back to the bundled location. If neither exists, returns the
 * bundled path so error messages point to the canonical location.
 */
export async function resolveTemplatePath(
  ...segments: string[]
): Promise<string> {
  const userPath = resolveUserTemplatePath(...segments);
  if (await fileExists(userPath)) {
    return userPath;
  }

  return resolveBundledTemplatePath(...segments);
}

export async function loadTextTemplate(
  ...segments: string[]
): Promise<string> {
  const filePath = await resolveTemplatePath(...segments);
  const raw = await readTextFile(filePath);

  if (raw === null) {
    throw new Error(`Template not found: ${filePath}`);
  }

  return raw;
}

export async function renderTextTemplate(
  segments: string[],
  data: Record<string, unknown>,
): Promise<string> {
  const template = await loadTextTemplate(...segments);
  return renderTemplateString(template, data);
}
