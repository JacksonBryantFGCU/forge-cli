import { Args, Command, Flags } from "@oclif/core";
import { PACK_ACTIONS, runPackCommand } from "../../modules/stackpack/index.js";

export default class Pack extends Command {
  static override description =
    "Manage reusable development recipes stored in ~/.forge/recipes.";

  static override examples = [
    "forge pack init-defaults",
    "forge pack list",
    "forge pack search vercel",
    "forge pack show vite-vercel-spa-rewrite",
    "forge pack use vite-vercel-spa-rewrite --dry-run",
    "forge pack use vite-vercel-spa-rewrite --force",
    'forge pack save my-recipe --description "Setup snippet" --tags vite,react',
    "forge pack delete my-recipe",
  ];

  static override args = {
    action: Args.string({
      description: `Action to run.`,
      required: true,
      options: [...PACK_ACTIONS],
    }),
    name: Args.string({
      description:
        "Recipe id or search query (required for show/use/save/search/delete).",
      required: false,
    }),
  };

  static override flags = {
    description: Flags.string({
      description: "Description for a saved recipe.",
    }),
    tags: Flags.string({
      description: "Comma-separated tags for a saved recipe.",
    }),
    "dry-run": Flags.boolean({
      description: "Preview changes without writing files.",
      default: false,
    }),
    force: Flags.boolean({
      description:
        "Overwrite existing files (when applying a recipe) or existing recipe definitions (when saving / init-defaults).",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Pack);

    const result = await runPackCommand({
      cwd: process.cwd(),
      action: args.action,
      name: args.name,
      description: flags.description,
      tags: flags.tags,
      dryRun: flags["dry-run"],
      force: flags.force,
    });

    this.log(result.message);

    if (result.items.length > 0) {
      this.log("");

      for (const item of result.items) {
        this.log(item);
      }
    }
  }
}
