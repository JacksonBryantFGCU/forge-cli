import type { LaunchCheck, LaunchCheckRunner } from "../types.js";

export const packageChecks: LaunchCheckRunner = async ({ context }) => {
  const checks: LaunchCheck[] = [];

  checks.push({
    id: "package-json",
    title: "package.json exists",
    status: context.packageJson ? "pass" : "fail",
    message: context.packageJson
      ? undefined
      : "This does not look like a Node project.",
  });

  if (!context.packageJson) {
    return checks;
  }

  checks.push({
    id: "build-script",
    title: "Build script exists",
    status: context.scripts.build ? "pass" : "fail",
    message: context.scripts.build
      ? undefined
      : "Add a build script before deploying.",
  });

  return checks;
};
