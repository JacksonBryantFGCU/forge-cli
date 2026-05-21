import type { ProjectContext } from "../../core/project-detector.js";

export type LaunchCheckStatus = "pass" | "warn" | "fail";

export type LaunchCheck = {
  id: string;
  title: string;
  status: LaunchCheckStatus;
  message?: string;
};

export type LaunchCheckRunner = (
  input: LaunchCheckInput,
) => Promise<LaunchCheck[]>;

export type LaunchCheckInput = {
  context: ProjectContext;
  url?: string;
  skipBuild: boolean;
};

export type RunLaunchCheckOptions = {
  cwd: string;
  url?: string;
  skipBuild: boolean;
  strict: boolean;
  liveOnly?: boolean;
};

export type LaunchCheckResult = {
  projectRoot: string;
  score: number;
  status: LaunchCheckStatus;
  strict: boolean;
  checks: LaunchCheck[];
};

export type SavedReport = LaunchCheckResult & {
  project: string;
  cwd: string;
  timestamp: string;
  url?: string;
};

export type ReportDiff = {
  project: string;
  from: { timestamp: string; score: number };
  to: { timestamp: string; score: number };
  scoreDelta: number;
  newFailures: LaunchCheck[];
  fixedFailures: LaunchCheck[];
  newWarnings: LaunchCheck[];
  fixedWarnings: LaunchCheck[];
};
