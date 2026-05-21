import { Command, Flags } from "@oclif/core";
import { runDoctor } from "../../modules/repo-doctor/index.js";
import type {
  DoctorCategory,
  DoctorIssue,
} from "../../modules/repo-doctor/index.js";

const CATEGORIES: DoctorCategory[] = [
  "project",
  "env",
  "deployment",
  "react",
  "express",
  "security",
];

type IssueStatus = "FIXED" | "PREVIEW" | "SKIPPED" | "OPEN";

function statusFor(issue: DoctorIssue): IssueStatus {
  if (issue.fixed) return "FIXED";
  if (issue.fixPreview) return "PREVIEW";
  if (issue.fixSkipped) return "SKIPPED";
  return "OPEN";
}

function markerFor(status: IssueStatus): string {
  switch (status) {
    case "FIXED":
      return "✓";
    case "PREVIEW":
      return "→";
    case "SKIPPED":
      return "↷";
    case "OPEN":
      return "•";
  }
}

export default class Doctor extends Command {
  static override description =
    "Scan the current project for common setup, config, and deployment issues.";

  static override examples = [
    "forge doctor",
    "forge doctor --fix",
    "forge doctor --fix --dry-run",
    "forge doctor --json",
    "forge doctor --category deployment",
    "forge doctor --category deployment --fix",
    "forge doctor --rule missing-env-example",
  ];

  static override flags = {
    fix: Flags.boolean({
      description: "Attempt to automatically fix supported issues.",
      default: false,
    }),
    "dry-run": Flags.boolean({
      description:
        "When used with --fix, preview the changes without writing files.",
      default: false,
    }),
    json: Flags.boolean({
      description: "Output results as JSON.",
      default: false,
    }),
    category: Flags.string({
      description: "Only run rules in this category.",
      options: CATEGORIES,
    }),
    rule: Flags.string({
      description: "Only run the rule with this id.",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor);

    const result = await runDoctor({
      cwd: process.cwd(),
      fix: flags.fix,
      dryRun: flags["dry-run"],
      category: flags.category as DoctorCategory | undefined,
      rule: flags.rule,
    });

    if (flags.json) {
      this.log(JSON.stringify(result, null, 2));
      return;
    }

    this.log("Forge Doctor");
    this.log(`Checked: ${result.projectRoot}`);
    if (flags.fix && flags["dry-run"]) {
      this.log("(dry-run — no files will be written)");
    }
    this.log("");

    if (result.issues.length === 0) {
      this.log("✓ No issues found.");
      return;
    }

    for (const issue of result.issues) {
      const status = statusFor(issue);
      const label =
        status === "OPEN" ? issue.severity.toUpperCase() : status;
      this.log(
        `${markerFor(status)} [${label}] [${issue.category}] ${issue.title}`,
      );
      this.log(`  ${issue.message}`);
      this.log("");
    }

    const counts = {
      fixed: result.issues.filter((i) => i.fixed).length,
      preview: result.issues.filter((i) => i.fixPreview).length,
      skipped: result.issues.filter((i) => i.fixSkipped).length,
    };
    const remaining =
      result.issues.length - counts.fixed - counts.preview - counts.skipped;

    if (flags.fix) {
      this.log(
        `${counts.fixed} fixed, ${counts.preview} previewed, ${counts.skipped} skipped, ${remaining} still open (${result.issues.length} total).`,
      );
    } else {
      this.log(`${result.issues.length} issue(s) found.`);
    }
  }
}
