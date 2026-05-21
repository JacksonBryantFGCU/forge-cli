import type { PackageManager } from "../../../core/package-manager.js";
import { runCommand } from "../../../core/shell.js";
import type { LaunchCheck, LaunchCheckRunner } from "../types.js";

export const buildChecks: LaunchCheckRunner = async ({
  context,
  skipBuild,
}) => {
  if (!context.packageJson || !context.scripts.build) {
    return [];
  }

  if (skipBuild) {
    return [
      {
        id: "build-skipped",
        title: "Production build skipped",
        status: "warn",
        message: "Re-run without --skip-build before launching for real.",
      },
    ];
  }

  const { command, args } = getBuildCommand(context.packageManager);
  const result = await runCommand(command, args, { cwd: context.rootDir });

  const check: LaunchCheck = result.success
    ? {
        id: "build-passes",
        title: "Production build passes",
        status: "pass",
      }
    : {
        id: "build-fails",
        title: "Production build passes",
        status: "fail",
        message:
          "Build failed. Run your build command manually to inspect the full error.",
      };

  return [check];
};

function getBuildCommand(packageManager: PackageManager): {
  command: string;
  args: string[];
} {
  switch (packageManager) {
    case "pnpm":
      return { command: "pnpm", args: ["build"] };
    case "yarn":
      return { command: "yarn", args: ["build"] };
    case "bun":
      return { command: "bun", args: ["run", "build"] };
    case "npm":
    case "unknown":
      return { command: "npm", args: ["run", "build"] };
  }
}
