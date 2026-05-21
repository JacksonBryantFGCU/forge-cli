import fs from "node:fs/promises";
import path from "node:path";
import { directoryExists, ensureDir } from "../../core/fs.js";
import {
  getUserTemplatesRoot,
  resolveBundledTemplatesRoot,
  resolveUserTemplatePath,
} from "../../core/template-loader.js";

export const TEMPLATE_CATEGORIES = [
  "components",
  "projects",
  "prompts",
  "recipes",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export function isTemplateCategory(value: string): value is TemplateCategory {
  return (TEMPLATE_CATEGORIES as readonly string[]).includes(value);
}

export type TemplateStatus = "bundled" | "overridden" | "user-only";

export type TemplateEntry = {
  category: TemplateCategory;
  name: string;
  status: TemplateStatus;
  bundledPath: string | null;
  userPath: string;
};

export type TemplateOpenResult = {
  category: TemplateCategory;
  name: string;
  userPath: string;
  bundledPath: string | null;
  copiedFromBundled: boolean;
};

type EntryKind = "file" | "dir";

async function listEntries(
  dir: string,
  kind: EntryKind,
): Promise<string[]> {
  if (!(await directoryExists(dir))) return [];

  const entries = await fs.readdir(dir, { withFileTypes: true });

  return entries
    .filter((e) => {
      if (e.name.startsWith(".")) return false;
      return kind === "dir" ? e.isDirectory() : e.isFile();
    })
    .map((e) => e.name);
}

function categoryEntryKind(category: TemplateCategory): EntryKind {
  return category === "projects" ? "dir" : "file";
}

export async function listTemplates(): Promise<TemplateEntry[]> {
  const bundledRoot = await resolveBundledTemplatesRoot();
  const userRoot = getUserTemplatesRoot();
  const result: TemplateEntry[] = [];

  for (const category of TEMPLATE_CATEGORIES) {
    const kind = categoryEntryKind(category);
    const bundledDir = path.join(bundledRoot, category);
    const userDir = path.join(userRoot, category);

    const bundled = await listEntries(bundledDir, kind);
    const user = await listEntries(userDir, kind);
    const names = Array.from(new Set([...bundled, ...user])).sort();

    for (const name of names) {
      const inBundled = bundled.includes(name);
      const inUser = user.includes(name);

      const status: TemplateStatus = inUser
        ? inBundled
          ? "overridden"
          : "user-only"
        : "bundled";

      result.push({
        category,
        name,
        status,
        bundledPath: inBundled ? path.join(bundledDir, name) : null,
        userPath: path.join(userDir, name),
      });
    }
  }

  return result;
}

async function copyRecursive(from: string, to: string): Promise<void> {
  const stat = await fs.stat(from);

  if (stat.isDirectory()) {
    await ensureDir(to);
    const entries = await fs.readdir(from, { withFileTypes: true });
    for (const entry of entries) {
      await copyRecursive(
        path.join(from, entry.name),
        path.join(to, entry.name),
      );
    }
    return;
  }

  if (stat.isFile()) {
    await ensureDir(path.dirname(to));
    await fs.copyFile(from, to);
  }
}

async function existsAny(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function openTemplate(
  category: string,
  name: string,
): Promise<TemplateOpenResult> {
  if (!isTemplateCategory(category)) {
    throw new Error(
      `Unknown template category: ${category}. Supported: ${TEMPLATE_CATEGORIES.join(", ")}`,
    );
  }

  if (!name || name.includes("..") || path.isAbsolute(name)) {
    throw new Error(`Invalid template name: ${name}`);
  }

  const bundledRoot = await resolveBundledTemplatesRoot();
  const bundledPath = path.join(bundledRoot, category, name);
  const userPath = resolveUserTemplatePath(category, name);

  const bundledExists = await existsAny(bundledPath);
  const userExists = await existsAny(userPath);

  if (userExists) {
    return {
      category,
      name,
      userPath,
      bundledPath: bundledExists ? bundledPath : null,
      copiedFromBundled: false,
    };
  }

  if (!bundledExists) {
    throw new Error(
      `Template not found: ${category}/${name} (looked in user store and bundled).`,
    );
  }

  // Seed the user override with the bundled version so the user has
  // something to edit.
  if (categoryEntryKind(category) === "dir") {
    await copyRecursive(bundledPath, userPath);
  } else {
    await ensureDir(path.dirname(userPath));
    await fs.copyFile(bundledPath, userPath);
  }

  return {
    category,
    name,
    userPath,
    bundledPath,
    copiedFromBundled: true,
  };
}

export {
  getUserTemplatesRoot,
  resolveUserTemplatePath,
} from "../../core/template-loader.js";
