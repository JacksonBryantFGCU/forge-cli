import { Args, Command, Flags } from "@oclif/core";
import {
  createProject,
  TEMPLATE_NAMES,
} from "../../modules/devforge/index.js";

export default class New extends Command {
  static override description = "Create a new project from a Forge template.";

  static override examples = [
    "forge new my-app",
    "forge new my-app --template react-vite-tailwind --dry-run",
    "forge new api --template express-api --dry-run",
    "forge new contractor-site --template client-static-site --dry-run",
    "forge new client-site --template client-static-site --install",
    "forge new lab --template react-vite",
  ];

  static override args = {
    name: Args.string({
      description: "Project name.",
      required: true,
    }),
  };

  static override flags = {
    template: Flags.string({
      char: "t",
      description: "Project template to use.",
      options: [...TEMPLATE_NAMES],
      default: "react-vite-tailwind",
    }),
    install: Flags.boolean({
      description: "Install dependencies after creating the project.",
      default: false,
    }),
    "dry-run": Flags.boolean({
      description: "Preview files without writing them.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(New);

    const result = await createProject({
      cwd: process.cwd(),
      name: args.name,
      template: flags.template,
      install: flags.install,
      dryRun: flags["dry-run"],
    });

    this.log(
      `${flags["dry-run"] ? "Previewed" : "Created"} project: ${result.projectName} (${result.template})`,
    );
    this.log(`Location: ${result.projectPath}`);
    this.log("");

    for (const file of result.files) {
      this.log(`${flags["dry-run"] ? "Would create" : "Created"} ${file}`);
    }

    if (!flags["dry-run"] && !flags.install) {
      this.log("");
      this.log("Next steps:");
      this.log(`cd ${result.projectName}`);
      this.log(result.installCommand);
      this.log(result.devCommand);
    }
  }
}
