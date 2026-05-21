// src/commands/launch/reports.ts
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
async function listAllProjects() {
  const base = getReportsBaseDir();
  try {
    const entries = await fs2.readdir(base, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

// src/commands/launch/reports.ts
var LaunchReports = class _LaunchReports extends Command {
  static description = "List saved forge launch reports.";
  static examples = [
    "forge launch reports",
    "forge launch reports --project my-app"
  ];
  static flags = {
    project: Flags.string({
      description: "Show reports for a specific project only."
    })
  };
  async run() {
    const { flags } = await this.parse(_LaunchReports);
    if (flags.project) {
      await this.showProject(flags.project);
      return;
    }
    const projects = await listAllProjects();
    if (projects.length === 0) {
      this.log(
        "No saved reports found. Run `forge launch --save` to save a report."
      );
      return;
    }
    for (const project of projects) {
      await this.showProject(project);
    }
  }
  async showProject(projectName) {
    const reports = await listReports(projectName);
    if (reports.length === 0) {
      this.log(`No reports found for project: ${projectName}`);
      return;
    }
    this.log(
      `
${projectName} (${reports.length} report${reports.length === 1 ? "" : "s"})`
    );
    for (const r of reports) {
      const urlSuffix = r.url ? ` \u2014 ${r.url}` : "";
      this.log(
        `  ${r.timestamp}  ${r.score}/100 ${r.status.toUpperCase()}${urlSuffix}`
      );
    }
  }
};
export {
  LaunchReports as default
};
//# sourceMappingURL=reports.js.map