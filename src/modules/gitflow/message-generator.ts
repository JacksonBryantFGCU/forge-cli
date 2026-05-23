import type {
  GenerateCommitMessageOptions,
  GenerateCommitMessageResult,
  StagedChange,
} from "./types.js";

const MAX_DIFF_CHARS = 8000;
const MAX_MESSAGE_CHARS = 72;

export async function generateCommitMessage(
  options: GenerateCommitMessageOptions,
): Promise<GenerateCommitMessageResult> {
  if (options.override && options.override.trim().length > 0) {
    return {
      message: options.override.trim(),
      source: "provided",
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
    note: apiKey
      ? "AI request failed; used heuristic message."
      : "Set ANTHROPIC_API_KEY to enable AI-generated messages.",
  };
}

export function buildHeuristicMessage(staged: StagedChange[]): string {
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
      `${verb} ${dirNames[0]} (${staged.length} files)`,
    );
  }

  const shown = dirNames.slice(0, 2).join(", ");
  const extra = dirNames.length - 2;
  const tail = extra > 0 ? ` and ${extra} more` : "";
  return clampMessage(
    `${verb} ${shown}${tail} (${staged.length} files)`,
  );
}

function pickVerb(staged: StagedChange[]): string {
  const allAdded = staged.every((c) => c.status === "added");
  const allDeleted = staged.every((c) => c.status === "deleted");
  if (allAdded) return "Add";
  if (allDeleted) return "Remove";
  return "Update";
}

function shortPath(path: string): string {
  const segments = path.split(/[\\/]/);
  if (segments.length <= 2) return path;
  return segments.slice(-2).join("/");
}

function groupByTopDir(paths: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const path of paths) {
    const segments = path.split(/[\\/]/);
    const top = segments.length > 1 ? segments[0] : "(root)";
    counts.set(top, (counts.get(top) ?? 0) + 1);
  }
  return counts;
}

function clampMessage(message: string): string {
  if (message.length <= MAX_MESSAGE_CHARS) return message;
  return `${message.slice(0, MAX_MESSAGE_CHARS - 1)}…`;
}

type AnthropicMessagesResponse = {
  content?: Array<{ type: string; text?: string }>;
};

async function callClaudeForMessage(
  diff: string,
  apiKey: string,
): Promise<string | null> {
  const truncated =
    diff.length > MAX_DIFF_CHARS
      ? `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[…truncated…]`
      : diff;

  const prompt = [
    "Write a single-line git commit message for the diff below.",
    "Rules: imperative mood, under 72 characters, no quotes, no trailing period,",
    "no prefixes like 'feat:' or 'chore:'. Return only the message text.",
    "",
    "Diff:",
    truncated,
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as AnthropicMessagesResponse;
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
