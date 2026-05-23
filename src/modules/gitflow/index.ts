import { execa } from "execa";
import type { GitRepoStatus, StagedChange } from "./types.js";

export type ExecaError = Error & {
  stderr?: string;
  stdout?: string;
  exitCode?: number;
};

export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentBranch(cwd: string): Promise<string> {
  const result = await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.stdout.trim();
}

export async function getRepoStatus(cwd: string): Promise<GitRepoStatus> {
  const branch = await getCurrentBranch(cwd);
  const upstream = await getUpstream(cwd, branch);

  const { staged, unstaged } = await getPorcelainStatus(cwd);

  let ahead = 0;
  let behind = 0;
  if (upstream) {
    const counts = await getAheadBehind(cwd, branch, upstream);
    ahead = counts.ahead;
    behind = counts.behind;
  }

  return {
    branch,
    hasUpstream: upstream !== null,
    ahead,
    behind,
    staged,
    unstaged,
  };
}

async function getUpstream(
  cwd: string,
  branch: string,
): Promise<string | null> {
  try {
    const result = await execa(
      "git",
      ["rev-parse", "--abbrev-ref", `${branch}@{upstream}`],
      { cwd, stdout: "pipe", stderr: "pipe" },
    );
    return result.stdout.trim();
  } catch {
    return null;
  }
}

async function getAheadBehind(
  cwd: string,
  branch: string,
  upstream: string,
): Promise<{ ahead: number; behind: number }> {
  try {
    const result = await execa(
      "git",
      ["rev-list", "--left-right", "--count", `${upstream}...${branch}`],
      { cwd, stdout: "pipe", stderr: "pipe" },
    );
    const [behindStr, aheadStr] = result.stdout.trim().split(/\s+/);
    return {
      behind: Number.parseInt(behindStr ?? "0", 10) || 0,
      ahead: Number.parseInt(aheadStr ?? "0", 10) || 0,
    };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}

async function getPorcelainStatus(
  cwd: string,
): Promise<{ staged: StagedChange[]; unstaged: StagedChange[] }> {
  const result = await execa("git", ["status", "--porcelain"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const staged: StagedChange[] = [];
  const unstaged: StagedChange[] = [];

  for (const line of result.stdout.split("\n")) {
    if (line.length === 0) continue;

    const indexChar = line.charAt(0);
    const worktreeChar = line.charAt(1);
    const path = line.slice(3);

    if (indexChar !== " " && indexChar !== "?") {
      staged.push({ status: mapStatus(indexChar), path });
    }
    if (worktreeChar !== " " || indexChar === "?") {
      unstaged.push({
        status: indexChar === "?" ? "added" : mapStatus(worktreeChar),
        path,
      });
    }
  }

  return { staged, unstaged };
}

function mapStatus(char: string): StagedChange["status"] {
  switch (char) {
    case "A":
      return "added";
    case "M":
      return "modified";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    default:
      return "other";
  }
}

export async function stageAll(cwd: string): Promise<void> {
  await execa("git", ["add", "-A"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
}

export async function getStagedDiff(cwd: string): Promise<string> {
  const result = await execa("git", ["diff", "--cached"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return result.stdout;
}

export async function commit(cwd: string, message: string): Promise<void> {
  await execa("git", ["commit", "-m", message], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
}

export type PushResult = {
  remote: string;
  branch: string;
  setUpstream: boolean;
};

export async function push(
  cwd: string,
  options: { remote: string; branch: string; setUpstream: boolean },
): Promise<PushResult> {
  const args = ["push"];
  if (options.setUpstream) args.push("--set-upstream");
  args.push(options.remote, options.branch);

  await execa("git", args, { cwd, stdout: "pipe", stderr: "pipe" });

  return {
    remote: options.remote,
    branch: options.branch,
    setUpstream: options.setUpstream,
  };
}

export async function hasRemote(
  cwd: string,
  remote: string,
): Promise<boolean> {
  try {
    const result = await execa("git", ["remote"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    return result.stdout
      .split("\n")
      .map((s) => s.trim())
      .includes(remote);
  } catch {
    return false;
  }
}

export type {
  GitRepoStatus,
  StagedChange,
  GenerateCommitMessageOptions,
  GenerateCommitMessageResult,
  CommitMessageSource,
} from "./types.js";

export {
  generateCommitMessage,
  buildHeuristicMessage,
} from "./message-generator.js";
