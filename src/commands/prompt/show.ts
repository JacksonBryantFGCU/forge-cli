import { Args, Command } from "@oclif/core";
import { findById, loadHistory } from "../../modules/promptkit/index.js";

export default class PromptShow extends Command {
  static override description = "Show the full text of a saved prompt by ID.";

  static override examples = ["forge prompt show a1b2c3d4"];

  static override args = {
    id: Args.string({
      description: "Prompt history entry ID (from `forge prompt history`).",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(PromptShow);

    const history = await loadHistory();
    const entry = findById(history, args.id);

    if (!entry) {
      this.error(`No prompt found with ID "${args.id}". Run \`forge prompt history\` to list saved prompts.`);
    }

    this.log(`ID:      ${entry.id}`);
    this.log(`Time:    ${entry.timestamp}`);
    this.log(`Type:    ${entry.type}`);
    this.log(`Mode:    ${entry.mode}`);
    this.log(`Task:    ${entry.task}`);
    this.log(`Project: ${entry.projectRoot}`);
    this.log("");
    this.log(entry.prompt);
  }
}
