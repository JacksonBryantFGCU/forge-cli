import { execa } from "execa";
import { detectProjectContext } from "../../core/project-detector.js";
import type { ProjectContext } from "../../core/project-detector.js";
import { runDoctor } from "../repo-doctor/index.js";
import type { DoctorIssue, DoctorSeverity } from "../repo-doctor/index.js";
import { runLaunchCheck } from "../launchcheck/index.js";
import type {
  LaunchCheckResult,
  LaunchCheckStatus,
} from "../launchcheck/index.js";

export type DashboardRow = {
  label: string;
  value: string;
};

export type DoctorSummary = {
  total: number;
  bySeverity: Record<DoctorSeverity, number>;
};

export type LaunchSummary = {
  score: number;
  status: LaunchCheckStatus;
  pass: number;
  warn: number;
  fail: number;
  ranBuild: boolean;
};

export type DashboardResult = {
  projectRoot: string;
  rows: DashboardRow[];
  doctor: DoctorSummary | null;
  launch: LaunchSummary | null;
};

export type GetProjectDashboardOptions = {
  cwd: string;
  withLaunch: boolean;
  withBuild: boolean;
};

export async function getProjectDashboard(
  options: GetProjectDashboardOptions,
): Promise<DashboardResult> {
  const context = await detectProjectContext(options.cwd);

  if (!context.packageJson) {
    return {
      projectRoot: context.rootDir,
      rows: [
        { label: "Project", value: "Unknown" },
        { label: "Status", value: "No package.json found" },
      ],
      doctor: null,
      launch: null,
    };
  }

  const doctor = await summarizeDoctor(context.rootDir);
  const launch = options.withLaunch
    ? await summarizeLaunch(context.rootDir, !options.withBuild)
    : null;

  const rows: DashboardRow[] = [
    { label: "Project", value: context.packageJson.name ?? "Unnamed project" },
    { label: "Framework", value: formatFramework(context.framework) },
    { label: "Language", value: formatLanguage(context.language) },
    { label: "Package manager", value: context.packageManager },
    { label: "TypeScript", value: context.language === "typescript" ? "yes" : "no" },
    { label: "Tailwind", value: context.hasTailwind ? "yes" : "no" },
    { label: "React Router", value: context.hasReactRouter ? "yes" : "no" },
    { label: "Git", value: await getGitStatus(context.rootDir) },
    {
      label: "Env files",
      value:
        context.envFiles.length > 0 ? context.envFiles.join(", ") : "none",
    },
    {
      label: "Scripts",
      value:
        Object.keys(context.scripts).length > 0
          ? Object.keys(context.scripts).join(", ")
          : "none",
    },
    { label: "Doctor", value: formatDoctorSummary(doctor) },
  ];

  if (launch) {
    rows.push({ label: "Launch", value: formatLaunchSummary(launch) });
  }

  return {
    projectRoot: context.rootDir,
    rows,
    doctor,
    launch,
  };
}

async function summarizeDoctor(cwd: string): Promise<DoctorSummary> {
  const result = await runDoctor({ cwd, fix: false });
  return summarizeDoctorIssues(result.issues);
}

function summarizeDoctorIssues(issues: DoctorIssue[]): DoctorSummary {
  const bySeverity: Record<DoctorSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const issue of issues) {
    bySeverity[issue.severity]++;
  }

  return {
    total: issues.length,
    bySeverity,
  };
}

async function summarizeLaunch(
  cwd: string,
  skipBuild: boolean,
): Promise<LaunchSummary> {
  const result = await runLaunchCheck({
    cwd,
    skipBuild,
    strict: false,
  });

  return summarizeLaunchResult(result, !skipBuild);
}

function summarizeLaunchResult(
  result: LaunchCheckResult,
  ranBuild: boolean,
): LaunchSummary {
  return {
    score: result.score,
    status: result.status,
    pass: result.checks.filter((c) => c.status === "pass").length,
    warn: result.checks.filter((c) => c.status === "warn").length,
    fail: result.checks.filter((c) => c.status === "fail").length,
    ranBuild,
  };
}

function formatDoctorSummary(summary: DoctorSummary): string {
  if (summary.total === 0) return "clean";

  const parts: string[] = [`${summary.total} issue(s)`];
  if (summary.bySeverity.high > 0) parts.push(`${summary.bySeverity.high} high`);
  if (summary.bySeverity.medium > 0)
    parts.push(`${summary.bySeverity.medium} medium`);
  if (summary.bySeverity.low > 0) parts.push(`${summary.bySeverity.low} low`);

  return parts.join(", ");
}

function formatLaunchSummary(summary: LaunchSummary): string {
  const buildNote = summary.ranBuild ? "with build" : "no build";
  return `${summary.score}/100 — ${summary.status.toUpperCase()} (${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail, ${buildNote})`;
}

function formatFramework(framework: ProjectContext["framework"]): string {
  switch (framework) {
    case "react-vite":
      return "React + Vite";
    case "next":
      return "Next.js";
    case "express":
      return "Express";
    case "node":
      return "Node";
    default:
      return "Unknown";
  }
}

function formatLanguage(language: ProjectContext["language"]): string {
  switch (language) {
    case "typescript":
      return "TypeScript";
    case "javascript":
      return "JavaScript";
    default:
      return "Unknown";
  }
}

async function getGitStatus(cwd: string): Promise<string> {
  try {
    const result = await execa("git", ["status", "--short"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const changedFiles = result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return changedFiles.length === 0
      ? "clean"
      : `${changedFiles.length} changed file(s)`;
  } catch {
    return "not a git repo";
  }
}
