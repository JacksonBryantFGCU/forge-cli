import {
  fixMissingBuildScript,
  fixMissingLintScript,
} from "../fixes/scripts.js";
import type { DoctorRule } from "../types.js";

const missingBuildScriptRule: DoctorRule = {
  id: "missing-build-script",
  title: "Missing build script",
  category: "project",
  severity: "medium",
  async check(ctx) {
    if (!ctx.packageJson || ctx.scripts.build) {
      return null;
    }

    return {
      id: "missing-build-script",
      title: "Missing build script",
      category: "project",
      severity: "medium",
      message:
        "Add a build script so deployment tools can build the project consistently.",
    };
  },
  fix: fixMissingBuildScript,
};

const missingLintScriptRule: DoctorRule = {
  id: "missing-lint-script",
  title: "Missing lint script",
  category: "project",
  severity: "low",
  async check(ctx) {
    if (!ctx.packageJson || ctx.scripts.lint) {
      return null;
    }

    return {
      id: "missing-lint-script",
      title: "Missing lint script",
      category: "project",
      severity: "low",
      message: "Add a lint script so code quality checks are easy to run.",
    };
  },
  fix: fixMissingLintScript,
};

export const missingScriptsRules: DoctorRule[] = [
  missingBuildScriptRule,
  missingLintScriptRule,
];
