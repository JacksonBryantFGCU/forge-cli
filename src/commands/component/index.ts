import path from "node:path";
import { Args, Command, Flags } from "@oclif/core";
import {
  COMPONENT_TYPES,
  generateComponent,
  type ComponentType,
} from "../../modules/compforge/index.js";

export default class Component extends Command {
  static override description =
    "Generate a React/Vite/Tailwind component, page, hook, form, layout, section, modal, or card.";

  static override examples = [
    "forge component Navbar",
    "forge component Contact --type page",
    "forge component useContactForm --type hook",
    "forge component ContactForm --type form --with-types --with-test",
    "forge component Hero --type section --with-motion",
    "forge component ConfirmModal --type modal",
    "forge component PricingCard --type card --with-test",
    "forge component AppShell --type layout",
    "forge component Hero --dry-run",
    "forge component Banner --path src/marketing --force",
  ];

  static override args = {
    name: Args.string({
      description: "Name of the component, page, hook, form, etc.",
      required: true,
    }),
  };

  static override flags = {
    type: Flags.string({
      char: "t",
      description: "What to generate.",
      options: [...COMPONENT_TYPES],
      default: "component",
    }),
    "dry-run": Flags.boolean({
      description: "Preview files without writing them.",
      default: false,
    }),
    "with-test": Flags.boolean({
      description: "Also generate a co-located test file.",
      default: false,
    }),
    "with-types": Flags.boolean({
      description: "Also generate a co-located Props types file.",
      default: false,
    }),
    "with-motion": Flags.boolean({
      description:
        "Wrap the root element with framer-motion (does not install the dependency).",
      default: false,
    }),
    path: Flags.string({
      description:
        "Custom target directory (overrides the default location for this type).",
    }),
    force: Flags.boolean({
      description: "Overwrite existing files.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Component);

    const result = await generateComponent({
      cwd: process.cwd(),
      name: args.name,
      type: flags.type as ComponentType,
      dryRun: flags["dry-run"],
      withTest: flags["with-test"],
      withTypes: flags["with-types"],
      withMotion: flags["with-motion"],
      customPath: flags.path,
      force: flags.force,
    });

    const verb = flags["dry-run"] ? "Previewed" : "Generated";
    this.log(`${verb} ${result.type}: ${result.name}`);
    this.log(`Target: ${path.relative(process.cwd(), result.targetDir) || "."}`);
    this.log("");

    for (const file of result.files) {
      const rel = path.relative(process.cwd(), file.path) || file.path;
      const label = describeAction(file.action, flags["dry-run"]);
      this.log(`${label} ${rel}`);
    }

    const skipped = result.files.filter((f) => f.action === "skip").length;

    if (skipped > 0 && !flags.force) {
      this.log("");
      this.log(
        `${skipped} file(s) already exist and were skipped. Pass --force to overwrite.`,
      );
    }

    if (result.warnings.length > 0) {
      this.log("");
      for (const warning of result.warnings) {
        this.log(`! ${warning}`);
      }
    }
  }
}

function describeAction(action: string, dryRun: boolean): string {
  if (action === "skip") return "Skipped (exists)";
  if (action === "overwrite") return dryRun ? "Would overwrite" : "Overwrote";
  return dryRun ? "Would create" : "Created";
}
