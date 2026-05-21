export type PaletteAction = {
  id: string;
  group: string;
  label: string;
  hint: string;
  shortcut?: string;
  run: () => Promise<void> | void;
};

export function filterActions(
  actions: PaletteAction[],
  query: string,
): PaletteAction[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return actions;
  return actions.filter(
    (a) =>
      a.id.toLowerCase().includes(q) ||
      a.label.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q) ||
      a.hint.toLowerCase().includes(q),
  );
}

export function groupActions(
  actions: PaletteAction[],
): Array<{ group: string; items: PaletteAction[] }> {
  const map = new Map<string, PaletteAction[]>();
  for (const action of actions) {
    const bucket = map.get(action.group) ?? [];
    bucket.push(action);
    map.set(action.group, bucket);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}
