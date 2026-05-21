import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { writeTextFile } from "../../src/core/fs.js";
import {
  loadTextTemplate,
  resolveTemplatePath,
  resolveUserTemplatePath,
} from "../../src/core/template-loader.js";
import { createTmpProject, isolateForgeHome } from "../helpers/tmp-project.js";

describe("template-loader user overrides", () => {
  let restoreHome: () => void;
  let homeCleanup: () => Promise<void>;

  beforeEach(async () => {
    const home = await createTmpProject("forge-loader-home-");
    homeCleanup = home.cleanup;
    restoreHome = isolateForgeHome(home.dir).restore;
  });

  afterEach(async () => {
    restoreHome();
    await homeCleanup();
  });

  it("falls back to bundled template when no user override exists", async () => {
    const resolved = await resolveTemplatePath(
      "components",
      "component.tsx.eta",
    );
    // Bundled path lives under src/templates or dist/templates, not under ~/.forge
    expect(resolved).not.toContain(path.join(".forge", "templates"));
    const contents = await loadTextTemplate("components", "component.tsx.eta");
    expect(contents).toMatch(/exportPrefix/);
  });

  it("prefers a user-supplied template when one exists", async () => {
    const userPath = resolveUserTemplatePath(
      "components",
      "component.tsx.eta",
    );
    await writeTextFile(userPath, "// OVERRIDE\n");

    const resolved = await resolveTemplatePath(
      "components",
      "component.tsx.eta",
    );
    expect(resolved).toBe(userPath);

    const contents = await loadTextTemplate("components", "component.tsx.eta");
    expect(contents).toBe("// OVERRIDE\n");
  });

  it("throws a clear error when the template is missing from both stores", async () => {
    await expect(
      loadTextTemplate("components", "does-not-exist.tsx.eta"),
    ).rejects.toThrow(/Template not found/);
  });
});
