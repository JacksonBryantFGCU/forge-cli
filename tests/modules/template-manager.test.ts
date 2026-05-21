import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fileExists, writeTextFile } from "../../src/core/fs.js";
import {
  listTemplates,
  openTemplate,
  resolveUserTemplatePath,
} from "../../src/modules/template-manager/index.js";
import { createTmpProject, isolateForgeHome } from "../helpers/tmp-project.js";

describe("template-manager", () => {
  let restoreHome: () => void;
  let homeCleanup: () => Promise<void>;

  beforeEach(async () => {
    const home = await createTmpProject("forge-tmpl-home-");
    homeCleanup = home.cleanup;
    restoreHome = isolateForgeHome(home.dir).restore;
  });

  afterEach(async () => {
    restoreHome();
    await homeCleanup();
  });

  it("listTemplates marks bundled-only entries as 'bundled'", async () => {
    const entries = await listTemplates();
    const componentEntry = entries.find(
      (e) =>
        e.category === "components" && e.name === "component.tsx.eta",
    );
    expect(componentEntry).toBeDefined();
    expect(componentEntry?.status).toBe("bundled");
  });

  it("listTemplates marks overridden entries when a user file exists", async () => {
    const userPath = resolveUserTemplatePath(
      "components",
      "component.tsx.eta",
    );
    await writeTextFile(userPath, "// custom\n");

    const entries = await listTemplates();
    const entry = entries.find(
      (e) =>
        e.category === "components" && e.name === "component.tsx.eta",
    );
    expect(entry?.status).toBe("overridden");
    expect(entry?.userPath).toBe(userPath);
  });

  it("listTemplates surfaces user-only entries that have no bundled counterpart", async () => {
    const userPath = resolveUserTemplatePath(
      "components",
      "extra-custom.tsx.eta",
    );
    await writeTextFile(userPath, "// mine\n");

    const entries = await listTemplates();
    const entry = entries.find(
      (e) =>
        e.category === "components" && e.name === "extra-custom.tsx.eta",
    );
    expect(entry?.status).toBe("user-only");
    expect(entry?.bundledPath).toBeNull();
  });

  it("openTemplate copies a bundled file into the user store on first open", async () => {
    const result = await openTemplate("prompts", "feature.md.eta");
    expect(result.copiedFromBundled).toBe(true);
    expect(await fileExists(result.userPath)).toBe(true);

    // Second call sees the user copy and doesn't re-copy.
    const again = await openTemplate("prompts", "feature.md.eta");
    expect(again.copiedFromBundled).toBe(false);
    expect(again.userPath).toBe(result.userPath);
  });

  it("openTemplate copies a project folder recursively", async () => {
    const result = await openTemplate("projects", "react-vite");
    expect(result.copiedFromBundled).toBe(true);
    expect(
      await fileExists(path.join(result.userPath, "template.json")),
    ).toBe(true);
    expect(
      await fileExists(path.join(result.userPath, "package.json.eta")),
    ).toBe(true);
  });

  it("openTemplate rejects unknown categories", async () => {
    await expect(openTemplate("nope", "x")).rejects.toThrow(
      /Unknown template category/,
    );
  });

  it("openTemplate rejects missing templates with a helpful error", async () => {
    await expect(
      openTemplate("components", "does-not-exist.tsx.eta"),
    ).rejects.toThrow(/not found/);
  });
});
