import { detectProjectContext } from "../../core/project-detector.js";
import { LIVE_CHECKS, LOCAL_CHECKS } from "./checks/index.js";
import type {
  LaunchCheck,
  LaunchCheckResult,
  LaunchCheckStatus,
  RunLaunchCheckOptions,
} from "./types.js";

export async function runLaunchCheck(
  options: RunLaunchCheckOptions,
): Promise<LaunchCheckResult> {
  const context = await detectProjectContext(options.cwd);

  if (options.liveOnly && !options.url) {
    throw new Error("--live-only requires --url <url>.");
  }

  const runners = options.liveOnly
    ? LIVE_CHECKS
    : options.url
      ? [...LOCAL_CHECKS, ...LIVE_CHECKS]
      : LOCAL_CHECKS;

  const checks: LaunchCheck[] = [];

  for (const runner of runners) {
    const result = await runner({
      context,
      url: options.url,
      skipBuild: options.skipBuild,
    });
    checks.push(...result);
  }

  return {
    projectRoot: context.rootDir,
    score: calculateScore(checks, options.strict),
    status: aggregateStatus(checks, options.strict),
    strict: options.strict,
    checks,
  };
}

function calculateScore(checks: LaunchCheck[], strict: boolean): number {
  if (checks.length === 0) return 0;

  const weights = { pass: 10, warn: strict ? 0 : 5, fail: 0 };

  const earned = checks.reduce((sum, check) => sum + weights[check.status], 0);
  const total = checks.length * 10;

  return Math.round((earned / total) * 100);
}

function aggregateStatus(
  checks: LaunchCheck[],
  strict: boolean,
): LaunchCheckStatus {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return strict ? "fail" : "warn";
  return "pass";
}

export type {
  LaunchCheck,
  LaunchCheckResult,
  LaunchCheckStatus,
  RunLaunchCheckOptions,
} from "./types.js";
