import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  diffReports,
  listAllProjects,
  listReports,
  resolveProjectName,
  safeProjectName,
  saveReport,
} from "../../src/modules/launchcheck/reports.js";
import type { LaunchCheckResult, SavedReport } from "../../src/modules/launchcheck/types.js";
import {
  createTmpProject,
  isolateForgeHome,
  writeFile,
  type IsolatedHome,
  type TmpProject,
} from "../helpers/tmp-project.js";

function makeResult(overrides: Partial<LaunchCheckResult> = {}): LaunchCheckResult {
  return {
    projectRoot: "/tmp/my-project",
    score: 80,
    status: "pass",
    strict: false,
    checks: [
      { id: "build", title: "Build succeeds", status: "pass" },
      { id: "env-example", title: "Env example present", status: "warn", message: "missing .env.example" },
    ],
    ...overrides,
  };
}

function makeSavedReport(overrides: Partial<SavedReport> = {}): SavedReport {
  return {
    ...makeResult(),
    project: "my-project",
    cwd: "/tmp/my-project",
    timestamp: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("safeProjectName", () => {
  it("lowercases and replaces non-alphanumeric with dashes", () => {
    expect(safeProjectName("My Cool App")).toBe("my-cool-app");
    expect(safeProjectName("@scope/pkg-name")).toBe("scope-pkg-name");
  });

  it("strips leading and trailing dashes", () => {
    expect(safeProjectName("---foo---")).toBe("foo");
  });

  it("falls back to 'unnamed' for empty-ish input", () => {
    expect(safeProjectName("!!!")).toBe("unnamed");
  });
});

describe("resolveProjectName", () => {
  let tmp: TmpProject;

  beforeEach(async () => {
    tmp = await createTmpProject("forge-reports-resolve-");
  });

  afterEach(async () => {
    await tmp.cleanup();
  });

  it("uses explicit name when provided", async () => {
    const name = await resolveProjectName(tmp.dir, "My App");
    expect(name).toBe("my-app");
  });

  it("reads name from package.json", async () => {
    await writeFile(tmp.dir, "package.json", JSON.stringify({ name: "@acme/frontend" }));
    const name = await resolveProjectName(tmp.dir);
    expect(name).toBe("acme-frontend");
  });

  it("falls back to directory name when no package.json", async () => {
    const name = await resolveProjectName(tmp.dir);
    expect(name).toMatch(/^forge-reports-resolve-/);
  });
});

describe("saveReport / listReports", () => {
  let tmp: TmpProject;
  let home: IsolatedHome;

  beforeEach(async () => {
    tmp = await createTmpProject("forge-reports-home-");
    home = isolateForgeHome(tmp.dir);
  });

  afterEach(async () => {
    home.restore();
    await tmp.cleanup();
  });

  it("saves a report and reads it back via listReports", async () => {
    const result = makeResult();
    await saveReport(result, { project: "my-project" });

    const reports = await listReports("my-project");
    expect(reports).toHaveLength(1);
    expect(reports[0].project).toBe("my-project");
    expect(reports[0].score).toBe(80);
    expect(reports[0].status).toBe("pass");
    expect(reports[0].checks).toHaveLength(2);
    expect(reports[0].url).toBeUndefined();
  });

  it("saves url when provided", async () => {
    await saveReport(makeResult(), { project: "my-project", url: "https://example.com" });
    const [report] = await listReports("my-project");
    expect(report.url).toBe("https://example.com");
  });

  it("returns reports sorted oldest to newest by filename", async () => {
    await saveReport(makeResult({ score: 60 }), { project: "proj" });
    await new Promise((r) => setTimeout(r, 10));
    await saveReport(makeResult({ score: 80 }), { project: "proj" });

    const reports = await listReports("proj");
    expect(reports).toHaveLength(2);
    expect(reports[0].score).toBe(60);
    expect(reports[1].score).toBe(80);
  });

  it("returns empty array when no reports exist for a project", async () => {
    const reports = await listReports("nonexistent-project");
    expect(reports).toHaveLength(0);
  });
});

describe("listAllProjects", () => {
  let tmp: TmpProject;
  let home: IsolatedHome;

  beforeEach(async () => {
    tmp = await createTmpProject("forge-reports-all-");
    home = isolateForgeHome(tmp.dir);
  });

  afterEach(async () => {
    home.restore();
    await tmp.cleanup();
  });

  it("returns empty array when no projects exist", async () => {
    const projects = await listAllProjects();
    expect(projects).toHaveLength(0);
  });

  it("lists all project names sorted alphabetically", async () => {
    await saveReport(makeResult(), { project: "zeta" });
    await saveReport(makeResult(), { project: "alpha" });
    await saveReport(makeResult(), { project: "beta" });

    const projects = await listAllProjects();
    expect(projects).toEqual(["alpha", "beta", "zeta"]);
  });
});

describe("diffReports", () => {
  it("detects new and fixed failures", () => {
    const from = makeSavedReport({
      timestamp: "2026-01-01T00:00:00.000Z",
      score: 60,
      checks: [
        { id: "build", title: "Build", status: "fail" },
        { id: "env", title: "Env", status: "pass" },
      ],
    });

    const to = makeSavedReport({
      timestamp: "2026-01-02T00:00:00.000Z",
      score: 80,
      checks: [
        { id: "build", title: "Build", status: "pass" },
        { id: "env", title: "Env", status: "fail" },
      ],
    });

    const diff = diffReports(from, to);

    expect(diff.scoreDelta).toBe(20);
    expect(diff.newFailures.map((c) => c.id)).toEqual(["env"]);
    expect(diff.fixedFailures.map((c) => c.id)).toEqual(["build"]);
    expect(diff.newWarnings).toHaveLength(0);
    expect(diff.fixedWarnings).toHaveLength(0);
  });

  it("detects new and fixed warnings", () => {
    const from = makeSavedReport({
      checks: [{ id: "meta", title: "Meta description", status: "warn" }],
    });

    const to = makeSavedReport({
      checks: [
        { id: "meta", title: "Meta description", status: "pass" },
        { id: "og", title: "Open Graph", status: "warn" },
      ],
    });

    const diff = diffReports(from, to);

    expect(diff.fixedWarnings.map((c) => c.id)).toEqual(["meta"]);
    expect(diff.newWarnings.map((c) => c.id)).toEqual(["og"]);
  });

  it("returns empty change lists when reports are identical", () => {
    const report = makeSavedReport();
    const diff = diffReports(report, report);

    expect(diff.newFailures).toHaveLength(0);
    expect(diff.fixedFailures).toHaveLength(0);
    expect(diff.newWarnings).toHaveLength(0);
    expect(diff.fixedWarnings).toHaveLength(0);
    expect(diff.scoreDelta).toBe(0);
  });

  it("handles checks that appear only in 'to' as new failures/warnings", () => {
    const from = makeSavedReport({ checks: [] });
    const to = makeSavedReport({
      checks: [
        { id: "new-check", title: "New Check", status: "fail" },
        { id: "new-warn", title: "New Warn", status: "warn" },
      ],
    });

    const diff = diffReports(from, to);

    expect(diff.newFailures.map((c) => c.id)).toContain("new-check");
    expect(diff.newWarnings.map((c) => c.id)).toContain("new-warn");
  });

  it("handles checks that disappear from 'to' as fixed", () => {
    const from = makeSavedReport({
      checks: [
        { id: "gone-fail", title: "Gone Fail", status: "fail" },
        { id: "gone-warn", title: "Gone Warn", status: "warn" },
      ],
    });
    const to = makeSavedReport({ checks: [] });

    const diff = diffReports(from, to);

    expect(diff.fixedFailures.map((c) => c.id)).toContain("gone-fail");
    expect(diff.fixedWarnings.map((c) => c.id)).toContain("gone-warn");
  });
});
