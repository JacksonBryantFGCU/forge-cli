import { Command } from "@oclif/core";
import { clearHistory } from "../../modules/promptkit/index.js";

export default class PromptClearHistory extends Command {
  static override description = "Clear all saved prompt history.";

  static override examples = ["forge prompt clear-history"];

  async run(): Promise<void> {
    await clearHistory();
    this.log("Prompt history cleared.");
  }
}
