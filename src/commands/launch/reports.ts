import { Command, Flags } from "@oclif/core";
import {
  listAllProjects,
  listReports,
} from "../../modules/launchcheck/reports.js";

export default class LaunchReports extends Command {
  static override description = "List saved forge launch reports.";

  static override examples = [
    "forge launch reports",
    "forge launch reports --project my-app",
  ];

  static override flags = {
    project: Flags.string({
      description: "Show reports for a specific project only.",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(LaunchReports);

    if (flags.project) {
      await this.showProject(flags.project);
      return;
    }

    const projects = await listAllProjects();

    if (projects.length === 0) {
      this.log(
        "No saved reports found. Run `forge launch --save` to save a report.",
      );
      return;
    }

    for (const project of projects) {
      await this.showProject(project);
    }
  }

  private async showProject(projectName: string): Promise<void> {
    const reports = await listReports(projectName);

    if (reports.length === 0) {
      this.log(`No reports found for project: ${projectName}`);
      return;
    }

    this.log(
      `\n${projectName} (${reports.length} report${reports.length === 1 ? "" : "s"})`,
    );

    for (const r of reports) {
      const urlSuffix = r.url ? ` — ${r.url}` : "";
      this.log(
        `  ${r.timestamp}  ${r.score}/100 ${r.status.toUpperCase()}${urlSuffix}`,
      );
    }
  }
}
