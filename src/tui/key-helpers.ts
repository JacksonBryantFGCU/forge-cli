/**
 * Minimal shape of Ink's `key` object — re-declared here so this module
 * stays free of any Ink runtime imports (and therefore testable without
 * a TTY).
 */
export type InkKeyShape = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
};

/**
 * Detect a Shift+P keystroke for the command palette.
 *
 * `P` (uppercase) is the trigger — either typed directly with Shift+P
 * (the canonical case, where Ink reports `input === "P"`) or with shift
 * held while `p` is emitted. Always rejects if a control modifier is
 * held to avoid accidental triggers (e.g. Ctrl+Shift+P from another
 * action).
 */
export function isPaletteShortcut(input: string, key: InkKeyShape): boolean {
  if (key.ctrl || key.meta) return false;
  if (input === "P") return true;
  if (key.shift && input === "p") return true;
  return false;
}
