import { describe, expect, it } from "vitest";
import {
  clampIndex,
  filterActions,
  groupActions,
  type PaletteAction,
} from "../../src/tui/components/palette-helpers.js";

function makeAction(overrides: Partial<PaletteAction> = {}): PaletteAction {
  return {
    id: "go-dashboard",
    group: "Navigate",
    label: "Go to Dashboard",
    hint: "overview",
    run: () => {
      /* no-op */
    },
    ...overrides,
  };
}

describe("filterActions", () => {
  const actions: PaletteAction[] = [
    makeAction({ id: "go-dashboard", label: "Go to Dashboard", group: "Navigate", hint: "overview" }),
    makeAction({ id: "go-doctor", label: "Go to Doctor", group: "Navigate", hint: "triage repo issues" }),
    makeAction({ id: "run-doctor", label: "Run Doctor", group: "Doctor", hint: "scan rules" }),
    makeAction({ id: "init-recipes", label: "Init Default Recipes", group: "Recipes", hint: "install bundled defaults" }),
    makeAction({ id: "quit", label: "Quit", group: "Global", hint: "exit forge tui" }),
  ];

  it("returns all actions when query is empty or whitespace", () => {
    expect(filterActions(actions, "")).toEqual(actions);
    expect(filterActions(actions, "   ")).toEqual(actions);
  });

  it("matches by id", () => {
    expect(filterActions(actions, "init").map((a) => a.id)).toEqual([
      "init-recipes",
    ]);
  });

  it("matches by label (case-insensitive)", () => {
    expect(filterActions(actions, "DOCTOR").map((a) => a.id)).toEqual([
      "go-doctor",
      "run-doctor",
    ]);
  });

  it("matches by group", () => {
    expect(filterActions(actions, "Recipes").map((a) => a.id)).toEqual([
      "init-recipes",
    ]);
  });

  it("matches by hint", () => {
    expect(filterActions(actions, "scan").map((a) => a.id)).toEqual([
      "run-doctor",
    ]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterActions(actions, "no-match")).toEqual([]);
  });
});

describe("groupActions", () => {
  it("groups actions by their group key, preserving insertion order", () => {
    const actions: PaletteAction[] = [
      makeAction({ id: "a", group: "Navigate" }),
      makeAction({ id: "b", group: "Doctor" }),
      makeAction({ id: "c", group: "Navigate" }),
      makeAction({ id: "d", group: "Global" }),
    ];
    const groups = groupActions(actions);
    expect(groups.map((g) => g.group)).toEqual([
      "Navigate",
      "Doctor",
      "Global",
    ]);
    expect(groups[0].items.map((a) => a.id)).toEqual(["a", "c"]);
    expect(groups[1].items.map((a) => a.id)).toEqual(["b"]);
    expect(groups[2].items.map((a) => a.id)).toEqual(["d"]);
  });

  it("returns an empty array for no actions", () => {
    expect(groupActions([])).toEqual([]);
  });
});

describe("clampIndex", () => {
  it("clamps to bounds", () => {
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(10, 3)).toBe(2);
    expect(clampIndex(1, 3)).toBe(1);
  });
});
