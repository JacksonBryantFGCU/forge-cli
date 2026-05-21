import type {
  LaunchCheck,
  LaunchCheckStatus,
  SavedReport,
} from "../../modules/launchcheck/index.js";

export type ChangeKind =
  | "fixed"
  | "regressed"
  | "new"
  | "removed"
  | "unchanged";

export type CheckRow = {
  id: string;
  title: string;
  group: string;
  prevStatus: LaunchCheckStatus | null;
  curStatus: LaunchCheckStatus | null;
  change: ChangeKind;
  message?: string;
};

export type CheckGroup = {
  group: string;
  items: CheckRow[];
};

const STATUS_RANK: Record<LaunchCheckStatus, number> = {
  pass: 0,
  warn: 1,
  fail: 2,
};

export function categorizeCheck(
  prev: LaunchCheckStatus | undefined,
  cur: LaunchCheckStatus | undefined,
): ChangeKind {
  if (prev === undefined && cur !== undefined) return "new";
  if (prev !== undefined && cur === undefined) return "removed";
  if (prev === undefined || cur === undefined) return "unchanged";
  if (prev === cur) return "unchanged";
  return STATUS_RANK[cur] < STATUS_RANK[prev] ? "fixed" : "regressed";
}

export function groupKeyFor(checkId: string): string {
  const first = checkId.split("-")[0];
  return first.length > 0 ? first : "other";
}

export function buildCheckRows(
  from: SavedReport | null,
  to: SavedReport | null,
): CheckRow[] {
  const fromById = new Map<string, LaunchCheck>(
    (from?.checks ?? []).map((c) => [c.id, c]),
  );
  const toById = new Map<string, LaunchCheck>(
    (to?.checks ?? []).map((c) => [c.id, c]),
  );

  const allIds = new Set<string>([...fromById.keys(), ...toById.keys()]);
  const rows: CheckRow[] = [];

  for (const id of allIds) {
    const prevCheck = fromById.get(id);
    const curCheck = toById.get(id);
    const title = curCheck?.title ?? prevCheck?.title ?? id;
    const message = curCheck?.message ?? prevCheck?.message;
    const change = categorizeCheck(prevCheck?.status, curCheck?.status);
    rows.push({
      id,
      title,
      group: groupKeyFor(id),
      prevStatus: prevCheck?.status ?? null,
      curStatus: curCheck?.status ?? null,
      change,
      ...(message !== undefined ? { message } : {}),
    });
  }

  return rows;
}

const CHANGE_RANK: Record<ChangeKind, number> = {
  regressed: 0,
  new: 1,
  fixed: 2,
  removed: 3,
  unchanged: 4,
};

export function groupChecks(rows: CheckRow[]): CheckGroup[] {
  const byGroup = new Map<string, CheckRow[]>();
  for (const row of rows) {
    const bucket = byGroup.get(row.group) ?? [];
    bucket.push(row);
    byGroup.set(row.group, bucket);
  }

  const groups: CheckGroup[] = [];
  for (const [group, items] of byGroup) {
    groups.push({
      group,
      items: [...items].sort(
        (a, b) => CHANGE_RANK[a.change] - CHANGE_RANK[b.change],
      ),
    });
  }
  groups.sort((a, b) => a.group.localeCompare(b.group));
  return groups;
}

export function countChanges(rows: CheckRow[]): Record<ChangeKind, number> {
  const counts: Record<ChangeKind, number> = {
    fixed: 0,
    regressed: 0,
    new: 0,
    removed: 0,
    unchanged: 0,
  };
  for (const row of rows) {
    counts[row.change] += 1;
  }
  return counts;
}

export function sortReportsNewestFirst(
  reports: SavedReport[],
): SavedReport[] {
  return [...reports].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}
