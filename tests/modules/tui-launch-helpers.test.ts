import { describe, expect, it } from "vitest";
import {
  buildCheckRows,
  categorizeCheck,
  clampIndex,
  countChanges,
  groupChecks,
  groupKeyFor,
  sortReportsNewestFirst,
} from "../../src/tui/screens/launch-helpers.js";
import type { SavedReport } from "../../src/modules/launchcheck/index.js";

function makeReport(overrides: Partial<SavedReport> = {}): SavedReport {
  return {
    project: "demo",
    cwd: "/tmp/demo",
    timestamp: "2026-05-21T10:00:00.000Z",
    projectRoot: "/tmp/demo",
    strict: false,
    status: "pass",
    score: 80,
    checks: [],
    ...overrides,
  };
}

describe("categorizeCheck", () => {
  it("returns 'new' when missing in prev but present in cur", () => {
    expect(categorizeCheck(undefined, "pass")).toBe("new");
    expect(categorizeCheck(undefined, "warn")).toBe("new");
    expect(categorizeCheck(undefined, "fail")).toBe("new");
  });

  it("returns 'removed' when present in prev but missing in cur", () => {
    expect(categorizeCheck("pass", undefined)).toBe("removed");
  });

  it("returns 'unchanged' for identical statuses", () => {
    expect(categorizeCheck("pass", "pass")).toBe("unchanged");
    expect(categorizeCheck("warn", "warn")).toBe("unchanged");
    expect(categorizeCheck("fail", "fail")).toBe("unchanged");
  });

  it("returns 'fixed' when current status is better", () => {
    expect(categorizeCheck("fail", "pass")).toBe("fixed");
    expect(categorizeCheck("fail", "warn")).toBe("fixed");
    expect(categorizeCheck("warn", "pass")).toBe("fixed");
  });

  it("returns 'regressed' when current status is worse", () => {
    expect(categorizeCheck("pass", "warn")).toBe("regressed");
    expect(categorizeCheck("pass", "fail")).toBe("regressed");
    expect(categorizeCheck("warn", "fail")).toBe("regressed");
  });

  it("returns 'unchanged' when both are undefined", () => {
    expect(categorizeCheck(undefined, undefined)).toBe("unchanged");
  });
});

describe("groupKeyFor", () => {
  it("uses the first dash-separated segment of the id", () => {
    expect(groupKeyFor("live-reachable")).toBe("live");
    expect(groupKeyFor("vercel-rewrites")).toBe("vercel");
    expect(groupKeyFor("package-script-exists")).toBe("package");
  });

  it("returns 'other' when the id starts with a dash", () => {
    expect(groupKeyFor("-broken")).toBe("other");
  });

  it("returns the whole id when there is no dash", () => {
    expect(groupKeyFor("metadata")).toBe("metadata");
  });
});

describe("buildCheckRows", () => {
  it("returns empty rows for null reports", () => {
    expect(buildCheckRows(null, null)).toEqual([]);
  });

  it("includes new checks present only in 'to'", () => {
    const to = makeReport({
      checks: [{ id: "live-reachable", title: "Reachable", status: "pass" }],
    });
    const rows = buildCheckRows(null, to);
    expect(rows).toHaveLength(1);
    expect(rows[0].change).toBe("new");
    expect(rows[0].curStatus).toBe("pass");
    expect(rows[0].prevStatus).toBeNull();
    expect(rows[0].group).toBe("live");
  });

  it("includes removed checks present only in 'from'", () => {
    const from = makeReport({
      checks: [{ id: "vercel-rewrites", title: "SPA rewrite", status: "warn" }],
    });
    const rows = buildCheckRows(from, makeReport({ checks: [] }));
    expect(rows).toHaveLength(1);
    expect(rows[0].change).toBe("removed");
    expect(rows[0].prevStatus).toBe("warn");
    expect(rows[0].curStatus).toBeNull();
  });

  it("categorizes changes across the same check id", () => {
    const from = makeReport({
      checks: [
        { id: "a", title: "A", status: "fail" },
        { id: "b", title: "B", status: "pass" },
        { id: "c", title: "C", status: "warn" },
      ],
    });
    const to = makeReport({
      checks: [
        { id: "a", title: "A", status: "pass" },
        { id: "b", title: "B", status: "fail" },
        { id: "c", title: "C", status: "warn" },
      ],
    });
    const rows = buildCheckRows(from, to);
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get("a")?.change).toBe("fixed");
    expect(byId.get("b")?.change).toBe("regressed");
    expect(byId.get("c")?.change).toBe("unchanged");
  });
});

