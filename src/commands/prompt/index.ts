import { Args, Command, Flags } from "@oclif/core";
import {
  generatePrompt,
  PROMPT_TYPES,
} from "../../modules/promptkit/index.js";

export default class Prompt extends Command {
  static override description =
    "Generate structured Claude Code prompts for features, debugging, refactors, audits, tests, cleanups, deploys, and reviews.";

  static override examples = [
    'forge prompt feature "add Supabase auth"',
    'forge prompt feature "add contact form" --mode implement',
    'forge prompt debug "Vercel refresh gives 404"',
    'forge prompt refactor "split large React component" --mode plan',
    'forge prompt audit "check Express security" --mode review',
    'forge prompt cleanup "remove Stripe after Square migration" --mode plan',
    'forge prompt deploy "ship to Vercel" --mode plan',
    'forge prompt test "cover the checkout flow"',
    'forge prompt feature "add settings page" --copy',
  ];

  static override args = {
    type: Args.string({
      description: `Prompt type: ${PROMPT_TYPES.join(", ")}`,
      required: true,
      options: [...PROMPT_TYPES],
    }),
    task: Args.string({
      description: "The task you want help with.",
      required: true,
    }),
  };

  static override flags = {
    mode: Flags.string({
      description:
        "Prompt mode. plan = inspect and propose, implement = build and test, review = read and report. Defaults to defaultPromptMode from `forge config`.",
      options: ["plan", "implement", "review"],
    }),
    copy: Flags.boolean({
      description:
        "Copy the prompt to the clipboard if clipboardy is installed.",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Prompt);

    const prompt = await generatePrompt({
      cwd: process.cwd(),
      type: args.type,
      task: args.task,
      mode: flags.mode,
    });

    this.log(prompt);

    if (flags.copy) {
      const copied = await tryCopyToClipboard(prompt);

      if (copied) {
        this.log("");
        this.log("(Copied to clipboard.)");
      } else {
        this.log("");
        this.log(
          "(Clipboard copy skipped — install `clipboardy` to enable --copy.)",
        );
      }
    }
  }
}

type ClipboardyModule = {
  default?: { write(text: string): Promise<void> };
  write?: (text: string) => Promise<void>;
};

async function tryCopyToClipboard(text: string): Promise<boolean> {
  try {
    const moduleName = "clipboardy";
    const mod = (await import(moduleName)) as ClipboardyModule;
    const write = mod.default?.write ?? mod.write;

    if (!write) {
      return false;
    }

    await write(text);
    return true;
  } catch {
    return false;
  }
}
