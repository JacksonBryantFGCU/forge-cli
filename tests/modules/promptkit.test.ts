import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generatePrompt } from "../../src/modules/promptkit/index.js";
import {
  createTmpProject,
  isolateForgeHome,
  writePackageJson,
} from "../helpers/tmp-project.js";

describe("promptkit", () => {
  let dir: string;
  let cleanup: () => Promise<void>;
  let homeCleanup: () => Promise<void>;
  let restoreHome: () => void;

  beforeEach(async () => {
    const tmp = await createTmpProject();
    dir = tmp.dir;
    cleanup = tmp.cleanup;
    const home = await createTmpProject("forge-promptkit-home-");
    homeCleanup = home.cleanup;
    restoreHome = isolateForgeHome(home.dir).restore;
    await writePackageJson(dir, {
      name: "demo-app",
      dependencies: { react: "^18.0.0" },
      devDependencies: { vite: "^5.0.0", typescript: "^5.0.0" },
      scripts: { dev: "vite", build: "vite build" },
    });
  });

  afterEach(async () => {
    restoreHome();
    await homeCleanup();
    await cleanup();
  });

  it("includes the task in a feature prompt", async () => {
    const prompt = await generatePrompt({
      cwd: dir,
      type: "feature",
      task: "add contact form",
      mode: "plan",
    });

    expect(prompt).toMatch(/add contact form/);
    expect(prompt).toMatch(/Implement a new feature/i);
  });

  it("includes debug-specific instructions for a debug prompt", async () => {
    const prompt = await generatePrompt({
      cwd: dir,
      type: "debug",
      task: "404 on refresh",
      mode: "plan",
    });

    expect(prompt).toMatch(/Diagnose and fix/i);
    expect(prompt).toMatch(/root cause/i);
  });

  it("includes detected project context", async () => {
    const prompt = await generatePrompt({
      cwd: dir,
      type: "feature",
      task: "x",
      mode: "implement",
    });

    expect(prompt).toMatch(/Framework: react-vite/);
    expect(prompt).toMatch(/Language: typescript/);
    expect(prompt).toMatch(/implement mode/);
    expect(prompt).toMatch(/Available scripts: dev, build/);
  });

  it("rejects unknown prompt types", async () => {
    await expect(
      generatePrompt({
        cwd: dir,
        type: "not-a-real-type",
        task: "x",
        mode: "plan",
      }),
    ).rejects.toThrow(/Unknown prompt type/);
  });
});
