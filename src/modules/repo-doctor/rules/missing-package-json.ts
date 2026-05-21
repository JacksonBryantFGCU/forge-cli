import type { DoctorRule } from "../types.js";

export const missingPackageJsonRule: DoctorRule = {
  id: "missing-package-json",
  title: "Missing package.json",
  category: "project",
  severity: "high",
  async check(ctx) {
    if (ctx.packageJson) {
      return null;
    }

    return {
      id: "missing-package-json",
      title: "Missing package.json",
      category: "project",
      severity: "high",
      message: "This directory does not look like a Node/TypeScript project.",
    };
  },
};