describe("groupChecks", () => {
  it("groups rows by their group key and sorts within group by change priority", () => {
    const from = makeReport({
      checks: [
        { id: "live-x", title: "x", status: "fail" },
        { id: "live-y", title: "y", status: "pass" },
        { id: "vercel-z", title: "z", status: "pass" },
      ],
    });
    const to = makeReport({
      checks: [
        { id: "live-x", title: "x", status: "pass" },
        { id: "live-y", title: "y", status: "fail" },
        { id: "vercel-z", title: "z", status: "pass" },
      ],
    });
    const rows = buildCheckRows(from, to);
    const groups = groupChecks(rows);
    const liveGroup = groups.find((g) => g.group === "live");
    expect(liveGroup).toBeDefined();
    // regressed first, then fixed
    expect(liveGroup?.items.map((r) => r.change)).toEqual([
      "regressed",
      "fixed",
    ]);

    const vercelGroup = groups.find((g) => g.group === "vercel");
    expect(vercelGroup?.items.map((r) => r.change)).toEqual(["unchanged"]);
  });

  it("sorts groups alphabetically", () => {
    const to = makeReport({
      checks: [
        { id: "z-1", title: "z", status: "pass" },
        { id: "a-1", title: "a", status: "pass" },
        { id: "m-1", title: "m", status: "pass" },
      ],
    });
    const rows = buildCheckRows(null, to);
    const groups = groupChecks(rows);
    expect(groups.map((g) => g.group)).toEqual(["a", "m", "z"]);
  });
});

describe("countChanges", () => {
  it("counts each change kind", () => {
    const from = makeReport({
      checks: [
        { id: "a", title: "a", status: "fail" },
        { id: "b", title: "b", status: "pass" },
        { id: "c", title: "c", status: "warn" },
      ],
    });
    const to = makeReport({
      checks: [
        { id: "a", title: "a", status: "pass" },
        { id: "b", title: "b", status: "fail" },
        { id: "c", title: "c", status: "warn" },
        { id: "d", title: "d", status: "pass" },
      ],
    });
    const counts = countChanges(buildCheckRows(from, to));
    expect(counts.fixed).toBe(1);
    expect(counts.regressed).toBe(1);
    expect(counts.unchanged).toBe(1);
    expect(counts.new).toBe(1);
    expect(counts.removed).toBe(0);
  });
});

describe("sortReportsNewestFirst", () => {
  it("sorts by timestamp descending", () => {
    const reports = [
      makeReport({ timestamp: "2026-01-01T00:00:00.000Z" }),
      makeReport({ timestamp: "2026-03-15T00:00:00.000Z" }),
      makeReport({ timestamp: "2026-02-10T00:00:00.000Z" }),
    ];
    const sorted = sortReportsNewestFirst(reports);
    expect(sorted.map((r) => r.timestamp)).toEqual([
      "2026-03-15T00:00:00.000Z",
      "2026-02-10T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    ]);
  });

  it("does not mutate input", () => {
    const reports = [
      makeReport({ timestamp: "2026-01-01T00:00:00.000Z" }),
      makeReport({ timestamp: "2026-03-15T00:00:00.000Z" }),
    ];
    const snapshot = [...reports];
    sortReportsNewestFirst(reports);
    expect(reports).toEqual(snapshot);
  });
});

describe("clampIndex", () => {
  it("clamps to bounds", () => {
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(10, 3)).toBe(2);
    expect(clampIndex(2, 5)).toBe(2);
  });
});
