import { Command, Flags } from "@oclif/core";
import {
  diffReports,
  listReports,
  resolveProjectName,
} from "../../modules/launchcheck/reports.js";
import type { LaunchCheck } from "../../modules/launchcheck/types.js";

export default class LaunchDiff extends Command {
  static override description =
    "Compare the two most recent forge launch reports for a project.";

  static override examples = [
    "forge launch diff",
    "forge launch diff --project my-app",
  ];

  static override flags = {
    project: Flags.string({
      description:
        "Project name to diff (defaults to current directory's project name).",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(LaunchDiff);

    const projectName = await resolveProjectName(process.cwd(), flags.project);
    const reports = await listReports(projectName);

    if (reports.length === 0) {
      this.log(
        `No saved reports for project "${projectName}". Run \`forge launch --save\` first.`,
      );
      return;
    }

    if (reports.length === 1) {
      this.log(
        `Only one report saved for project "${projectName}". Need at least two to diff.`,
      );
      return;
    }

    const from = reports[reports.length - 2];
    const to = reports[reports.length - 1];
    const diff = diffReports(from, to);

    const delta = diff.scoreDelta;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;

    this.log(`\nDiff: ${diff.project}`);
    this.log(`  From: ${diff.from.timestamp}  score ${diff.from.score}/100`);
    this.log(`  To:   ${diff.to.timestamp}  score ${diff.to.score}/100`);
    this.log(`  Score change: ${deltaStr}`);

    const hasChanges =
      diff.newFailures.length > 0 ||
      diff.fixedFailures.length > 0 ||
      diff.newWarnings.length > 0 ||
      diff.fixedWarnings.length > 0;

    if (!hasChanges) {
      this.log("\nNo check changes between reports.");
      return;
    }

    this.log("");

    if (diff.newFailures.length > 0) {
      this.log("New failures:");
      for (const c of diff.newFailures) {
        this.log(`  ✗ ${this.formatCheck(c)}`);
      }
    }

    if (diff.fixedFailures.length > 0) {
      this.log("Fixed failures:");
      for (const c of diff.fixedFailures) {
        this.log(`  ✓ ${c.title}`);
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
        this.log(`  ✓ ${c.title}`);
      }
    }
  }

  private formatCheck(c: LaunchCheck): string {
    return c.message ? `${c.title} — ${c.message}` : c.title;
  }
}
