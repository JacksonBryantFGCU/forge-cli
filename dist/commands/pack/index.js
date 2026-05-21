// src/commands/pack/index.ts
import { Args, Command, Flags } from "@oclif/core";

// src/modules/stackpack/index.ts
import path5 from "path";

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
async function resolveBundledTemplatePath(...segments) {
  const root = await resolveBundledTemplatesRoot();
  return path2.join(root, ...segments);
}
async function resolveTemplatePath(...segments) {
  const userPath = resolveUserTemplatePath(...segments);
  if (await fileExists(userPath)) {
    return userPath;
  }
  return resolveBundledTemplatePath(...segments);
}

// src/schemas/recipe.schema.ts
import { z } from "zod";
var RecipeFileOperationSchema = z.enum([
  "create",
  "overwrite",
  "append"
]);
var RecipeFileSchema = z.object({
  path: z.string().min(1),
  operation: RecipeFileOperationSchema,
  content: z.string()
});
var RecipeSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-_]*$/, "id must be a lowercase slug"),
  name: z.string().min(1),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  files: z.array(RecipeFileSchema).default([]),
  notes: z.string().optional()
});

// src/modules/stackpack/types.ts
var PACK_ACTIONS = [
  "list",
  "search",
  "show",
  "save",
  "use",
  "init-defaults",
  "delete"
];

// src/modules/stackpack/default-recipes.ts
var DEFAULT_RECIPE_IDS = [
  "vite-vercel-spa-rewrite",
  "vite-vercel-client-routing",
  "express-secure-baseline",
  "express-security-baseline",
  "supabase-client-react",
  "supabase-auth-react",
  "square-checkout-express",
  "github-actions-vite",
  "github-actions-vite-deploy-check",
  "playwright-basic-config",
  "env-example-baseline",
  "react-router-baseline",
  "tailwind-ui-baseline",
  "client-contact-form"
];
async function loadDefaultRecipes() {
  const recipes = [];
  for (const id of DEFAULT_RECIPE_IDS) {
    const filePath = await resolveTemplatePath("recipes", `${id}.json`);
    const raw = await readJsonFile(filePath);
    if (!raw) {
      throw new Error(`Default recipe template not found: ${filePath}`);
    }
    recipes.push(RecipeSchema.parse(raw));
  }
  return recipes;
}

// src/modules/stackpack/recipe-store.ts
import fs3 from "fs/promises";
import path4 from "path";

// src/core/config.ts
import os2 from "os";
import path3 from "path";

// src/schemas/forge-config.schema.ts
import { z as z2 } from "zod";
var ForgeConfigSchema = z2.object({
  version: z2.string().default("0.1.0"),
  preferredPackageManager: z2.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
  defaultPromptMode: z2.enum(["plan", "implement", "review"]).default("plan"),
  componentStyle: z2.enum(["named-export", "default-export"]).default("named-export"),
  testFramework: z2.enum(["vitest", "jest", "none"]).default("vitest")
});

// src/core/config.ts
function getForgeHomeDir() {
  return path3.join(os2.homedir(), ".forge");
}
async function ensureForgeHome() {
  await ensureDir(getForgeHomeDir());
  await ensureDir(path3.join(getForgeHomeDir(), "recipes"));
  await ensureDir(path3.join(getForgeHomeDir(), "prompts"));
  await ensureDir(path3.join(getForgeHomeDir(), "templates"));
}

