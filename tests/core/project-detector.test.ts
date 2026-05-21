import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectProjectContext } from "../../src/core/project-detector.js";
import {
  createTmpProject,
  writeFile,
  writePackageJson,
} from "../helpers/tmp-project.js";

describe("core/project-detector", () => {
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

  it("detects a React + Vite project from its dependencies", async () => {
    await writePackageJson(dir, {
      name: "vite-app",
      dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
      devDependencies: { vite: "^5.0.0", typescript: "^5.0.0" },
    });

    const ctx = await detectProjectContext(dir);
    expect(ctx.framework).toBe("react-vite");
    expect(ctx.language).toBe("typescript");
  });

  it("detects an Express project from its dependencies", async () => {
    await writePackageJson(dir, {
      name: "api",
      dependencies: { express: "^4.0.0" },
    });

    const ctx = await detectProjectContext(dir);
    expect(ctx.framework).toBe("express");
  });

  it("detects TypeScript via tsconfig.json", async () => {
    await writePackageJson(dir, { name: "p" });
    await writeFile(dir, "tsconfig.json", "{}");

    const ctx = await detectProjectContext(dir);
    expect(ctx.language).toBe("typescript");
  });

  it("detects Tailwind via tailwind.config.js", async () => {
    await writePackageJson(dir, { name: "p" });
    await writeFile(dir, "tailwind.config.js", "export default {}");

    const ctx = await detectProjectContext(dir);
    expect(ctx.hasTailwind).toBe(true);
  });

  it("detects React Router via dependency", async () => {
    await writePackageJson(dir, {
      name: "site",
      dependencies: { "react-router-dom": "^6.0.0" },
    });

    const ctx = await detectProjectContext(dir);
    expect(ctx.hasReactRouter).toBe(true);
  });

  it("detects env files that exist", async () => {
    await writePackageJson(dir, { name: "p" });
    await writeFile(dir, ".env", "");
    await writeFile(dir, ".env.example", "");

    const ctx = await detectProjectContext(dir);
    expect(ctx.envFiles).toContain(".env");
    expect(ctx.envFiles).toContain(".env.example");
  });

  it("returns null packageJson when missing", async () => {
    const ctx = await detectProjectContext(dir);
    expect(ctx.packageJson).toBeNull();
  });
});
