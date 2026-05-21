import { describe, expect, it } from "vitest";
import {
  CATEGORY_ORDER,
  clampIndex,
  filterIssues,
  flattenGroups,
  groupIssuesByCategory,
} from "../../src/tui/screens/doctor-helpers.js";
import type {
  DoctorCategory,
  DoctorIssue,
  DoctorSeverity,
} from "../../src/modules/repo-doctor/index.js";

function makeIssue(overrides: Partial<DoctorIssue> = {}): DoctorIssue {
  return {
    id: "test-rule",
    title: "Test issue",
    message: "details",
    category: "project",
    severity: "low",
    ...overrides,
  };
}

describe("groupIssuesByCategory", () => {
  it("returns empty array for no issues", () => {
    expect(groupIssuesByCategory([])).toEqual([]);
  });

  it("groups issues by category", () => {
    const issues: DoctorIssue[] = [
      makeIssue({ id: "a", category: "security", severity: "high" }),
      makeIssue({ id: "b", category: "deployment", severity: "medium" }),
      makeIssue({ id: "c", category: "security", severity: "low" }),
    ];
    const groups = groupIssuesByCategory(issues);
    expect(groups.map((g) => g.category)).toEqual(["security", "deployment"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["a", "c"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["b"]);
  });

  it("follows the canonical category order", () => {
    const issues: DoctorIssue[] = (
      ["project", "env", "react", "security", "deployment", "express"] as DoctorCategory[]
    ).map((c, i) => makeIssue({ id: `${i}`, category: c }));

    const groups = groupIssuesByCategory(issues);
    expect(groups.map((g) => g.category)).toEqual(CATEGORY_ORDER);
  });

  it("sorts issues within a group by severity (high → low)", () => {
    const severities: DoctorSeverity[] = ["low", "high", "medium"];
    const issues = severities.map((s, i) =>
      makeIssue({ id: `${i}`, category: "security", severity: s }),
    );
    const [group] = groupIssuesByCategory(issues);
    expect(group.items.map((i) => i.severity)).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });

  it("appends unknown categories at the end", () => {
    const issues: DoctorIssue[] = [
      makeIssue({ id: "a", category: "security" }),
      makeIssue({
        id: "b",
        category: "future-category" as DoctorCategory,
      }),
    ];
    const groups = groupIssuesByCategory(issues);
    expect(groups[0].category).toBe("security");
    expect(groups[groups.length - 1].items.map((i) => i.id)).toEqual(["b"]);
  });
});

describe("filterIssues", () => {
  const issues: DoctorIssue[] = [
    makeIssue({
      id: "missing-env-example",
      title: "Missing .env.example",
      message: "Document required environment variables.",
      category: "env",
      severity: "medium",
    }),
    makeIssue({
      id: "vercel-spa-rewrite",
      title: "Vercel SPA rewrite missing",
      message: "Refresh returns 404 on client routes.",
      category: "deployment",
      severity: "high",
    }),
    makeIssue({
      id: "express-cors-wildcard",
      title: "CORS allows all origins",
      message: "Restrict origins via allowlist.",
      category: "security",
      severity: "high",
    }),
  ];

  it("returns all issues when query is empty", () => {
    expect(filterIssues(issues, "")).toEqual(issues);
    expect(filterIssues(issues, "   ")).toEqual(issues);
  });

  it("matches by id", () => {
    expect(filterIssues(issues, "vercel").map((i) => i.id)).toEqual([
      "vercel-spa-rewrite",
    ]);
  });

  it("matches by title (case-insensitive)", () => {
    expect(filterIssues(issues, "cors").map((i) => i.id)).toEqual([
      "express-cors-wildcard",
    ]);
  });

  it("matches by category", () => {
    expect(filterIssues(issues, "security").map((i) => i.id)).toEqual([
      "express-cors-wildcard",
    ]);
  });

  it("matches by severity", () => {
    expect(filterIssues(issues, "high").map((i) => i.id)).toEqual([
      "vercel-spa-rewrite",
      "express-cors-wildcard",
    ]);
  });

  it("matches by message", () => {
    expect(filterIssues(issues, "allowlist").map((i) => i.id)).toEqual([
      "express-cors-wildcard",
    ]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterIssues(issues, "no-match")).toEqual([]);
  });
});

describe("flattenGroups", () => {
  it("preserves order across groups", () => {
    const issues = [
      makeIssue({ id: "s1", category: "security" }),
      makeIssue({ id: "d1", category: "deployment" }),
      makeIssue({ id: "s2", category: "security" }),
    ];
    const groups = groupIssuesByCategory(issues);
    expect(flattenGroups(groups).map((i) => i.id)).toEqual([
      "s1",
      "s2",
      "d1",
    ]);
  });
});

describe("clampIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(5, 0)).toBe(0);
    expect(clampIndex(-2, 0)).toBe(0);
  });

  it("clamps negative indices to 0", () => {
    expect(clampIndex(-1, 5)).toBe(0);
  });

  it("clamps over-large indices to the last valid index", () => {
    expect(clampIndex(10, 5)).toBe(4);
  });

  it("passes through valid indices unchanged", () => {
    expect(clampIndex(2, 5)).toBe(2);
  });
});
