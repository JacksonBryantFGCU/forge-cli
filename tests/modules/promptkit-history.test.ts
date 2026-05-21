import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendToHistory,
  clearHistory,
  findById,
  generateId,
  loadHistory,
} from "../../src/modules/promptkit/history.js";
import type { PromptHistoryEntry } from "../../src/modules/promptkit/types.js";
import {
  createTmpProject,
  isolateForgeHome,
  type IsolatedHome,
  type TmpProject,
} from "../helpers/tmp-project.js";

function makeEntry(overrides: Partial<PromptHistoryEntry> = {}): PromptHistoryEntry {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: "feature",
    mode: "plan",
    task: "add contact form",
    projectRoot: "/tmp/my-project",
    prompt: "# Feature: add contact form\n\nGenerated prompt text.",
    ...overrides,
  };
}

describe("generateId", () => {
  it("returns an 8-character string", () => {
    const id = generateId();
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[0-9a-f-]+$/);
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});

describe("loadHistory / appendToHistory / clearHistory", () => {
  let tmp: TmpProject;
  let home: IsolatedHome;

  beforeEach(async () => {
    tmp = await createTmpProject("forge-prompt-history-");
    home = isolateForgeHome(tmp.dir);
  });

  afterEach(async () => {
    home.restore();
    await tmp.cleanup();
  });

  it("returns empty array when no history file exists", async () => {
    const history = await loadHistory();
    expect(history).toEqual([]);
  });

  it("appends an entry and reads it back", async () => {
    const entry = makeEntry({ task: "add auth" });
    await appendToHistory(entry);

    const history = await loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].task).toBe("add auth");
    expect(history[0].type).toBe("feature");
    expect(history[0].mode).toBe("plan");
    expect(history[0].projectRoot).toBe("/tmp/my-project");
  });

  it("preserves insertion order across multiple appends", async () => {
    await appendToHistory(makeEntry({ task: "first" }));
    await appendToHistory(makeEntry({ task: "second" }));
    await appendToHistory(makeEntry({ task: "third" }));

    const history = await loadHistory();
    expect(history).toHaveLength(3);
    expect(history.map((e) => e.task)).toEqual(["first", "second", "third"]);
  });

  it("clears all history", async () => {
    await appendToHistory(makeEntry());
    await appendToHistory(makeEntry());
    await clearHistory();

    const history = await loadHistory();
    expect(history).toHaveLength(0);
  });

  it("clears correctly even when no history file exists yet", async () => {
    await clearHistory();
    const history = await loadHistory();
    expect(history).toHaveLength(0);
  });
});

describe("findById", () => {
  it("returns the matching entry", () => {
    const target = makeEntry({ id: "abc12345", task: "target task" });
    const other = makeEntry({ id: "zzz99999", task: "other task" });
    const found = findById([other, target], "abc12345");
    expect(found?.task).toBe("target task");
  });

  it("returns undefined when no entry matches", () => {
    const entry = makeEntry({ id: "abc12345" });
    expect(findById([entry], "nope1234")).toBeUndefined();
  });

  it("returns undefined for an empty history", () => {
    expect(findById([], "abc12345")).toBeUndefined();
  });
});

describe("--no-save behavior (integration via appendToHistory)", () => {
  let tmp: TmpProject;
  let home: IsolatedHome;

  beforeEach(async () => {
    tmp = await createTmpProject("forge-prompt-nosave-");
    home = isolateForgeHome(tmp.dir);
  });

  afterEach(async () => {
    home.restore();
    await tmp.cleanup();
  });

  it("does not save when appendToHistory is not called", async () => {
    // Simulate --no-save: simply don't call appendToHistory
    const history = await loadHistory();
    expect(history).toHaveLength(0);
  });

  it("saves only when appendToHistory is explicitly called", async () => {
    const entry = makeEntry({ task: "saved prompt" });
    await appendToHistory(entry);

    const history = await loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].task).toBe("saved prompt");
  });
});
