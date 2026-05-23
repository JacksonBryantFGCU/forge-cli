// src/commands/git/commit.ts
import { Command, Flags } from "@oclif/core";
import prompts from "prompts";

// src/modules/gitflow/index.ts
import { execa } from "execa";

// src/modules/gitflow/message-generator.ts
var MAX_DIFF_CHARS = 8e3;
var MAX_MESSAGE_CHARS = 72;
async function generateCommitMessage(options) {
  if (options.override && options.override.trim().length > 0) {
    return {
      message: options.override.trim(),
      source: "provided"
    };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const aiMessage = await callClaudeForMessage(options.diff, apiKey);
    if (aiMessage) {
      return { message: aiMessage, source: "ai" };
    }
  }
  return {
    message: buildHeuristicMessage(options.staged),
    source: "heuristic",
    note: apiKey ? "AI request failed; used heuristic message." : "Set ANTHROPIC_API_KEY to enable AI-generated messages."
  };
}
function buildHeuristicMessage(staged) {
  if (staged.length === 0) {
    return "Update repository";
  }
  const verb = pickVerb(staged);
  if (staged.length === 1) {
    const file = staged[0];
    return clampMessage(`${verb} ${shortPath(file.path)}`);
  }
  const dirs = groupByTopDir(staged.map((c) => c.path));
  const dirNames = [...dirs.keys()];
  if (dirNames.length === 1) {
    return clampMessage(
      `${verb} ${dirNames[0]} (${staged.length} files)`
    );
  }
  const shown = dirNames.slice(0, 2).join(", ");
  const extra = dirNames.length - 2;
  const tail = extra > 0 ? ` and ${extra} more` : "";
  return clampMessage(
    `${verb} ${shown}${tail} (${staged.length} files)`
  );
}
function pickVerb(staged) {
  const allAdded = staged.every((c) => c.status === "added");
  const allDeleted = staged.every((c) => c.status === "deleted");
  if (allAdded) return "Add";
  if (allDeleted) return "Remove";
  return "Update";
}
function shortPath(path) {
  const segments = path.split(/[\\/]/);
  if (segments.length <= 2) return path;
  return segments.slice(-2).join("/");
}
function groupByTopDir(paths) {
  const counts = /* @__PURE__ */ new Map();
  for (const path of paths) {
    const segments = path.split(/[\\/]/);
    const top = segments.length > 1 ? segments[0] : "(root)";
    counts.set(top, (counts.get(top) ?? 0) + 1);
  }
  return counts;
}
function clampMessage(message) {
  if (message.length <= MAX_MESSAGE_CHARS) return message;
  return `${message.slice(0, MAX_MESSAGE_CHARS - 1)}\u2026`;
}
async function callClaudeForMessage(diff, apiKey) {
  const truncated = diff.length > MAX_DIFF_CHARS ? `${diff.slice(0, MAX_DIFF_CHARS)}

[\u2026truncated\u2026]` : diff;
  const prompt = [
    "Write a single-line git commit message for the diff below.",
    "Rules: imperative mood, under 72 characters, no quotes, no trailing period,",
    "no prefixes like 'feat:' or 'chore:'. Return only the message text.",
    "",
    "Diff:",
    truncated
  ].join("\n");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) return null;
    const firstLine = text.split("\n")[0].trim();
    const cleaned = firstLine.replace(/^["']|["']$/g, "").replace(/\.$/, "");
    if (cleaned.length === 0) return null;
    return clampMessage(cleaned);
  } catch {
    return null;
  }
}

// src/modules/gitflow/index.ts
async function isGitRepo(cwd) {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe"
    });
    return true;
  } catch {
    return false;
  }
}
async function getCurrentBranch(cwd) {
  const result = await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  return result.stdout.trim();
}
async function getRepoStatus(cwd) {
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
    unstaged
  };
}
async function getUpstream(cwd, branch) {
  try {
    const result = await execa(
      "git",
      ["rev-parse", "--abbrev-ref", `${branch}@{upstream}`],
      { cwd, stdout: "pipe", stderr: "pipe" }
    );
    return result.stdout.trim();
  } catch {
    return null;
  }
}
async function getAheadBehind(cwd, branch, upstream) {
  try {
    const result = await execa(
      "git",
      ["rev-list", "--left-right", "--count", `${upstream}...${branch}`],
      { cwd, stdout: "pipe", stderr: "pipe" }
    );
    const [behindStr, aheadStr] = result.stdout.trim().split(/\s+/);
    return {
      behind: Number.parseInt(behindStr ?? "0", 10) || 0,
      ahead: Number.parseInt(aheadStr ?? "0", 10) || 0
    };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}
async function getPorcelainStatus(cwd) {
  const result = await execa("git", ["status", "--porcelain"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  const staged = [];
  const unstaged = [];
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
        path
      });
    }
  }
  return { staged, unstaged };
}
function mapStatus(char) {
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
async function stageAll(cwd) {
  await execa("git", ["add", "-A"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
}
async function getStagedDiff(cwd) {
  const result = await execa("git", ["diff", "--cached"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  return result.stdout;
}
async function commit(cwd, message) {
  await execa("git", ["commit", "-m", message], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
}

// src/commands/git/commit.ts
var GitCommit = class _GitCommit extends Command {
  static description = "Stage all changes and create a commit with an AI-generated message (no push).";
  static examples = [
    "forge git commit",
    'forge git commit --message "tighten error handling"',
    "forge git commit --yes",
    "forge git commit --no-stage"
  ];
  static flags = {
    message: Flags.string({
      char: "m",
      description: "Use this commit message instead of generating one with AI/heuristics."
    }),
    yes: Flags.boolean({
      char: "y",
      description: "Skip the confirmation prompt.",
      default: false
    }),
    stage: Flags.boolean({
      description: "Stage all changes before committing (use --no-stage to skip).",
      default: true,
      allowNo: true
    })
  };
  async run() {
    const { flags } = await this.parse(_GitCommit);
    const cwd = process.cwd();
    if (!await isGitRepo(cwd)) {
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
      override: flags.message
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
};
async function confirm(message) {
  const response = await prompts({
    type: "confirm",
    name: "ok",
    message,
    initial: true
  });
  return response.ok === true;
}
function formatGitError(err) {
  if (err instanceof Error) {
    const stderr = err.stderr;
    if (stderr && stderr.trim().length > 0) {
      return `git commit failed:
${stderr.trim()}`;
    }
    return `git commit failed: ${err.message}`;
  }
  return `git commit failed: ${String(err)}`;
}
export {
  GitCommit as default
};
//# sourceMappingURL=commit.js.map