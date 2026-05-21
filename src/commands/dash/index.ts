import { Command, Flags } from "@oclif/core";
import { getProjectDashboard } from "../../modules/devdash/index.js";

export default class Dash extends Command {
  static override description =
    "Show a terminal dashboard summarizing the current project.";

  static override examples = [
    "forge dash",
    "forge dash --json",
    "forge dash --with-launch",
    "forge dash --with-launch --with-build",
  ];

  static override flags = {
    json: Flags.boolean({
      description: "Output the dashboard as JSON.",
      default: false,
    }),
    "with-launch": Flags.boolean({
      description: "Include a launch-check summary (skips the build by default).",
      default: false,
    }),
    "with-build": Flags.boolean({
      description:
        "When combined with --with-launch, run the production build as part of the launch check.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Dash);

    const dashboard = await getProjectDashboard({
      cwd: process.cwd(),
      withLaunch: flags["with-launch"],
      withBuild: flags["with-build"],
    });

    if (flags.json) {
      this.log(JSON.stringify(dashboard, null, 2));
      return;
    }

    this.log("Forge Dashboard");
    this.log("");

    for (const row of dashboard.rows) {
      this.log(`${row.label}: ${row.value}`);
    }
  }
}
