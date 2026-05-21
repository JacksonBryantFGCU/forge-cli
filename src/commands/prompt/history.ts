import { Command } from "@oclif/core";
import { loadHistory } from "../../modules/promptkit/index.js";

export default class PromptHistory extends Command {
  static override description = "List previously generated prompts.";

  static override examples = ["forge prompt history"];

  async run(): Promise<void> {
    const history = await loadHistory();

    if (history.length === 0) {
      this.log("No prompt history found. Generate a prompt to start.");
      return;
    }

    this.log(`${history.length} saved prompt${history.length === 1 ? "" : "s"}:\n`);

    for (const entry of history) {
      const preview = entry.task.length > 60
        ? `${entry.task.slice(0, 60)}…`
        : entry.task;
      this.log(`  ${entry.id}  ${entry.timestamp}  [${entry.type}/${entry.mode}]  ${preview}`);
    }
  }
}
