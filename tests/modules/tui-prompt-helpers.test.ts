import { describe, expect, it } from "vitest";
import {
  clampIndex,
  cycleTypeFilter,
  filterPrompts,
  formatTimestamp,
  PROMPT_TYPE_LIST,
  sortNewestFirst,
} from "../../src/tui/screens/prompt-helpers.js";
import type { PromptHistoryEntry } from "../../src/modules/promptkit/types.js";

function makeEntry(overrides: Partial<PromptHistoryEntry> = {}): PromptHistoryEntry {
  return {
    id: "abc12345",
    timestamp: "2026-05-21T10:00:00.000Z",
    type: "feature",
    mode: "plan",
    task: "add auth",
    projectRoot: "/tmp/proj",
    prompt: "# Feature\n\nbody",
    ...overrides,
  };
}

describe("filterPrompts", () => {
  const entries: PromptHistoryEntry[] = [
    makeEntry({ id: "a", type: "feature", task: "add Supabase auth" }),
    makeEntry({ id: "b", type: "debug", task: "404 on refresh" }),
    makeEntry({
      id: "c",
      type: "refactor",
      task: "split large component",
      mode: "implement",
    }),
  ];

  it("returns all entries when no filters applied", () => {
    expect(filterPrompts(entries, "", null)).toEqual(entries);
    expect(filterPrompts(entries, "   ", null)).toEqual(entries);
  });

  it("filters by type", () => {
    expect(filterPrompts(entries, "", "feature").map((e) => e.id)).toEqual([
      "a",
    ]);
    expect(filterPrompts(entries, "", "debug").map((e) => e.id)).toEqual(["b"]);
  });

  it("filters by free-text search across task/type/mode/projectRoot", () => {
    expect(filterPrompts(entries, "supabase", null).map((e) => e.id)).toEqual([
      "a",
    ]);
    expect(filterPrompts(entries, "404", null).map((e) => e.id)).toEqual(["b"]);
    expect(filterPrompts(entries, "implement", null).map((e) => e.id)).toEqual([
      "c",
    ]);
  });

  it("combines type filter and search", () => {
    expect(
      filterPrompts(entries, "split", "refactor").map((e) => e.id),
    ).toEqual(["c"]);
    expect(filterPrompts(entries, "split", "feature")).toEqual([]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterPrompts(entries, "no-match", null)).toEqual([]);
  });
});

describe("sortNewestFirst", () => {
  it("sorts by timestamp descending", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: "2026-01-01T00:00:00.000Z" }),
      makeEntry({ id: "b", timestamp: "2026-03-15T00:00:00.000Z" }),
      makeEntry({ id: "c", timestamp: "2026-02-10T00:00:00.000Z" }),
    ];
    expect(sortNewestFirst(entries).map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: "2026-01-01T00:00:00.000Z" }),
      makeEntry({ id: "b", timestamp: "2026-03-15T00:00:00.000Z" }),
    ];
    const snapshot = [...entries];
    sortNewestFirst(entries);
    expect(entries).toEqual(snapshot);
  });
});

describe("cycleTypeFilter", () => {
  it("starts at the first type when null", () => {
    expect(cycleTypeFilter(null)).toBe(PROMPT_TYPE_LIST[0]);
  });

  it("advances through the list", () => {
    expect(cycleTypeFilter("feature")).toBe("debug");
    expect(cycleTypeFilter("debug")).toBe("refactor");
  });

  it("wraps to null after the last type", () => {
    expect(cycleTypeFilter(PROMPT_TYPE_LIST[PROMPT_TYPE_LIST.length - 1])).toBe(
      null,
    );
  });
});

describe("clampIndex", () => {
  it("clamps to bounds", () => {
    expect(clampIndex(5, 0)).toBe(0);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(10, 3)).toBe(2);
    expect(clampIndex(1, 3)).toBe(1);
  });
});

describe("formatTimestamp", () => {
  it("returns the raw input when the date is invalid", () => {
    expect(formatTimestamp("not-a-date")).toBe("not-a-date");
  });

  it("returns a compact date-time string for a valid ISO timestamp", () => {
    const out = formatTimestamp("2026-05-21T10:30:00.000Z");
    // Format is "YYYY-MM-DD HH:MM" — exact hour depends on local TZ, so just
    // verify shape.
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});
