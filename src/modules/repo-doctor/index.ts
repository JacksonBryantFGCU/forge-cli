import { detectProjectContext } from "../../core/project-detector.js";
import { allRules } from "./rules/index.js";
import type {
  DoctorCategory,
  DoctorIssue,
  DoctorResult,
  DoctorRule,
} from "./types.js";

export type RunDoctorOptions = {
  cwd: string;
  fix: boolean;
  dryRun?: boolean;
  category?: DoctorCategory;
  rule?: string;
};

export async function runDoctor(
  options: RunDoctorOptions,
): Promise<DoctorResult> {
  const ctx = await detectProjectContext(options.cwd);

  const selectedRules = allRules.filter((rule) =>
    matchesSelection(rule, options),
  );

  const issues: DoctorIssue[] = [];

  for (const rule of selectedRules) {
    const issue = await rule.check(ctx);

    if (!issue) {
      continue;
    }

    if (options.fix && rule.fix) {
      const fixResult = await rule.fix(ctx, {
        dryRun: Boolean(options.dryRun),
      });

      if (fixResult.fixed) {
        issue.fixed = true;
      }

      if (fixResult.preview) {
        issue.fixPreview = true;
      }

      if (fixResult.skipped) {
        issue.fixSkipped = true;
      }

      if (fixResult.message) {
        issue.message = fixResult.message;
      }
    }

    issues.push(issue);
  }

  return {
    projectRoot: ctx.rootDir,
    issues,
  };
}

function matchesSelection(
  rule: DoctorRule,
  options: RunDoctorOptions,
): boolean {
  if (options.rule && rule.id !== options.rule) {
    return false;
  }

  if (options.category && rule.category !== options.category) {
    return false;
  }

  return true;
}

export type {
  DoctorCategory,
  DoctorIssue,
  DoctorResult,
  DoctorRule,
  DoctorSeverity,
} from "./types.js";
