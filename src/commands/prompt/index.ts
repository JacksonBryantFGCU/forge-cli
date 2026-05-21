import { Args, Command, Flags } from "@oclif/core";
import {
  appendToHistory,
  generateId,
  generatePrompt,
  PROMPT_TYPES,
  resolvePromptMode,
} from "../../modules/promptkit/index.js";
import type { PromptHistoryEntry } from "../../modules/promptkit/index.js";

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
    'forge prompt feature "add auth" --no-save',
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
    save: Flags.boolean({
      description: "Save the generated prompt to history (use --no-save to skip).",
      default: true,
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Prompt);

    const cwd = process.cwd();
    const resolvedMode = await resolvePromptMode(flags.mode);

    const prompt = await generatePrompt({
      cwd,
      type: args.type,
      task: args.task,
      mode: resolvedMode,
    });

    this.log(prompt);

    if (flags.save) {
      const entry: PromptHistoryEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        type: args.type as PromptHistoryEntry["type"],
        mode: resolvedMode,
        task: args.task,
        projectRoot: cwd,
        prompt,
      };
      await appendToHistory(entry);
    }

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
