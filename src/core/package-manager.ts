import path from "node:path";
import { fileExists } from "./fs.js";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";

export async function detectPackageManager(
  rootDir: string,
): Promise<PackageManager> {
  if (await fileExists(path.join(rootDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (await fileExists(path.join(rootDir, "yarn.lock"))) {
    return "yarn";
  }

  if (await fileExists(path.join(rootDir, "bun.lockb"))) {
    return "bun";
  }

  if (await fileExists(path.join(rootDir, "bun.lock"))) {
    return "bun";
  }

  if (await fileExists(path.join(rootDir, "package-lock.json"))) {
    return "npm";
  }

  return "unknown";
}

export function getInstallCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn install";
    case "bun":
      return "bun install";
    case "npm":
      return "npm install";
    default:
      return "npm install";
  }
}

export function getRunCommand(
  packageManager: PackageManager,
  script: string,
): string {
  switch (packageManager) {
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    case "bun":
      return `bun run ${script}`;
    case "npm":
      return `npm run ${script}`;
    default:
      return `npm run ${script}`;
  }
}