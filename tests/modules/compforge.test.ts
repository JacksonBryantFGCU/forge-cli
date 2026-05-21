import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateComponent } from "../../src/modules/compforge/index.js";
import { createTmpProject, isolateForgeHome } from "../helpers/tmp-project.js";

describe("compforge dry-run generation", () => {
  let dir: string;
  let cleanup: () => Promise<void>;
  let homeCleanup: () => Promise<void>;
  let restoreHome: () => void;

  beforeEach(async () => {
    const tmp = await createTmpProject();
    dir = tmp.dir;
    cleanup = tmp.cleanup;
    const home = await createTmpProject("forge-compforge-home-");
    homeCleanup = home.cleanup;
    restoreHome = isolateForgeHome(home.dir).restore;
  });

  afterEach(async () => {
    restoreHome();
    await homeCleanup();
    await cleanup();
  });

  it("returns Name.tsx and index.ts for a basic component dry-run", async () => {
    const result = await generateComponent({
      cwd: dir,
      name: "Navbar",
      type: "component",
      dryRun: true,
      withTest: false,
      withTypes: false,
      withMotion: false,
      force: false,
    });

    expect(result.name).toBe("Navbar");
    const paths = result.files.map((f) => f.path);
    expect(paths.some((p) => p.endsWith(path.join("Navbar", "Navbar.tsx")))).toBe(
      true,
    );
    expect(paths.some((p) => p.endsWith(path.join("Navbar", "index.ts")))).toBe(
      true,
    );
    expect(result.files.every((f) => f.action === "create")).toBe(true);
  });

  it("routes a hook into src/hooks as a single file", async () => {
    const result = await generateComponent({
      cwd: dir,
      name: "useContactForm",
      type: "hook",
      dryRun: true,
      withTest: false,
      withTypes: false,
      withMotion: false,
      force: false,
    });

    expect(result.name).toBe("useContactForm");
    expect(result.targetDir).toBe(path.join(dir, "src", "hooks"));
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path.endsWith("useContactForm.ts")).toBe(true);
  });

  it("does not write any files when dryRun is true", async () => {
    await generateComponent({
      cwd: dir,
      name: "Hero",
      type: "section",
      dryRun: true,
      withTest: true,
      withTypes: true,
      withMotion: false,
      force: false,
    });

    await expect(fs.access(path.join(dir, "src"))).rejects.toBeTruthy();
  });

  it("includes test and types files when requested", async () => {
    const result = await generateComponent({
      cwd: dir,
      name: "ContactForm",
      type: "form",
      dryRun: true,
      withTest: true,
      withTypes: true,
      withMotion: false,
      force: false,
    });

    const paths = result.files.map((f) => f.path);
    expect(paths.some((p) => p.endsWith("ContactForm.test.tsx"))).toBe(true);
    expect(paths.some((p) => p.endsWith("ContactForm.types.ts"))).toBe(true);
  });
});
