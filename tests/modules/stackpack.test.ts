import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fileExists } from "../../src/core/fs.js";
import {
  deleteRecipe,
  getRecipeDirectory,
  getRecipePath,
  readAllRecipes,
  readRecipe,
  recipeExists,
  writeRecipe,
} from "../../src/modules/stackpack/recipe-store.js";
import { loadDefaultRecipes } from "../../src/modules/stackpack/default-recipes.js";
import { RecipeSchema } from "../../src/modules/stackpack/types.js";
import { createTmpProject } from "../helpers/tmp-project.js";

describe("stackpack recipe-store", () => {
  let homeDir: string;
  let cleanup: () => Promise<void>;
  const originalHome = process.env.HOME;
  const originalUserProfile = process.env.USERPROFILE;

  beforeEach(async () => {
    const tmp = await createTmpProject("forge-stackpack-");
    homeDir = tmp.dir;
    cleanup = tmp.cleanup;
    process.env.HOME = homeDir;
    process.env.USERPROFILE = homeDir;
  });

  afterEach(async () => {
    process.env.HOME = originalHome;
    process.env.USERPROFILE = originalUserProfile;
    await cleanup();
  });

  it("places recipes under the redirected forge home directory", () => {
    expect(getRecipeDirectory().startsWith(homeDir)).toBe(true);
  });

  it("writeRecipe + readRecipe round-trip a recipe through disk", async () => {
    const recipe = RecipeSchema.parse({
      id: "test-recipe",
      name: "Test recipe",
      description: "round-trip test",
      tags: ["test"],
      files: [
        {
          path: "hello.txt",
          operation: "create",
          content: "hi\n",
        },
      ],
    });

    await writeRecipe(recipe);

    expect(await recipeExists("test-recipe")).toBe(true);
    expect(await fileExists(getRecipePath("test-recipe"))).toBe(true);

    const loaded = await readRecipe("test-recipe");
    expect(loaded?.name).toBe("Test recipe");
    expect(loaded?.files[0].operation).toBe("create");
  });

  it("readAllRecipes returns every saved recipe sorted by id", async () => {
    await writeRecipe(
      RecipeSchema.parse({
        id: "b-recipe",
        name: "B",
        description: "",
        tags: [],
        files: [],
      }),
    );
    await writeRecipe(
      RecipeSchema.parse({
        id: "a-recipe",
        name: "A",
        description: "",
        tags: [],
        files: [],
      }),
    );

    const recipes = await readAllRecipes();
    expect(recipes.map((r) => r.id)).toEqual(["a-recipe", "b-recipe"]);
  });

  it("deleteRecipe removes the file and returns false when missing", async () => {
    await writeRecipe(
      RecipeSchema.parse({
        id: "doomed",
        name: "Doomed",
        description: "",
        tags: [],
        files: [],
      }),
    );

    expect(await deleteRecipe("doomed")).toBe(true);
    expect(await recipeExists("doomed")).toBe(false);
    expect(await deleteRecipe("doomed")).toBe(false);
  });

  it("every built-in default recipe parses against the schema", async () => {
    const defaults = await loadDefaultRecipes();
    expect(defaults.length).toBeGreaterThan(0);
    for (const recipe of defaults) {
      expect(() => RecipeSchema.parse(recipe)).not.toThrow();
    }
  });

  it("getRecipePath builds a path inside the recipe directory", () => {
    expect(getRecipePath("foo")).toBe(
      path.join(getRecipeDirectory(), "foo.json"),
    );
  });
});
