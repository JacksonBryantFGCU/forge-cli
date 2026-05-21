import { describe, expect, it } from "vitest";
import {
  evaluateFirstRun,
  type FirstRunSignals,
} from "../../src/tui/onboarding-helpers.js";

function makeSignals(overrides: Partial<FirstRunSignals> = {}): FirstRunSignals {
  return {
    hasPackage: true,
    hasConfig: true,
    recipeCount: 5,
    promptCount: 3,
    reportCount: 1,
    ...overrides,
  };
}

describe("evaluateFirstRun", () => {
  it("returns false when nothing is missing", () => {
    expect(evaluateFirstRun(makeSignals())).toBe(false);
  });

  it("returns false when only 1 signal is missing", () => {
    expect(evaluateFirstRun(makeSignals({ reportCount: 0 }))).toBe(false);
    expect(evaluateFirstRun(makeSignals({ hasPackage: false }))).toBe(false);
  });

  it("returns false when only 2 signals are missing", () => {
    expect(
      evaluateFirstRun(makeSignals({ reportCount: 0, promptCount: 0 })),
    ).toBe(false);
  });

  it("returns true when 3 signals are missing", () => {
    expect(
      evaluateFirstRun(
        makeSignals({ reportCount: 0, promptCount: 0, recipeCount: 0 }),
      ),
    ).toBe(true);
  });

  it("returns true when 4 signals are missing", () => {
    expect(
      evaluateFirstRun({
        hasPackage: true,
        hasConfig: false,
        recipeCount: 0,
        promptCount: 0,
        reportCount: 0,
      }),
    ).toBe(true);
  });

  it("returns true when all 5 signals are missing", () => {
    expect(
      evaluateFirstRun({
        hasPackage: false,
        hasConfig: false,
        recipeCount: 0,
        promptCount: 0,
        reportCount: 0,
      }),
    ).toBe(true);
  });

  it("treats positive counts as 'present' regardless of size", () => {
    expect(
      evaluateFirstRun(
        makeSignals({ recipeCount: 1, promptCount: 1, reportCount: 1 }),
      ),
    ).toBe(false);
  });
});
