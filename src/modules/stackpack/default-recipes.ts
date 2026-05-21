import { readJsonFile } from "../../core/fs.js";
import { resolveTemplatePath } from "../../core/template-loader.js";
import { RecipeSchema, type Recipe } from "./types.js";

export const DEFAULT_RECIPE_IDS = [
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
  "client-contact-form",
] as const;

export type DefaultRecipeId = (typeof DEFAULT_RECIPE_IDS)[number];

export async function loadDefaultRecipes(): Promise<Recipe[]> {
  const recipes: Recipe[] = [];

  for (const id of DEFAULT_RECIPE_IDS) {
    const filePath = await resolveTemplatePath("recipes", `${id}.json`);
    const raw = await readJsonFile<unknown>(filePath);

    if (!raw) {
      throw new Error(`Default recipe template not found: ${filePath}`);
    }

    recipes.push(RecipeSchema.parse(raw));
  }

  return recipes;
}
