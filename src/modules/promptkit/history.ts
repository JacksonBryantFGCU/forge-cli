import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { ensureDir, readJsonFile, writeJsonFile } from "../../core/fs.js";
import type { PromptHistoryEntry } from "./types.js";

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
