import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fileExists } from "../../src/core/fs.js";
import { runDoctor } from "../../src/modules/repo-doctor/index.js";
import {
  createTmpProject,
  writePackageJson,
} from "../helpers/tmp-project.js";

describe("repo-doctor rule engine", () => {
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

  it("flags missing package.json with a high severity issue", async () => {
    const result = await runDoctor({ cwd: dir, fix: false });
    const issue = result.issues.find((i) => i.id === "missing-package-json");
    expect(issue?.severity).toBe("high");
    expect(issue?.category).toBe("project");
  });

  it("reports a missing .env.example when package.json exists", async () => {
    await writePackageJson(dir, {
      name: "p",
      scripts: { build: "echo build", lint: "echo lint" },
    });

    const result = await runDoctor({ cwd: dir, fix: false });
    const issue = result.issues.find((i) => i.id === "missing-env-example");
    expect(issue).toBeDefined();
    expect(issue?.category).toBe("env");
  });

  it("creates .env.example when --fix is passed", async () => {
    await writePackageJson(dir, {
      name: "p",
      scripts: { build: "echo build", lint: "echo lint" },
    });

    const result = await runDoctor({
      cwd: dir,
      fix: true,
      rule: "missing-env-example",
    });

    const issue = result.issues.find((i) => i.id === "missing-env-example");
    expect(issue?.fixed).toBe(true);
    expect(await fileExists(path.join(dir, ".env.example"))).toBe(true);
  });

  it("flags missing vercel.json for a Vite + React Router app", async () => {
    await writePackageJson(dir, {
      name: "site",
      dependencies: {
        react: "^18.0.0",
        "react-router-dom": "^6.0.0",
      },
      devDependencies: { vite: "^5.0.0" },
    });

    const result = await runDoctor({
      cwd: dir,
      fix: false,
      category: "deployment",
    });

    const issue = result.issues.find((i) => i.id === "vercel-spa-rewrite");
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("high");
  });

  it("filters by rule id", async () => {
    await writePackageJson(dir, { name: "p" });

    const result = await runDoctor({
      cwd: dir,
      fix: false,
      rule: "missing-env-example",
    });

    expect(result.issues.every((i) => i.id === "missing-env-example")).toBe(
      true,
    );
  });
});
