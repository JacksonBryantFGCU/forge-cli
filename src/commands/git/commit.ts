import { Command, Flags } from "@oclif/core";
import prompts from "prompts";
import {
  commit,
  generateCommitMessage,
  getRepoStatus,
  getStagedDiff,
  isGitRepo,
  stageAll,
} from "../../modules/gitflow/index.js";

export default class GitCommit extends Command {
  static override description =
    "Stage all changes and create a commit with an AI-generated message (no push).";

  static override examples = [
    "forge git commit",
    'forge git commit --message "tighten error handling"',
    "forge git commit --yes",
    "forge git commit --no-stage",
  ];

  static override flags = {
    message: Flags.string({
      char: "m",
      description:
        "Use this commit message instead of generating one with AI/heuristics.",
    }),
    yes: Flags.boolean({
      char: "y",
      description: "Skip the confirmation prompt.",
      default: false,
    }),
    stage: Flags.boolean({
      description: "Stage all changes before committing (use --no-stage to skip).",
      default: true,
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(GitCommit);
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
      this.error("Not a git repository.");
    }

    if (flags.stage) {
      await stageAll(cwd);
    }

    const status = await getRepoStatus(cwd);

    if (status.staged.length === 0) {
      this.log("Nothing to commit, working tree clean.");
      return;
    }

    const diff = await getStagedDiff(cwd);
    const generated = await generateCommitMessage({
      diff,
      staged: status.staged,
      override: flags.message,
    });

    this.log("");
    this.log(`Branch:  ${status.branch}`);
    this.log(`Files:   ${status.staged.length} staged`);
    this.log(`Source:  ${generated.source}`);
    if (generated.note) this.log(`Note:    ${generated.note}`);
    this.log("");
    this.log(`Message: ${generated.message}`);
    this.log("");

    if (!flags.yes) {
      const confirmed = await confirm("Create commit?");
      if (!confirmed) {
        this.log("Aborted. Changes remain staged.");
        return;
      }
    }

    try {
      await commit(cwd, generated.message);
      this.log(`Committed.`);
    } catch (err) {
      this.error(formatGitError(err));
    }
  }
}

async function confirm(message: string): Promise<boolean> {
  const response = await prompts({
    type: "confirm",
    name: "ok",
    message,
    initial: true,
  });
  return response.ok === true;
}

function formatGitError(err: unknown): string {
  if (err instanceof Error) {
    const stderr = (err as { stderr?: string }).stderr;
    if (stderr && stderr.trim().length > 0) {
      return `git commit failed:\n${stderr.trim()}`;
    }
    return `git commit failed: ${err.message}`;
  }
  return `git commit failed: ${String(err)}`;
}
