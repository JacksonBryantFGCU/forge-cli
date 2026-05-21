import type { ProjectContext } from "../../core/project-detector.js";

export type DoctorSeverity = "low" | "medium" | "high";

export type DoctorCategory =
  | "project"
  | "env"
  | "deployment"
  | "react"
  | "express"
  | "security";

export type DoctorIssue = {
  id: string;
  title: string;
  message: string;
  category: DoctorCategory;
  severity: DoctorSeverity;
  fixed?: boolean;
  /** True when --fix --dry-run reported the fix would apply but didn't write. */
  fixPreview?: boolean;
  /** True when --fix was passed but the fix couldn't run safely. */
  fixSkipped?: boolean;
};

export type DoctorFixResult = {
  fixed: boolean;
  message?: string;
  /** Set when a fix would apply but was held back by dry-run. */
  preview?: boolean;
  /** Set when a fix declined to run (e.g. ambiguous source files). */
  skipped?: boolean;
};

export type DoctorFixContext = {
  dryRun: boolean;
};

export type DoctorRule = {
  id: string;
  title: string;
  category: DoctorCategory;
  severity: DoctorSeverity;
  check(ctx: ProjectContext): Promise<DoctorIssue | null>;
  fix?(
    ctx: ProjectContext,
    options: DoctorFixContext,
  ): Promise<DoctorFixResult>;
};

export type DoctorResult = {
  projectRoot: string;
  issues: DoctorIssue[];
};
