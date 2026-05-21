// src/commands/launch/diff.ts
import { Command, Flags } from "@oclif/core";

// src/modules/launchcheck/reports.ts
import fs2 from "fs/promises";
import os from "os";
import path2 from "path";

// src/core/fs.ts
import fs from "fs/promises";
import path from "path";
async function readTextFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
async function readJsonFile(filePath) {
  const raw = await readTextFile(filePath);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// src/modules/launchcheck/reports.ts
function safeProjectName(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "unnamed";
}
async function resolveProjectName(cwd, explicit) {
  if (explicit) {
    return safeProjectName(explicit);
  }
  const raw = await readJsonFile(
    path2.join(cwd, "package.json")
  );
  if (raw?.name) {
    return safeProjectName(raw.name);
  }
  return safeProjectName(path2.basename(cwd));
}
function getReportsBaseDir() {
  return path2.join(os.homedir(), ".forge", "reports");
}
function getReportsDir(projectName) {
  return path2.join(getReportsBaseDir(), projectName);
}
async function listReports(projectName) {
  const dir = getReportsDir(projectName);
  let files;
  try {
    const entries = await fs2.readdir(dir);
    files = entries.filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const reports = [];
  for (const file of files) {
    const report = await readJsonFile(path2.join(dir, file));
    if (report) {
      reports.push(report);
    }
  }
  return reports;
}
function diffReports(from, to) {
  const fromById = new Map(
    from.checks.map((c) => [c.id, c])
  );
  const toById = new Map(to.checks.map((c) => [c.id, c]));
  const newFailures = [];
  const fixedFailures = [];
  const newWarnings = [];
  const fixedWarnings = [];
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
    fixedWarnings
  };
}

// src/commands/launch/diff.ts
var LaunchDiff = class _LaunchDiff extends Command {
  static description = "Compare the two most recent forge launch reports for a project.";
  static examples = [
    "forge launch diff",
    "forge launch diff --project my-app"
  ];
  static flags = {
    project: Flags.string({
      description: "Project name to diff (defaults to current directory's project name)."
    })
  };
  async run() {
    const { flags } = await this.parse(_LaunchDiff);
    const projectName = await resolveProjectName(process.cwd(), flags.project);
    const reports = await listReports(projectName);
    if (reports.length === 0) {
      this.log(
        `No saved reports for project "${projectName}". Run \`forge launch --save\` first.`
      );
      return;
    }
    if (reports.length === 1) {
      this.log(
        `Only one report saved for project "${projectName}". Need at least two to diff.`
      );
      return;
    }
    const from = reports[reports.length - 2];
    const to = reports[reports.length - 1];
    const diff = diffReports(from, to);
    const delta = diff.scoreDelta;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
    this.log(`
Diff: ${diff.project}`);
    this.log(`  From: ${diff.from.timestamp}  score ${diff.from.score}/100`);
    this.log(`  To:   ${diff.to.timestamp}  score ${diff.to.score}/100`);
    this.log(`  Score change: ${deltaStr}`);
    const hasChanges = diff.newFailures.length > 0 || diff.fixedFailures.length > 0 || diff.newWarnings.length > 0 || diff.fixedWarnings.length > 0;
    if (!hasChanges) {
      this.log("\nNo check changes between reports.");
      return;
    }
    this.log("");
    if (diff.newFailures.length > 0) {
      this.log("New failures:");
      for (const c of diff.newFailures) {
        this.log(`  \u2717 ${this.formatCheck(c)}`);
      }
    }
    if (diff.fixedFailures.length > 0) {
      this.log("Fixed failures:");
      for (const c of diff.fixedFailures) {
        this.log(`  \u2713 ${c.title}`);
      }
    }
    if (diff.newWarnings.length > 0) {
      this.log("New warnings:");
      for (const c of diff.newWarnings) {
        this.log(`  ! ${this.formatCheck(c)}`);
      }
    }
    if (diff.fixedWarnings.length > 0) {
      this.log("Fixed warnings:");
      for (const c of diff.fixedWarnings) {
        this.log(`  \u2713 ${c.title}`);
      }
    }
  }
  formatCheck(c) {
    return c.message ? `${c.title} \u2014 ${c.message}` : c.title;
  }
};
export {
  LaunchDiff as default
};
//# sourceMappingURL=diff.js.map