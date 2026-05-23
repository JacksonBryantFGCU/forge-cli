import { describe, expect, it } from "vitest";
import {
  isPaletteShortcut,
  type InkKeyShape,
} from "../../src/tui/key-helpers.js";

const noMod: InkKeyShape = { ctrl: false, meta: false, shift: false };
const shift: InkKeyShape = { ctrl: false, meta: false, shift: true };
const ctrl: InkKeyShape = { ctrl: true, meta: false, shift: false };

describe("isPaletteShortcut", () => {
  it("returns true for the literal 'P' character", () => {
    // Ink reports Shift+P as input === "P" on most terminals, regardless
    // of whether `key.shift` is also reported.
    expect(isPaletteShortcut("P", noMod)).toBe(true);
    expect(isPaletteShortcut("P", shift)).toBe(true);
  });

  it("returns true for 'p' when shift is held", () => {
    // Defensive: a terminal that emits 'p' with key.shift=true still
    // counts as Shift+P.
    expect(isPaletteShortcut("p", shift)).toBe(true);
  });

  it("returns false for plain lowercase 'p'", () => {
    // Lowercase 'p' is reserved for screens that bind it (preview /
    // show config path).
    expect(isPaletteShortcut("p", noMod)).toBe(false);
  });

  it("returns false when ctrl or meta is held", () => {
    expect(isPaletteShortcut("P", ctrl)).toBe(false);
    expect(isPaletteShortcut("P", { ctrl: false, meta: true, shift: false })).toBe(
      false,
    );
  });

  it("returns false for unrelated characters", () => {
    expect(isPaletteShortcut("a", noMod)).toBe(false);
    expect(isPaletteShortcut("1", noMod)).toBe(false);
    expect(isPaletteShortcut("?", noMod)).toBe(false);
    expect(isPaletteShortcut(":", noMod)).toBe(false);
    expect(isPaletteShortcut("", noMod)).toBe(false);
  });

  it("returns false for Ctrl+K (replaced by Shift+P)", () => {
    expect(isPaletteShortcut("k", ctrl)).toBe(false);
    expect(isPaletteShortcut("K", ctrl)).toBe(false);
  });
});
