import { runDoctor } from "./index.js";
import { allRules } from "./rules/index.js";
import type { DoctorIssue, DoctorResult } from "./types.js";

export function getFixableRuleIds(): Set<string> {
  return new Set(
    allRules.filter((r) => typeof r.fix === "function").map((r) => r.id),
  );
}

export function isFixableIssue(
  issue: DoctorIssue,
  fixableIds: Set<string>,
): boolean {
  return fixableIds.has(issue.id);
}

export async function previewFix(
  cwd: string,
  ruleId: string,
): Promise<DoctorIssue | null> {
  const result = await runDoctor({ cwd, fix: true, dryRun: true, rule: ruleId });
  return result.issues[0] ?? null;
}

export async function applyFix(
  cwd: string,
  ruleId: string,
): Promise<DoctorIssue | null> {
  const result = await runDoctor({ cwd, fix: true, rule: ruleId });
  return result.issues[0] ?? null;
}

export async function applyAllFixes(cwd: string): Promise<DoctorResult> {
  return runDoctor({ cwd, fix: true });
}
