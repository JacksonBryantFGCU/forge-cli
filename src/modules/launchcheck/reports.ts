import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureDir, readJsonFile, writeJsonFile } from "../../core/fs.js";
import type {
  LaunchCheck,
  LaunchCheckResult,
  ReportDiff,
  SavedReport,
} from "./types.js";

export function safeProjectName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "unnamed";
}

export async function resolveProjectName(
  cwd: string,
  explicit?: string,
): Promise<string> {
  if (explicit) {
    return safeProjectName(explicit);
  }

  const raw = await readJsonFile<{ name?: string }>(
    path.join(cwd, "package.json"),
  );
  if (raw?.name) {
    return safeProjectName(raw.name);
  }

  return safeProjectName(path.basename(cwd));
}

export function getReportsBaseDir(): string {
  return path.join(os.homedir(), ".forge", "reports");
}

export function getReportsDir(projectName: string): string {
  return path.join(getReportsBaseDir(), projectName);
}

function timestampToFilename(ts: string): string {
  return ts.replace(/:/g, "-").replace(/\./g, "-");
}

export async function saveReport(
  result: LaunchCheckResult,
  opts: { project: string; url?: string },
): Promise<string> {
  const timestamp = new Date().toISOString();

  const report: SavedReport = {
    ...result,
    project: opts.project,
    cwd: result.projectRoot,
    timestamp,
    ...(opts.url !== undefined ? { url: opts.url } : {}),
  };

  const dir = getReportsDir(opts.project);
  await ensureDir(dir);

  const filePath = path.join(dir, `${timestampToFilename(timestamp)}.json`);
  await writeJsonFile(filePath, report);

  return filePath;
}

export async function listReports(projectName: string): Promise<SavedReport[]> {
  const dir = getReportsDir(projectName);

  let files: string[];
  try {
    const entries = await fs.readdir(dir);
    files = entries.filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }

  const reports: SavedReport[] = [];

  for (const file of files) {
    const report = await readJsonFile<SavedReport>(path.join(dir, file));
    if (report) {
      reports.push(report);
    }
  }

  return reports;
}

export async function listAllProjects(): Promise<string[]> {
  const base = getReportsBaseDir();

  try {
    const entries = await fs.readdir(base, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

export function diffReports(from: SavedReport, to: SavedReport): ReportDiff {
  const fromById = new Map<string, LaunchCheck>(
    from.checks.map((c) => [c.id, c]),
  );
  const toById = new Map<string, LaunchCheck>(to.checks.map((c) => [c.id, c]));

  const newFailures: LaunchCheck[] = [];
  const fixedFailures: LaunchCheck[] = [];
  const newWarnings: LaunchCheck[] = [];
  const fixedWarnings: LaunchCheck[] = [];

  for (const [id, toCheck] of toById) {
    const fromCheck = fromById.get(id);
    if (toCheck.status === "fail" && fromCheck?.status !== "fail") {
      newFailures.push(toCheck);
    }
    if (toCheck.status === "warn" && fromCheck?.status !== "warn") {
      newWarnings.push(toCheck);
    }
  }

  for (const [id, fromCheck] of fromById) {
    const toCheck = toById.get(id);
    if (fromCheck.status === "fail" && toCheck?.status !== "fail") {
      fixedFailures.push(fromCheck);
    }
    if (fromCheck.status === "warn" && toCheck?.status !== "warn") {
      fixedWarnings.push(fromCheck);
    }
  }

  return {
    project: to.project,
    from: { timestamp: from.timestamp, score: from.score },
    to: { timestamp: to.timestamp, score: to.score },
    scoreDelta: to.score - from.score,
    newFailures,
    fixedFailures,
    newWarnings,
    fixedWarnings,
  };
}