// src/modules/stackpack/recipe-store.ts
function getRecipeDirectory() {
  return path4.join(getForgeHomeDir(), "recipes");
}
function getRecipePath(id) {
  return path4.join(getRecipeDirectory(), `${id}.json`);
}
async function ensureRecipeStore() {
  await ensureForgeHome();
  await ensureDir(getRecipeDirectory());
}
async function listRecipes() {
  await ensureRecipeStore();
  const dir = getRecipeDirectory();
  const entries = await fs3.readdir(dir);
  const recipes = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const raw = await readJsonFile(path4.join(dir, entry));
    if (!raw) continue;
    const parsed = RecipeSchema.safeParse(raw);
    if (parsed.success) {
      recipes.push(parsed.data);
    }
  }
  recipes.sort((a, b) => a.id.localeCompare(b.id));
  return recipes;
}
async function getRecipe(id) {
  await ensureRecipeStore();
  const raw = await readJsonFile(getRecipePath(id));
  if (!raw) return null;
  const parsed = RecipeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
async function saveRecipe(recipe) {
  await ensureRecipeStore();
  const validated = RecipeSchema.parse(recipe);
  await writeJsonFile(getRecipePath(validated.id), validated);
}
async function deleteRecipe(id) {
  await ensureRecipeStore();
  const filePath = getRecipePath(id);
  if (!await fileExists(filePath)) {
    return false;
  }
  await fs3.unlink(filePath);
  return true;
}
async function recipeExists(id) {
  return fileExists(getRecipePath(id));
}
var readAllRecipes = listRecipes;
var readRecipe = getRecipe;
var writeRecipe = saveRecipe;

// src/modules/stackpack/index.ts
async function runPackCommand(options) {
  await ensureRecipeStore();
  if (!isPackAction(options.action)) {
    return {
      message: `Unknown pack action: ${options.action}`,
      items: [`Use one of: ${PACK_ACTIONS.join(", ")}`]
    };
  }
  switch (options.action) {
    case "list":
      return listRecipes2();
    case "search":
      return searchRecipes(options);
    case "show":
      return showRecipe(options);
    case "save":
      return saveRecipe2(options);
    case "use":
      return useRecipe(options);
    case "init-defaults":
      return initDefaults(options);
    case "delete":
      return deleteRecipeAction(options);
  }
}
function isPackAction(action) {
  return PACK_ACTIONS.includes(action);
}
async function listRecipes2() {
  const recipes = await readAllRecipes();
  if (recipes.length === 0) {
    return {
      message: "No recipes saved yet. Run `forge pack init-defaults` to seed the built-in recipes.",
      items: []
    };
  }
  return {
    message: `Found ${recipes.length} recipe(s):`,
    items: recipes.map(formatRecipeSummary)
  };
}
async function searchRecipes(options) {
  const query = options.name?.toLowerCase();
  if (!query) {
    return {
      message: "Missing search query.",
      items: ["Example: forge pack search vercel"]
    };
  }
  const recipes = await readAllRecipes();
  const matches = recipes.filter((recipe) => {
    return recipe.id.toLowerCase().includes(query) || recipe.name.toLowerCase().includes(query) || recipe.description.toLowerCase().includes(query) || recipe.tags.some((tag) => tag.toLowerCase().includes(query));
  });
  return {
    message: `Found ${matches.length} matching recipe(s):`,
    items: matches.map(formatRecipeSummary)
  };
}
async function showRecipe(options) {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack show vite-vercel-spa-rewrite"]
    };
  }
  const id = slugify(options.name);
  const recipe = await readRecipe(id);
  if (!recipe) {
    return {
      message: `Recipe not found: ${id}`,
      items: []
    };
  }
  const items = [
    `Name: ${recipe.name}`,
    `Description: ${recipe.description}`,
    `Tags: ${recipe.tags.length > 0 ? recipe.tags.join(", ") : "(none)"}`
  ];
  if (recipe.notes) {
    items.push(`Notes: ${recipe.notes}`);
  }
  items.push("Files:");
  for (const file of recipe.files) {
    items.push(`  - [${file.operation}] ${file.path}`);
  }
  return {
    message: `Recipe: ${recipe.id}`,
    items
  };
}
async function saveRecipe2(options) {
  if (!options.name) {
    return {
      message: "Missing recipe name.",
      items: ["Example: forge pack save my-recipe --description '...'"]
    };
  }
  const id = slugify(options.name);
  if (await recipeExists(id) && !options.force) {
    return {
      message: `Recipe ${id} already exists. Pass --force to overwrite.`,
      items: [`File: ${getRecipePath(id)}`]
    };
  }
  const recipe = RecipeSchema.parse({
    id,
    name: options.name,
    description: options.description ?? "No description provided.",
    tags: parseTags(options.tags),
    files: [
      {
        path: "README_FOR_RECIPE.md",
        operation: "create",
        content: `# ${options.name}

Replace this placeholder with real recipe content.
`
      }
    ]
  });
  await writeRecipe(recipe);
  return {
    message: `Saved recipe: ${id}`,
    items: [`Edit it at: ${getRecipePath(id)}`]
  };
}
async function useRecipe(options) {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack use vite-vercel-spa-rewrite"]
    };
  }
  const id = slugify(options.name);
  const recipe = await readRecipe(id);
  if (!recipe) {
    return {
      message: `Recipe not found: ${id}`,
      items: []
    };
  }
  const items = [];
  for (const file of recipe.files) {
    const result = await applyRecipeFile({
      file,
      cwd: options.cwd,
      dryRun: options.dryRun,
      force: options.force
    });
    items.push(result);
  }
  return {
    message: `${options.dryRun ? "Previewed" : "Applied"} recipe: ${recipe.id}`,
    items
  };
}
async function initDefaults(options) {
  const items = [];
  let created = 0;
  let skipped = 0;
  let overwritten = 0;
  const defaults = await loadDefaultRecipes();
  for (const recipe of defaults) {
    const exists = await recipeExists(recipe.id);
    if (exists && !options.force) {
      skipped++;
      items.push(`Skipped existing recipe ${recipe.id} (pass --force to overwrite)`);
      continue;
    }
    if (options.dryRun) {
      items.push(`Would ${exists ? "overwrite" : "create"} ${recipe.id}`);
      continue;
    }
    await writeRecipe(recipe);
    if (exists) {
      overwritten++;
      items.push(`Overwrote recipe ${recipe.id}`);
    } else {
      created++;
      items.push(`Created recipe ${recipe.id}`);
    }
  }
  const summary = options.dryRun ? `Previewed init-defaults: ${DEFAULT_RECIPE_IDS.length} recipe(s).` : `Initialized defaults: ${created} created, ${overwritten} overwritten, ${skipped} skipped.`;
  return {
    message: summary,
    items
  };
}
async function deleteRecipeAction(options) {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack delete my-recipe"]
    };
  }
  const id = slugify(options.name);
  if (options.dryRun) {
    const exists = await recipeExists(id);
    return {
      message: exists ? `Would delete recipe ${id}.` : `Recipe ${id} not found.`,
      items: []
    };
  }
  const removed = await deleteRecipe(id);
  return {
    message: removed ? `Deleted recipe ${id}.` : `Recipe ${id} not found.`,
    items: []
  };
}
async function applyRecipeFile(input) {
  const { file, cwd, dryRun, force } = input;
  const targetPath = path5.join(cwd, file.path);
  const exists = await fileExists(targetPath);
  if (file.operation === "create") {
    if (exists && !force) {
      return `Skipped existing ${file.path} (pass --force to overwrite)`;
    }
    if (dryRun) {
      return `Would ${exists ? "overwrite" : "create"} ${file.path}`;
    }
    await writeTextFile(targetPath, file.content);
    return `${exists ? "Overwrote" : "Created"} ${file.path}`;
  }
  if (file.operation === "overwrite") {
    if (exists && !force && !dryRun) {
      return `Refused to overwrite existing ${file.path} (pass --force)`;
    }
    if (dryRun) {
      return `Would overwrite ${file.path}`;
    }
    await writeTextFile(targetPath, file.content);
    return `Overwrote ${file.path}`;
  }
  if (file.operation === "append") {
    if (dryRun) {
      if (!exists) return `Would create ${file.path}`;
      const existing = await readTextFile(targetPath) ?? "";
      if (existing.includes(file.content.trim())) {
        return `Would skip ${file.path} (content already present)`;
      }
      return `Would append to ${file.path}`;
    }
    if (exists) {
      const existing = await readTextFile(targetPath) ?? "";
      if (existing.includes(file.content.trim())) {
        return `Skipped ${file.path} (content already present)`;
      }
      const separator = existing.endsWith("\n") || existing === "" ? "" : "\n";
      await writeTextFile(targetPath, `${existing}${separator}${file.content}`);
      return `Appended to ${file.path}`;
    }
    await writeTextFile(targetPath, file.content);
    return `Created ${file.path}`;
  }
  return `Unsupported operation on ${file.path}`;
}
function formatRecipeSummary(recipe) {
  const tags = recipe.tags.length > 0 ? ` [${recipe.tags.join(", ")}]` : "";
  return `${recipe.id} \u2014 ${recipe.description}${tags}`;
}
function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function parseTags(tags) {
  if (!tags) return [];
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

// src/commands/pack/index.ts
var Pack = class _Pack extends Command {
  static description = "Manage reusable development recipes stored in ~/.forge/recipes.";
  static examples = [
    "forge pack init-defaults",
    "forge pack list",
    "forge pack search vercel",
    "forge pack show vite-vercel-spa-rewrite",
    "forge pack use vite-vercel-spa-rewrite --dry-run",
    "forge pack use vite-vercel-spa-rewrite --force",
    'forge pack save my-recipe --description "Setup snippet" --tags vite,react',
    "forge pack delete my-recipe"
  ];
  static args = {
    action: Args.string({
      description: `Action to run.`,
      required: true,
      options: [...PACK_ACTIONS]
    }),
    name: Args.string({
      description: "Recipe id or search query (required for show/use/save/search/delete).",
      required: false
    })
  };
  static flags = {
    description: Flags.string({
      description: "Description for a saved recipe."
    }),
    tags: Flags.string({
      description: "Comma-separated tags for a saved recipe."
    }),
    "dry-run": Flags.boolean({
      description: "Preview changes without writing files.",
      default: false
    }),
    force: Flags.boolean({
      description: "Overwrite existing files (when applying a recipe) or existing recipe definitions (when saving / init-defaults).",
      default: false
    })
  };
  async run() {
    const { args, flags } = await this.parse(_Pack);
    const result = await runPackCommand({
      cwd: process.cwd(),
      action: args.action,
      name: args.name,
      description: flags.description,
      tags: flags.tags,
      dryRun: flags["dry-run"],
      force: flags.force
    });
    this.log(result.message);
    if (result.items.length > 0) {
      this.log("");
      for (const item of result.items) {
        this.log(item);
      }
    }
  }
};
export {
  Pack as default
};
//# sourceMappingURL=index.js.map