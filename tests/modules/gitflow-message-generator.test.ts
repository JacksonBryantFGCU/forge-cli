import { describe, expect, it } from "vitest";
import { buildHeuristicMessage } from "../../src/modules/gitflow/message-generator.js";
import type { StagedChange } from "../../src/modules/gitflow/types.js";

function change(
  path: string,
  status: StagedChange["status"] = "modified",
): StagedChange {
  return { path, status };
}

describe("buildHeuristicMessage", () => {
  it("returns a fallback for an empty list", () => {
    expect(buildHeuristicMessage([])).toBe("Update repository");
  });

  it("uses 'Update' as the default verb", () => {
    expect(buildHeuristicMessage([change("src/a.ts")])).toMatch(/^Update /);
  });

  it("uses 'Add' when every change is an addition", () => {
    expect(
      buildHeuristicMessage([
        change("src/a.ts", "added"),
        change("src/b.ts", "added"),
      ]),
    ).toMatch(/^Add /);
  });

  it("uses 'Remove' when every change is a deletion", () => {
    expect(
      buildHeuristicMessage([
        change("src/a.ts", "deleted"),
        change("src/b.ts", "deleted"),
      ]),
    ).toMatch(/^Remove /);
  });

  it("includes a single file's short path verbatim", () => {
    const msg = buildHeuristicMessage([change("src/modules/foo.ts")]);
    expect(msg).toContain("modules/foo.ts");
  });

  it("collapses multiple files in one top-level dir into a group", () => {
    const msg = buildHeuristicMessage([
      change("src/a.ts"),
      change("src/b.ts"),
      change("src/c.ts"),
    ]);
    expect(msg).toBe("Update src (3 files)");
  });

  it("lists multiple top-level dirs with an overflow tail", () => {
    const msg = buildHeuristicMessage([
      change("src/a.ts"),
      change("tests/a.test.ts"),
      change("docs/a.md"),
      change("scripts/build.mjs"),
    ]);
    expect(msg).toMatch(/^Update /);
    expect(msg).toContain("(4 files)");
    expect(msg).toContain("more");
  });

  it("clamps a very long message to 72 characters", () => {
    const longPaths = Array.from({ length: 40 }, (_, i) =>
      change(`dir${i}/file.ts`),
    );
    const msg = buildHeuristicMessage(longPaths);
    expect(msg.length).toBeLessThanOrEqual(72);
  });
});
