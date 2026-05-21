/**
 * Find a literal substring once and replace it. Returns null if the substring
 * is not present, so callers can decide how to surface the failure.
 */
export function replaceLiteralOnce(
  input: string,
  find: string,
  replace: string,
): string | null {
  const idx = input.indexOf(find);
  if (idx === -1) return null;
  return input.slice(0, idx) + replace + input.slice(idx + find.length);
}

/**
 * Insert `insertion` immediately after the first occurrence of `anchor`,
 * preserving everything else verbatim. Returns null if the anchor is missing.
 */
export function insertAfter(
  input: string,
  anchor: string,
  insertion: string,
): string | null {
  const idx = input.indexOf(anchor);
  if (idx === -1) return null;
  const cut = idx + anchor.length;
  return input.slice(0, cut) + insertion + input.slice(cut);
}

export function containsAny(input: string, needles: string[]): boolean {
  return needles.some((n) => input.includes(n));
}
