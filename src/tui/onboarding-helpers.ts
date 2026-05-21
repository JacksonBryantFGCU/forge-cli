import path from "node:path";
import { fileExists } from "../core/fs.js";
import { getForgeConfigPath } from "../core/config.js";
import { listRecipes } from "../modules/stackpack/recipe-store.js";
import { loadHistory } from "../modules/promptkit/history.js";
import {
  listReports,
  resolveProjectName,
} from "../modules/launchcheck/reports.js";

export type FirstRunSignals = {
  hasPackage: boolean;
  hasConfig: boolean;
  recipeCount: number;
  promptCount: number;
  reportCount: number;
};

/**
 * Pure: decide whether to show onboarding based on detected signals.
 * "First run" = at least 3 of the 5 signals indicate the user hasn't set
 * anything up yet. This avoids showing onboarding to a returning user who
 * happens to be missing a single thing (e.g. no saved launch reports).
 */
export function evaluateFirstRun(signals: FirstRunSignals): boolean {
  const indicators = [
    !signals.hasPackage,
    !signals.hasConfig,
    signals.recipeCount === 0,
    signals.promptCount === 0,
    signals.reportCount === 0,
  ];
  const missing = indicators.filter(Boolean).length;
  return missing >= 3;
}

export async function collectFirstRunSignals(
  cwd: string,
): Promise<FirstRunSignals> {
  const [hasPackage, hasConfig, recipeCount, promptCount, reportCount] =
    await Promise.all([
      fileExists(path.join(cwd, "package.json")),
      fileExists(getForgeConfigPath()),
      safeRecipeCount(),
      safePromptCount(),
      safeReportCount(cwd),
    ]);

  return { hasPackage, hasConfig, recipeCount, promptCount, reportCount };
}

async function safeRecipeCount(): Promise<number> {
  try {
    return (await listRecipes()).length;
  } catch {
    return 0;
  }
}

async function safePromptCount(): Promise<number> {
  try {
    return (await loadHistory()).length;
  } catch {
    return 0;
  }
}

async function safeReportCount(cwd: string): Promise<number> {
  try {
    const project = await resolveProjectName(cwd);
    return (await listReports(project)).length;
  } catch {
    return 0;
  }
}
