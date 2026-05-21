// src/commands/template/index.ts
import { Args, Command } from "@oclif/core";

// src/modules/template-manager/index.ts
import fs3 from "fs/promises";
import path3 from "path";

// src/core/fs.ts
import fs from "fs/promises";
import path from "path";
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

// src/core/template-loader.ts
import fs2 from "fs/promises";
import os from "os";
import path2 from "path";
import { fileURLToPath } from "url";
import { Eta } from "eta";
var eta = new Eta({
  useWith: true,
  autoEscape: false,
  autoTrim: false
});
var moduleDir = path2.dirname(fileURLToPath(import.meta.url));
var cachedBundledRoot = null;
async function findUpwards(startDir, relativeTarget) {
  let current = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path2.join(current, relativeTarget);
    if (await directoryExists(candidate)) {
      return candidate;
    }
    const parent = path2.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
async function resolveBundledTemplatesRoot() {
  if (cachedBundledRoot) return cachedBundledRoot;
  const distRoot = await findUpwards(moduleDir, path2.join("dist", "templates"));
  if (distRoot) {
    cachedBundledRoot = distRoot;
    return cachedBundledRoot;
  }
  const srcRoot = await findUpwards(moduleDir, path2.join("src", "templates"));
  if (srcRoot) {
    cachedBundledRoot = srcRoot;
    return cachedBundledRoot;
  }
  throw new Error(
    "Could not locate a bundled templates directory (looked for dist/templates and src/templates)."
  );
}
function getUserTemplatesRoot() {
  return path2.join(os.homedir(), ".forge", "templates");
}
function resolveUserTemplatePath(...segments) {
  return path2.join(getUserTemplatesRoot(), ...segments);
}

// src/modules/template-manager/index.ts
var TEMPLATE_CATEGORIES = [
  "components",
  "projects",
  "prompts",
  "recipes"
];
function isTemplateCategory(value) {
  return TEMPLATE_CATEGORIES.includes(value);
}
async function listEntries(dir, kind) {
  if (!await directoryExists(dir)) return [];
  const entries = await fs3.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => {
    if (e.name.startsWith(".")) return false;
    return kind === "dir" ? e.isDirectory() : e.isFile();
  }).map((e) => e.name);
}
function categoryEntryKind(category) {
  return category === "projects" ? "dir" : "file";
}
async function listTemplates() {
  const bundledRoot = await resolveBundledTemplatesRoot();
  const userRoot = getUserTemplatesRoot();
  const result = [];
  for (const category of TEMPLATE_CATEGORIES) {
    const kind = categoryEntryKind(category);
    const bundledDir = path3.join(bundledRoot, category);
    const userDir = path3.join(userRoot, category);
    const bundled = await listEntries(bundledDir, kind);
    const user = await listEntries(userDir, kind);
    const names = Array.from(/* @__PURE__ */ new Set([...bundled, ...user])).sort();
    for (const name of names) {
      const inBundled = bundled.includes(name);
      const inUser = user.includes(name);
      const status = inUser ? inBundled ? "overridden" : "user-only" : "bundled";
      result.push({
        category,
        name,
        status,
        bundledPath: inBundled ? path3.join(bundledDir, name) : null,
        userPath: path3.join(userDir, name)
      });
    }
  }
  return result;
}
async function copyRecursive(from, to) {
  const stat = await fs3.stat(from);
  if (stat.isDirectory()) {
    await ensureDir(to);
    const entries = await fs3.readdir(from, { withFileTypes: true });
    for (const entry of entries) {
      await copyRecursive(
        path3.join(from, entry.name),
        path3.join(to, entry.name)
      );
    }
    return;
  }
  if (stat.isFile()) {
    await ensureDir(path3.dirname(to));
    await fs3.copyFile(from, to);
  }
}
async function existsAny(p) {
  try {
    await fs3.access(p);
    return true;
  } catch {
    return false;
  }
}
async function openTemplate(category, name) {
  if (!isTemplateCategory(category)) {
    throw new Error(
      `Unknown template category: ${category}. Supported: ${TEMPLATE_CATEGORIES.join(", ")}`
    );
  }
  if (!name || name.includes("..") || path3.isAbsolute(name)) {
    throw new Error(`Invalid template name: ${name}`);
  }
  const bundledRoot = await resolveBundledTemplatesRoot();
  const bundledPath = path3.join(bundledRoot, category, name);
  const userPath = resolveUserTemplatePath(category, name);
  const bundledExists = await existsAny(bundledPath);
  const userExists = await existsAny(userPath);
  if (userExists) {
    return {
      category,
      name,
      userPath,
      bundledPath: bundledExists ? bundledPath : null,
      copiedFromBundled: false
    };
  }
  if (!bundledExists) {
    throw new Error(
      `Template not found: ${category}/${name} (looked in user store and bundled).`
    );
  }
  if (categoryEntryKind(category) === "dir") {
    await copyRecursive(bundledPath, userPath);
  } else {
    await ensureDir(path3.dirname(userPath));
    await fs3.copyFile(bundledPath, userPath);
  }
  return {
    category,
    name,
    userPath,
    bundledPath,
    copiedFromBundled: true
  };
}

// src/commands/template/index.ts
var ACTIONS = ["path", "list", "open"];
var Template = class _Template extends Command {
  static description = "Inspect and override Forge's bundled templates with files in ~/.forge/templates.";
  static examples = [
    "forge template path",
    "forge template list",
    "forge template open components component.tsx.eta",
    "forge template open prompts feature.md.eta",
    "forge template open projects react-vite-tailwind",
    "forge template open recipes vite-vercel-spa-rewrite.json"
  ];
  static args = {
    action: Args.string({
      description: "Action to run.",
      required: true,
      options: [...ACTIONS]
    }),
    category: Args.string({
      description: `Template category (one of: ${TEMPLATE_CATEGORIES.join(", ")}). Required for \`open\`.`,
      required: false
    }),
    name: Args.string({
      description: "Template name. For projects, the folder name; otherwise the filename.",
      required: false
    })
  };
  async run() {
    const { args } = await this.parse(_Template);
    if (args.action === "path") {
      this.log(getUserTemplatesRoot());
      return;
    }
    if (args.action === "list") {
      const entries = await listTemplates();
      if (entries.length === 0) {
        this.log("No templates found.");
        return;
      }
      let currentCategory = null;
      for (const entry of entries) {
        if (entry.category !== currentCategory) {
          if (currentCategory !== null) this.log("");
          this.log(`[${entry.category}]`);
          currentCategory = entry.category;
        }
        this.log(`  ${entry.name} \u2014 ${entry.status}`);
      }
      return;
    }
    if (args.action === "open") {
      if (!args.category || !args.name) {
        this.error("Usage: forge template open <category> <name>");
      }
      try {
        const result = await openTemplate(args.category, args.name);
        this.log(result.userPath);
        if (result.copiedFromBundled) {
          this.log(
            `(copied from bundled ${result.bundledPath} \u2014 edit the user copy to override)`
          );
        }
      } catch (err) {
        this.error(err instanceof Error ? err.message : String(err));
      }
      return;
    }
  }
};
export {
  Template as default
};
//# sourceMappingURL=index.js.map