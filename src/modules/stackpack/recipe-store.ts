import fs from "node:fs/promises";
import path from "node:path";
import { ensureForgeHome, getForgeHomeDir } from "../../core/config.js";
import {
  ensureDir,
  fileExists,
  readJsonFile,
  writeJsonFile,
} from "../../core/fs.js";
import { loadDefaultRecipes } from "./default-recipes.js";
import { RecipeSchema, type Recipe } from "./types.js";

export function getRecipeDirectory(): string {
  return path.join(getForgeHomeDir(), "recipes");
}

export function getRecipePath(id: string): string {
  return path.join(getRecipeDirectory(), `${id}.json`);
}

export async function ensureRecipeStore(): Promise<void> {
  await ensureForgeHome();
  await ensureDir(getRecipeDirectory());
}

export async function listRecipes(): Promise<Recipe[]> {
  await ensureRecipeStore();
  const dir = getRecipeDirectory();
  const entries = await fs.readdir(dir);

  const recipes: Recipe[] = [];

  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;

    const raw = await readJsonFile<unknown>(path.join(dir, entry));

    if (!raw) continue;

    const parsed = RecipeSchema.safeParse(raw);

    if (parsed.success) {
      recipes.push(parsed.data);
    }
  }

  recipes.sort((a, b) => a.id.localeCompare(b.id));
  return recipes;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  await ensureRecipeStore();
  const raw = await readJsonFile<unknown>(getRecipePath(id));

  if (!raw) return null;

  const parsed = RecipeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  await ensureRecipeStore();
  const validated = RecipeSchema.parse(recipe);
  await writeJsonFile(getRecipePath(validated.id), validated);
}

export async function deleteRecipe(id: string): Promise<boolean> {
  await ensureRecipeStore();
  const filePath = getRecipePath(id);

  if (!(await fileExists(filePath))) {
    return false;
  }

  await fs.unlink(filePath);
  return true;
}

export async function recipeExists(id: string): Promise<boolean> {
  return fileExists(getRecipePath(id));
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const q = query.toLowerCase();
  const recipes = await listRecipes();

  return recipes.filter((recipe) => {
    return (
      recipe.id.toLowerCase().includes(q) ||
      recipe.name.toLowerCase().includes(q) ||
      recipe.description.toLowerCase().includes(q) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}

export type InstallDefaultsResult = {
  created: string[];
  overwritten: string[];
  skipped: string[];
};

export async function installDefaultRecipes(options: {
  force: boolean;
}): Promise<InstallDefaultsResult> {
  const defaults = await loadDefaultRecipes();
  const result: InstallDefaultsResult = {
    created: [],
    overwritten: [],
    skipped: [],
  };

  for (const recipe of defaults) {
    const exists = await recipeExists(recipe.id);

    if (exists && !options.force) {
      result.skipped.push(recipe.id);
      continue;
    }

    await saveRecipe(recipe);

    if (exists) {
      result.overwritten.push(recipe.id);
    } else {
      result.created.push(recipe.id);
    }
  }

  return result;
}

// Back-compat aliases used by existing tests.
export const readAllRecipes = listRecipes;
export const readRecipe = getRecipe;
export const writeRecipe = saveRecipe;
