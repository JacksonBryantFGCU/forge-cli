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
 * Detect a keystroke that should open the command palette.
 *
 * Accepts (any of):
 *   - Ctrl+K with `input === "k"` / `"K"` — the documented Ink case.
 *   - Ctrl+<anything> with `input === ""` — defensive fallback for some
 *     Windows Terminal / PowerShell setups where ctrl + letter arrives
 *     with `key.ctrl === true` but a blank `input`.
 *   - The raw VT control character `\v` (`\x0b`) — emitted by terminals
 *     that bypass Node's readline keypress parsing.
 *   - The literal `:` key without any modifier — a vim-style alternate
 *     that always works even when the terminal or shell intercepts
 *     Ctrl+K.
 */
export function isPaletteShortcut(input: string, key: InkKeyShape): boolean {
  // Vim-style alternate. Modifier-free so ctrl+: edge cases don't fire it.
  if (!key.ctrl && !key.meta && input === ":") return true;

  // Raw VT control character (Ctrl+K in some terminals).
  if (input === "\v") return true;

  if (key.ctrl) {
    if (input === "k" || input === "K") return true;
    // Windows-terminal fallback for ctrl + letter with blank input.
    if (input === "") return true;
  }

  return false;
}
