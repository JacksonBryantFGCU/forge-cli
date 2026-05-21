import { describe, expect, it } from "vitest";
import {
  isPaletteShortcut,
  type InkKeyShape,
} from "../../src/tui/key-helpers.js";

const noMod: InkKeyShape = { ctrl: false, meta: false, shift: false };
const ctrl: InkKeyShape = { ctrl: true, meta: false, shift: false };
const meta: InkKeyShape = { ctrl: false, meta: true, shift: false };

describe("isPaletteShortcut", () => {
  it("returns true for Ctrl+K (canonical Ink shape)", () => {
    expect(isPaletteShortcut("k", ctrl)).toBe(true);
    expect(isPaletteShortcut("K", ctrl)).toBe(true);
  });

  it("returns true for Ctrl+<blank> — Windows-terminal fallback", () => {
    // Some Windows Terminal / PowerShell setups deliver ctrl + letter with
    // `key.ctrl === true` but a blank `input`.
    expect(isPaletteShortcut("", ctrl)).toBe(true);
  });

  it("returns true for the raw VT control character", () => {
    expect(isPaletteShortcut("\v", noMod)).toBe(true);
  });

  it("returns true for ':' without modifiers (vim-style alternate)", () => {
    expect(isPaletteShortcut(":", noMod)).toBe(true);
  });

  it("returns false for ':' with ctrl held", () => {
    expect(isPaletteShortcut(":", ctrl)).toBe(false);
  });

  it("returns false for ':' with meta held", () => {
    expect(isPaletteShortcut(":", meta)).toBe(false);
  });

  it("returns false for a plain 'k' keystroke", () => {
    expect(isPaletteShortcut("k", noMod)).toBe(false);
  });

  it("returns false for unrelated characters", () => {
    expect(isPaletteShortcut("a", noMod)).toBe(false);
    expect(isPaletteShortcut("1", noMod)).toBe(false);
    expect(isPaletteShortcut("?", noMod)).toBe(false);
  });

  it("returns false for a blank input without ctrl", () => {
    expect(isPaletteShortcut("", noMod)).toBe(false);
  });

  it("returns true for Ctrl+K even if shift is also held", () => {
    expect(
      isPaletteShortcut("K", { ctrl: true, meta: false, shift: true }),
    ).toBe(true);
  });
});
