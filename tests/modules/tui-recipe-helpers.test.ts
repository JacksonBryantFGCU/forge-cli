import { describe, expect, it } from "vitest";
import {
  clampIndex,
  filterRecipes,
  formatOperationCounts,
  summarizeOperations,
} from "../../src/tui/screens/recipe-helpers.js";
import type { Recipe } from "../../src/modules/stackpack/types.js";

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "test-recipe",
    name: "Test recipe",
    description: "A test recipe",
    tags: [],
    files: [],
    ...overrides,
  };
}

describe("filterRecipes", () => {
  const recipes: Recipe[] = [
    makeRecipe({
      id: "vite-vercel-spa-rewrite",
      name: "Vite + Vercel SPA rewrite",
      description: "Adds vercel.json with SPA rewrite",
      tags: ["vite", "vercel"],
    }),
    makeRecipe({
      id: "supabase-auth-react",
      name: "Supabase Auth (React)",
      description: "Auth helpers for Supabase in React projects",
      tags: ["supabase", "react", "auth"],
    }),
    makeRecipe({
      id: "express-security-baseline",
      name: "Express security baseline",
      description: "Helmet, CORS, rate limit",
      tags: ["express", "security"],
    }),
  ];

  it("returns all recipes when query is empty or whitespace", () => {
    expect(filterRecipes(recipes, "")).toEqual(recipes);
    expect(filterRecipes(recipes, "   ")).toEqual(recipes);
  });

  it("matches by id", () => {
    expect(filterRecipes(recipes, "vercel").map((r) => r.id)).toEqual([
      "vite-vercel-spa-rewrite",
    ]);
  });

  it("matches by name (case-insensitive)", () => {
    expect(filterRecipes(recipes, "AUTH").map((r) => r.id)).toEqual([
      "supabase-auth-react",
    ]);
  });

  it("matches by description", () => {
    expect(filterRecipes(recipes, "helmet").map((r) => r.id)).toEqual([
      "express-security-baseline",
    ]);
  });

  it("matches by tag", () => {
    expect(filterRecipes(recipes, "supabase").map((r) => r.id)).toEqual([
      "supabase-auth-react",
    ]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterRecipes(recipes, "no-match")).toEqual([]);
  });
});

describe("summarizeOperations", () => {
  it("returns zero counts for a recipe with no files", () => {
    expect(summarizeOperations(makeRecipe())).toEqual({
      create: 0,
      overwrite: 0,
      append: 0,
    });
  });

  it("counts each operation type", () => {
    const recipe = makeRecipe({
      files: [
        { path: "a.txt", operation: "create", content: "" },
        { path: "b.txt", operation: "create", content: "" },
        { path: "c.txt", operation: "overwrite", content: "" },
        { path: "d.txt", operation: "append", content: "" },
      ],
    });
    expect(summarizeOperations(recipe)).toEqual({
      create: 2,
      overwrite: 1,
      append: 1,
    });
  });
});

describe("formatOperationCounts", () => {
  it("returns a placeholder when there are no operations", () => {
    expect(
      formatOperationCounts({ create: 0, overwrite: 0, append: 0 }),
    ).toBe("no file operations");
  });

  it("only mentions non-zero operations", () => {
    expect(
      formatOperationCounts({ create: 2, overwrite: 0, append: 1 }),
    ).toBe("2 create · 1 append");
  });

  it("uses canonical create/overwrite/append order", () => {
    expect(
      formatOperationCounts({ create: 1, overwrite: 1, append: 1 }),
    ).toBe("1 create · 1 overwrite · 1 append");
  });
});

describe("clampIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(5, 0)).toBe(0);
    expect(clampIndex(-2, 0)).toBe(0);
  });

  it("clamps negative indices", () => {
    expect(clampIndex(-1, 3)).toBe(0);
  });

  it("clamps over-large indices to the last valid slot", () => {
    expect(clampIndex(99, 3)).toBe(2);
  });

  it("passes through valid indices", () => {
    expect(clampIndex(1, 3)).toBe(1);
  });
});
