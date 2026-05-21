import { Args, Command } from "@oclif/core";
import {
  getUserTemplatesRoot,
  listTemplates,
  openTemplate,
  TEMPLATE_CATEGORIES,
  type TemplateCategory,
} from "../../modules/template-manager/index.js";

const ACTIONS = ["path", "list", "open"] as const;

export default class Template extends Command {
  static override description =
    "Inspect and override Forge's bundled templates with files in ~/.forge/templates.";

  static override examples = [
    "forge template path",
    "forge template list",
    "forge template open components component.tsx.eta",
    "forge template open prompts feature.md.eta",
    "forge template open projects react-vite-tailwind",
    "forge template open recipes vite-vercel-spa-rewrite.json",
  ];

  static override args = {
    action: Args.string({
      description: "Action to run.",
      required: true,
      options: [...ACTIONS],
    }),
    category: Args.string({
      description: `Template category (one of: ${TEMPLATE_CATEGORIES.join(", ")}). Required for \`open\`.`,
      required: false,
    }),
    name: Args.string({
      description:
        "Template name. For projects, the folder name; otherwise the filename.",
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Template);

    if (args.action === "path") {
      this.log(getUserTemplatesRoot());
      return;
    }

    if (args.action === "list") {
      const entries = await listTemplates();
      if (entries.length === 0) {
        this.log("No templates found.");
        return;
      }
      let currentCategory: TemplateCategory | null = null;
      for (const entry of entries) {
        if (entry.category !== currentCategory) {
          if (currentCategory !== null) this.log("");
          this.log(`[${entry.category}]`);
          currentCategory = entry.category;
        }
        this.log(`  ${entry.name} — ${entry.status}`);
      }
      return;
    }

    if (args.action === "open") {
      if (!args.category || !args.name) {
        this.error("Usage: forge template open <category> <name>");
      }
      try {
        const result = await openTemplate(args.category, args.name);
        this.log(result.userPath);
        if (result.copiedFromBundled) {
          this.log(
            `(copied from bundled ${result.bundledPath} — edit the user copy to override)`,
          );
        }
      } catch (err) {
        this.error(err instanceof Error ? err.message : String(err));
      }
      return;
    }
  }
}
