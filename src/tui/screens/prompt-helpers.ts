import type {
  PromptHistoryEntry,
  PromptType,
} from "../../modules/promptkit/types.js";

export const PROMPT_TYPE_LIST: PromptType[] = [
  "feature",
  "debug",
  "refactor",
  "audit",
  "test",
  "cleanup",
  "deploy",
  "review",
];

export function filterPrompts(
  prompts: PromptHistoryEntry[],
  query: string,
  typeFilter: PromptType | null,
): PromptHistoryEntry[] {
  const q = query.trim().toLowerCase();

  return prompts.filter((entry) => {
    if (typeFilter !== null && entry.type !== typeFilter) {
      return false;
    }
    if (q.length === 0) return true;
    return (
      entry.id.toLowerCase().includes(q) ||
      entry.task.toLowerCase().includes(q) ||
      entry.type.toLowerCase().includes(q) ||
      entry.mode.toLowerCase().includes(q) ||
      entry.projectRoot.toLowerCase().includes(q)
    );
  });
}

export function sortNewestFirst(
  prompts: PromptHistoryEntry[],
): PromptHistoryEntry[] {
  return [...prompts].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function cycleTypeFilter(
  current: PromptType | null,
): PromptType | null {
  if (current === null) {
    return PROMPT_TYPE_LIST[0];
  }
  const idx = PROMPT_TYPE_LIST.indexOf(current);
  if (idx === -1 || idx === PROMPT_TYPE_LIST.length - 1) {
    return null;
  }
  return PROMPT_TYPE_LIST[idx + 1];
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

export function formatTimestamp(iso: string): string {
  // Compact, readable form. Falls back to the raw string if Date parsing fails.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
