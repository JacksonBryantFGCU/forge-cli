import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setConfigValue } from "../../src/modules/config-manager/index.js";
import { generateComponent } from "../../src/modules/compforge/index.js";
import { generatePrompt } from "../../src/modules/promptkit/index.js";
import { createProject } from "../../src/modules/devforge/index.js";
import {
  createTmpProject,
  isolateForgeHome,
  writePackageJson,
} from "../helpers/tmp-project.js";

describe("modules consume forge config", () => {
  let homeDir: string;
  let projectDir: string;
  let cleanupHome: () => Promise<void>;
  let cleanupProject: () => Promise<void>;
  let restoreHome: () => void;

  beforeEach(async () => {
    const homeTmp = await createTmpProject("forge-consumer-home-");
    homeDir = homeTmp.dir;
    cleanupHome = homeTmp.cleanup;
    restoreHome = isolateForgeHome(homeDir).restore;

    const projectTmp = await createTmpProject("forge-consumer-proj-");
    projectDir = projectTmp.dir;
    cleanupProject = projectTmp.cleanup;
  });

  afterEach(async () => {
    restoreHome();
    await cleanupHome();
    await cleanupProject();
  });

  it("promptkit falls back to defaultPromptMode when --mode is omitted", async () => {
    await setConfigValue("defaultPromptMode", "implement");
    await writePackageJson(projectDir, { name: "p" });

    const prompt = await generatePrompt({
      cwd: projectDir,
      type: "feature",
      task: "x",
    });

    expect(prompt).toMatch(/implement mode/);
    expect(prompt).not.toMatch(/plan mode/);
  });

  it("compforge emits default exports when componentStyle is default-export", async () => {
    await setConfigValue("componentStyle", "default-export");

    const result = await generateComponent({
      cwd: projectDir,
      name: "Hero",
      type: "section",
      dryRun: true,
      withTest: false,
      withTypes: false,
      withMotion: false,
      force: false,
    });

    const tsx = result.files.find((f) => f.path.endsWith("Hero.tsx"));
    const indexFile = result.files.find((f) => f.path.endsWith("index.ts"));

    expect(tsx?.content).toMatch(/export default function Hero/);
    expect(indexFile?.content).toMatch(
      /export \{ default as Hero \} from "\.\/Hero\.js"/,
    );
  });

  it("compforge emits jest imports when testFramework is jest", async () => {
    await setConfigValue("testFramework", "jest");

    const result = await generateComponent({
      cwd: projectDir,
      name: "Hero",
      type: "section",
      dryRun: true,
      withTest: true,
      withTypes: false,
      withMotion: false,
      force: false,
    });

    const testFile = result.files.find((f) =>
      f.path.endsWith("Hero.test.tsx"),
    );

    expect(testFile?.content).toMatch(/@jest\/globals/);
    expect(testFile?.content).not.toMatch(/from "vitest"/);
  });

  it("compforge skips tests and warns when testFramework is none", async () => {
    await setConfigValue("testFramework", "none");

    const result = await generateComponent({
      cwd: projectDir,
      name: "Hero",
      type: "section",
      dryRun: true,
      withTest: true,
      withTypes: false,
      withMotion: false,
      force: false,
    });

    const testFile = result.files.find((f) =>
      f.path.endsWith("Hero.test.tsx"),
    );
    expect(testFile).toBeUndefined();
    expect(result.warnings.some((w) => w.includes("testFramework"))).toBe(
      true,
    );
  });

  it("devforge reports the preferred package manager in install/dev commands", async () => {
    await setConfigValue("preferredPackageManager", "pnpm");

    const result = await createProject({
      cwd: projectDir,
      name: "app",
      template: "react-vite",
      install: false,
      dryRun: true,
    });

    expect(result.packageManager).toBe("pnpm");
    expect(result.installCommand).toBe("pnpm install");
    expect(result.devCommand).toBe("pnpm dev");
    expect(path.basename(result.projectPath)).toBe("app");
  });
});
