import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { ensureDir, readJsonFile, writeJsonFile } from "../../core/fs.js";
import { writeToClipboard } from "./clipboard.js";
import type { PromptHistoryEntry } from "./types.js";

export type CopyPromptResult = {
  copied: boolean;
  reason?: string;
};

export function getHistoryPath(): string {
  return path.join(os.homedir(), ".forge", "prompts", "history.json");
}

export function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export async function loadHistory(): Promise<PromptHistoryEntry[]> {
  const data = await readJsonFile<PromptHistoryEntry[]>(getHistoryPath());
  return Array.isArray(data) ? data : [];
}

export async function appendToHistory(
  entry: PromptHistoryEntry,
): Promise<void> {
  await ensureDir(path.dirname(getHistoryPath()));
  const history = await loadHistory();
  history.push(entry);
  await writeJsonFile(getHistoryPath(), history);
}

export async function clearHistory(): Promise<void> {
  await ensureDir(path.dirname(getHistoryPath()));
  await writeJsonFile(getHistoryPath(), []);
}

export function findById(
  history: PromptHistoryEntry[],
  id: string,
): PromptHistoryEntry | undefined {
  return history.find((e) => e.id === id);
}

export async function copyPrompt(id: string): Promise<CopyPromptResult> {
  const history = await loadHistory();
  const entry = findById(history, id);

  if (!entry) {
    return { copied: false, reason: `Prompt not found: ${id}` };
  }

  const ok = await writeToClipboard(entry.prompt);
  if (ok) {
    return { copied: true };
  }

  return {
    copied: false,
    reason: "Clipboard unavailable. Install `clipboardy` to enable copy.",
  };
}
