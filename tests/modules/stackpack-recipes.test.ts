import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fileExists, readTextFile, writeTextFile } from "../../src/core/fs.js";
import { loadDefaultRecipes } from "../../src/modules/stackpack/default-recipes.js";
import { runPackCommand } from "../../src/modules/stackpack/index.js";
import { RecipeSchema } from "../../src/modules/stackpack/types.js";
import { createTmpProject, isolateForgeHome } from "../helpers/tmp-project.js";

async function findRecipe(id: string) {
  const all = await loadDefaultRecipes();
  const recipe = all.find((r) => r.id === id);
  if (!recipe) throw new Error(`expected default recipe ${id}`);
  return recipe;
}

describe("default recipes", () => {
  it("all default recipes parse against RecipeSchema", async () => {
    const recipes = await loadDefaultRecipes();
    expect(recipes.length).toBeGreaterThanOrEqual(14);
    for (const recipe of recipes) {
      expect(() => RecipeSchema.parse(recipe)).not.toThrow();
    }
  });

  it("default recipe ids are unique", async () => {
    const recipes = await loadDefaultRecipes();
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("supabase-auth-react defines the expected files and env entries", async () => {
    const recipe = await findRecipe("supabase-auth-react");
    const paths = recipe.files.map((f) => f.path);
    expect(paths).toContain("src/lib/supabase.ts");
    expect(paths).toContain("src/components/auth/AuthProvider.tsx");
    expect(paths).toContain("src/components/auth/LoginForm.tsx");

    const envFile = recipe.files.find((f) => f.path === ".env.example");
    expect(envFile?.operation).toBe("append");
    expect(envFile?.content).toMatch(/VITE_SUPABASE_URL=/);
    expect(envFile?.content).toMatch(/VITE_SUPABASE_ANON_KEY=/);
  });

  it("square-checkout-express ships sandbox-by-default env hints", async () => {
    const recipe = await findRecipe("square-checkout-express");
    const paths = recipe.files.map((f) => f.path);
    expect(paths).toContain("src/services/squareClient.ts");
    expect(paths).toContain("src/routes/squareCheckout.ts");

    const envFile = recipe.files.find((f) => f.path === ".env.example");
    expect(envFile?.content).toMatch(/SQUARE_ACCESS_TOKEN=/);
    expect(envFile?.content).toMatch(/SQUARE_LOCATION_ID=/);
    expect(envFile?.content).toMatch(/SQUARE_ENVIRONMENT=sandbox/);

    // No real secrets accidentally checked in.
    const allContent = recipe.files.map((f) => f.content).join("\n");
    expect(allContent).not.toMatch(/sk_live_/);
    expect(allContent).not.toMatch(/EAAA[A-Za-z0-9]{20,}/);
  });

  it("tailwind-ui-baseline ships Container, Button, Card with focus styles", async () => {
    const recipe = await findRecipe("tailwind-ui-baseline");
    const byPath = Object.fromEntries(recipe.files.map((f) => [f.path, f]));

    expect(byPath["src/components/ui/Container.tsx"]).toBeDefined();
    expect(byPath["src/components/ui/Button.tsx"]).toBeDefined();
    expect(byPath["src/components/ui/Card.tsx"]).toBeDefined();

    const button = byPath["src/components/ui/Button.tsx"].content;
    expect(button).toMatch(/focus-visible:ring/);
    expect(button).toMatch(/Variant/);
  });
});

describe("recipe apply behavior", () => {
  let homeCleanup: () => Promise<void>;
  let projectCleanup: () => Promise<void>;
  let restoreHome: () => void;
  let projectDir: string;

  beforeEach(async () => {
    const home = await createTmpProject("forge-recipes-home-");
    homeCleanup = home.cleanup;
    restoreHome = isolateForgeHome(home.dir).restore;
    const project = await createTmpProject("forge-recipes-proj-");
    projectDir = project.dir;
    projectCleanup = project.cleanup;
  });

  afterEach(async () => {
    restoreHome();
    await homeCleanup();
    await projectCleanup();
  });

  it("init-defaults makes every new recipe available to forge pack use", async () => {
    await runPackCommand({
      cwd: projectDir,
      action: "init-defaults",
      dryRun: false,
      force: false,
    });

    for (const id of [
      "supabase-auth-react",
      "square-checkout-express",
      "tailwind-ui-baseline",
      "client-contact-form",
      "react-router-baseline",
      "vite-vercel-client-routing",
      "express-security-baseline",
      "github-actions-vite-deploy-check",
    ]) {
      const result = await runPackCommand({
        cwd: projectDir,
        action: "show",
        name: id,
        dryRun: false,
        force: false,
      });
      expect(result.message).toContain(id);
    }
  });

  it("append skips duplicate content on re-apply", async () => {
    await runPackCommand({
      cwd: projectDir,
      action: "init-defaults",
      dryRun: false,
      force: false,
    });

    await runPackCommand({
      cwd: projectDir,
      action: "use",
      name: "supabase-auth-react",
      dryRun: false,
      force: false,
    });

    const envPath = path.join(projectDir, ".env.example");
    const after = await readTextFile(envPath);
    expect(after).not.toBeNull();
    const firstOccurrences = (after!.match(/VITE_SUPABASE_URL=/g) ?? []).length;
    expect(firstOccurrences).toBe(1);

    // Run again — should detect the existing content and skip the append.
    const second = await runPackCommand({
      cwd: projectDir,
      action: "use",
      name: "supabase-auth-react",
      dryRun: false,
      force: false,
    });

    const afterSecond = await readTextFile(envPath);
    const secondOccurrences = (afterSecond!.match(/VITE_SUPABASE_URL=/g) ?? [])
      .length;
    expect(secondOccurrences).toBe(1);
    expect(second.items.some((line) => /content already present/.test(line))).toBe(
      true,
    );
  });

  it("create skips existing files without --force", async () => {
    await runPackCommand({
      cwd: projectDir,
      action: "init-defaults",
      dryRun: false,
      force: false,
    });

    await writeTextFile(
      path.join(projectDir, "src/components/ui/Button.tsx"),
      "// pre-existing\n",
    );

    const result = await runPackCommand({
      cwd: projectDir,
      action: "use",
      name: "tailwind-ui-baseline",
      dryRun: false,
      force: false,
    });

    const button = await readTextFile(
      path.join(projectDir, "src/components/ui/Button.tsx"),
    );
    expect(button).toBe("// pre-existing\n");
    expect(result.items.some((line) => /Skipped/.test(line))).toBe(true);
    // Container should still have been created since it didn't exist.
    expect(
      await fileExists(path.join(projectDir, "src/components/ui/Container.tsx")),
    ).toBe(true);
  });
});
