export type GlyphName =
  | "bullet"
  | "check"
  | "cross"
  | "arrow"
  | "chevron"
  | "branch"
  | "folder"
  | "warn"
  | "info"
  | "forge"
  | "wrench"
  | "pkg"
  | "terminal"
  | "spinner"
  | "dot";

export const glyphs: Record<GlyphName, string> = {
  bullet: "●",
  check: "✓",
  cross: "✕",
  arrow: "→",
  chevron: "›",
  branch: "⎇",
  folder: "▾",
  warn: "▲",
  info: "ⓘ",
  forge: "◆",
  wrench: "✺",
  pkg: "◫",
  terminal: "▶",
  spinner: "◐",
  dot: "·",
};

export function glyph(name: GlyphName): string {
  return glyphs[name];
}
