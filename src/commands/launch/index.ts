import { Command, Flags } from "@oclif/core";
import { runLaunchCheck } from "../../modules/launchcheck/index.js";
import {
  resolveProjectName,
  saveReport,
} from "../../modules/launchcheck/reports.js";

export default class Launch extends Command {
  static override description =
    "Run a practical pre-launch checklist for React/Vite/Vercel client sites.";

  static override examples = [
    "forge launch",
    "forge launch --skip-build",
    "forge launch --json",
    "forge launch --strict",
    "forge launch --url https://example.com",
    "forge launch --url https://example.com --strict",
    "forge launch --url https://example.com --live-only",
  ];

  static override flags = {
    url: Flags.string({
      description:
        "Production URL to fetch and validate (status, headers, HTML, TTFB).",
    }),
    json: Flags.boolean({
      description: "Output results as JSON.",
      default: false,
    }),
    "skip-build": Flags.boolean({
      description: "Skip running the production build (faster but less safe).",
      default: false,
    }),
    "live-only": Flags.boolean({
      description:
        "Skip local checks and only validate the live deployment. Requires --url.",
      default: false,
    }),
    strict: Flags.boolean({
      description:
        "Treat warnings as launch blockers in the overall score and status.",
      default: false,
    }),
    save: Flags.boolean({
      description:
        "Save the result to ~/.forge/reports/<project>/<timestamp>.json.",
      default: false,
    }),
    project: Flags.string({
      description:
        "Project name used when saving reports (defaults to package.json name or directory name).",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Launch);

    const result = await runLaunchCheck({
      cwd: process.cwd(),
      url: flags.url,
      skipBuild: flags["skip-build"],
      strict: flags.strict,
      liveOnly: flags["live-only"],
    });

    if (flags.json) {
      this.log(JSON.stringify(result, null, 2));
      return;
    }

    this.log("Forge Launch Check");
    this.log(`Checked: ${result.projectRoot}`);
    this.log(
      `Score: ${result.score}/100 — ${result.status.toUpperCase()}${result.strict ? " (strict)" : ""}`,
    );
    this.log("");

    for (const check of result.checks) {
      const symbol =
        check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "✗";
      this.log(`${symbol} [${check.status.toUpperCase()}] ${check.title}`);

      if (check.message) {
        this.log(`  ${check.message}`);
      }
    }

    const counts = {
      pass: result.checks.filter((c) => c.status === "pass").length,
      warn: result.checks.filter((c) => c.status === "warn").length,
      fail: result.checks.filter((c) => c.status === "fail").length,
    };

    this.log("");
    this.log(
      `${counts.pass} passed, ${counts.warn} warning(s), ${counts.fail} failing.`,
    );

    if (flags.save) {
      const projectName = await resolveProjectName(
        process.cwd(),
        flags.project,
      );
      const savedPath = await saveReport(result, {
        project: projectName,
        url: flags.url,
      });
      this.log(`\nReport saved: ${savedPath}`);
    }
  }
}
