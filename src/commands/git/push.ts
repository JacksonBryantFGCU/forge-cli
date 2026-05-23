import { Command, Flags } from "@oclif/core";
import prompts from "prompts";
import {
  commit,
  generateCommitMessage,
  getRepoStatus,
  getStagedDiff,
  hasRemote,
  isGitRepo,
  push,
  stageAll,
} from "../../modules/gitflow/index.js";

export default class GitPush extends Command {
  static override description =
    "Stage all changes, generate an AI commit message, commit, and push to origin.";

  static override examples = [
    "forge git push",
    'forge git push --message "fix login redirect"',
    "forge git push --yes",
    "forge git push --no-stage",
    "forge git push --remote upstream",
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
    remote: Flags.string({
      description: "Remote to push to.",
      default: "origin",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(GitPush);
    const cwd = process.cwd();

    if (!(await isGitRepo(cwd))) {
      this.error("Not a git repository.");
    }

    if (!(await hasRemote(cwd, flags.remote))) {
      this.error(`Remote not found: ${flags.remote}`);
    }

    if (flags.stage) {
      await stageAll(cwd);
    }

    const status = await getRepoStatus(cwd);

    if (status.staged.length === 0) {
      if (status.ahead > 0) {
        this.log(
          `Nothing to commit. Pushing ${status.ahead} existing commit(s) to ${flags.remote}/${status.branch}…`,
        );
        await this.runPush(cwd, status.branch, flags.remote, status.hasUpstream);
        return;
      }
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
      const confirmed = await confirm(
        `Commit and push to ${flags.remote}/${status.branch}?`,
      );
      if (!confirmed) {
        this.log("Aborted. Changes remain staged.");
        return;
      }
    }

    try {
      await commit(cwd, generated.message);
      this.log(`Committed.`);
    } catch (err) {
      this.error(formatGitError("commit", err));
    }

    await this.runPush(cwd, status.branch, flags.remote, status.hasUpstream);
  }

  private async runPush(
    cwd: string,
    branch: string,
    remote: string,
    hasUpstream: boolean,
  ): Promise<void> {
    try {
      const result = await push(cwd, {
        remote,
        branch,
        setUpstream: !hasUpstream,
      });
      this.log(
        `Pushed to ${result.remote}/${result.branch}${result.setUpstream ? " (set upstream)" : ""}.`,
      );
    } catch (err) {
      this.error(formatGitError("push", err));
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

function formatGitError(action: string, err: unknown): string {
  if (err instanceof Error) {
    const stderr = (err as { stderr?: string }).stderr;
    if (stderr && stderr.trim().length > 0) {
      return `git ${action} failed:\n${stderr.trim()}`;
    }
    return `git ${action} failed: ${err.message}`;
  }
  return `git ${action} failed: ${String(err)}`;
}
