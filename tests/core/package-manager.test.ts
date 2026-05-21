import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectPackageManager } from "../../src/core/package-manager.js";
import { createTmpProject, writeFile } from "../helpers/tmp-project.js";

describe("core/package-manager", () => {
  let dir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const tmp = await createTmpProject();
    dir = tmp.dir;
    cleanup = tmp.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  it("detects npm from package-lock.json", async () => {
    await writeFile(dir, "package-lock.json", "{}");
    expect(await detectPackageManager(dir)).toBe("npm");
  });

  it("detects pnpm from pnpm-lock.yaml", async () => {
    await writeFile(dir, "pnpm-lock.yaml", "lockfileVersion: 6.0\n");
    expect(await detectPackageManager(dir)).toBe("pnpm");
  });

  it("detects yarn from yarn.lock", async () => {
    await writeFile(dir, "yarn.lock", "# yarn lockfile\n");
    expect(await detectPackageManager(dir)).toBe("yarn");
  });

  it("returns unknown when no lockfile is present", async () => {
    expect(await detectPackageManager(dir)).toBe("unknown");
  });
});
