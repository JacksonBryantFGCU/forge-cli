import path from "node:path";
import { fileExists, readTextFile, writeTextFile } from "../../core/fs.js";
import { DEFAULT_RECIPE_IDS, loadDefaultRecipes } from "./default-recipes.js";
import {
  deleteRecipe,
  ensureRecipeStore,
  getRecipePath,
  readAllRecipes,
  readRecipe,
  recipeExists,
  writeRecipe,
} from "./recipe-store.js";
import {
  PACK_ACTIONS,
  RecipeSchema,
  type PackAction,
  type PackCommandResult,
  type Recipe,
  type RecipeFile,
  type RunPackCommandOptions,
} from "./types.js";

export async function runPackCommand(
  options: RunPackCommandOptions,
): Promise<PackCommandResult> {
  await ensureRecipeStore();

  if (!isPackAction(options.action)) {
    return {
      message: `Unknown pack action: ${options.action}`,
      items: [`Use one of: ${PACK_ACTIONS.join(", ")}`],
    };
  }

  switch (options.action) {
    case "list":
      return listRecipes();
    case "search":
      return searchRecipes(options);
    case "show":
      return showRecipe(options);
    case "save":
      return saveRecipe(options);
    case "use":
      return useRecipe(options);
    case "init-defaults":
      return initDefaults(options);
    case "delete":
      return deleteRecipeAction(options);
  }
}

function isPackAction(action: string): action is PackAction {
  return (PACK_ACTIONS as string[]).includes(action);
}

async function listRecipes(): Promise<PackCommandResult> {
  const recipes = await readAllRecipes();

  if (recipes.length === 0) {
    return {
      message:
        "No recipes saved yet. Run `forge pack init-defaults` to seed the built-in recipes.",
      items: [],
    };
  }

  return {
    message: `Found ${recipes.length} recipe(s):`,
    items: recipes.map(formatRecipeSummary),
  };
}

async function searchRecipes(
  options: RunPackCommandOptions,
): Promise<PackCommandResult> {
  const query = options.name?.toLowerCase();

  if (!query) {
    return {
      message: "Missing search query.",
      items: ["Example: forge pack search vercel"],
    };
  }

  const recipes = await readAllRecipes();

  const matches = recipes.filter((recipe) => {
    return (
      recipe.id.toLowerCase().includes(query) ||
      recipe.name.toLowerCase().includes(query) ||
      recipe.description.toLowerCase().includes(query) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return {
    message: `Found ${matches.length} matching recipe(s):`,
    items: matches.map(formatRecipeSummary),
  };
}

async function showRecipe(
  options: RunPackCommandOptions,
): Promise<PackCommandResult> {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack show vite-vercel-spa-rewrite"],
    };
  }

  const id = slugify(options.name);
  const recipe = await readRecipe(id);

  if (!recipe) {
    return {
      message: `Recipe not found: ${id}`,
      items: [],
    };
  }

  const items: string[] = [
    `Name: ${recipe.name}`,
    `Description: ${recipe.description}`,
    `Tags: ${recipe.tags.length > 0 ? recipe.tags.join(", ") : "(none)"}`,
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
    items,
  };
}

async function saveRecipe(
  options: RunPackCommandOptions,
): Promise<PackCommandResult> {
  if (!options.name) {
    return {
      message: "Missing recipe name.",
      items: ["Example: forge pack save my-recipe --description '...'"],
    };
  }

  const id = slugify(options.name);

  if ((await recipeExists(id)) && !options.force) {
    return {
      message: `Recipe ${id} already exists. Pass --force to overwrite.`,
      items: [`File: ${getRecipePath(id)}`],
    };
  }

  const recipe: Recipe = RecipeSchema.parse({
    id,
    name: options.name,
    description: options.description ?? "No description provided.",
    tags: parseTags(options.tags),
    files: [
      {
        path: "README_FOR_RECIPE.md",
        operation: "create",
        content: `# ${options.name}\n\nReplace this placeholder with real recipe content.\n`,
      },
    ],
  });

  await writeRecipe(recipe);

  return {
    message: `Saved recipe: ${id}`,
    items: [`Edit it at: ${getRecipePath(id)}`],
  };
}

async function useRecipe(
  options: RunPackCommandOptions,
): Promise<PackCommandResult> {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack use vite-vercel-spa-rewrite"],
    };
  }

  const id = slugify(options.name);
  const recipe = await readRecipe(id);

  if (!recipe) {
    return {
      message: `Recipe not found: ${id}`,
      items: [],
    };
  }

  const items: string[] = [];

  for (const file of recipe.files) {
    const result = await applyRecipeFile({
      file,
      cwd: options.cwd,
      dryRun: options.dryRun,
      force: options.force,
    });

    items.push(result);
  }

  return {
    message: `${options.dryRun ? "Previewed" : "Applied"} recipe: ${recipe.id}`,
    items,
  };
}

async function initDefaults(
  options: RunPackCommandOptions,
): Promise<PackCommandResult> {
  const items: string[] = [];
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

  const summary = options.dryRun
    ? `Previewed init-defaults: ${DEFAULT_RECIPE_IDS.length} recipe(s).`
    : `Initialized defaults: ${created} created, ${overwritten} overwritten, ${skipped} skipped.`;

  return {
    message: summary,
    items,
  };
}

async function deleteRecipeAction(
  options: RunPackCommandOptions,
): Promise<PackCommandResult> {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack delete my-recipe"],
    };
  }

  const id = slugify(options.name);

  if (options.dryRun) {
    const exists = await recipeExists(id);
    return {
      message: exists ? `Would delete recipe ${id}.` : `Recipe ${id} not found.`,
      items: [],
    };
  }

  const removed = await deleteRecipe(id);

  return {
    message: removed
      ? `Deleted recipe ${id}.`
      : `Recipe ${id} not found.`,
    items: [],
  };
}

async function applyRecipeFile(input: {
  file: RecipeFile;
  cwd: string;
  dryRun: boolean;
  force: boolean;
}): Promise<string> {
  const { file, cwd, dryRun, force } = input;
  const targetPath = path.join(cwd, file.path);
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
      return exists
        ? `Would append to ${file.path}`
        : `Would create ${file.path}`;
    }

    if (exists) {
      const existing = (await readTextFile(targetPath)) ?? "";
      const separator = existing.endsWith("\n") || existing === "" ? "" : "\n";
      await writeTextFile(targetPath, `${existing}${separator}${file.content}`);
      return `Appended to ${file.path}`;
    }

    await writeTextFile(targetPath, file.content);
    return `Created ${file.path}`;
  }

  return `Unsupported operation on ${file.path}`;
}

function formatRecipeSummary(recipe: Recipe): string {
  const tags = recipe.tags.length > 0 ? ` [${recipe.tags.join(", ")}]` : "";
  return `${recipe.id} — ${recipe.description}${tags}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTags(tags?: string): string[] {
  if (!tags) return [];

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export type {
  PackAction,
  PackCommandResult,
  Recipe,
  RecipeFile,
  RunPackCommandOptions,
} from "./types.js";
export { PACK_ACTIONS } from "./types.js";
