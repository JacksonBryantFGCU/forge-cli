import { runPackCommand } from "./index.js";
import type { PackCommandResult } from "./types.js";

export async function previewRecipe(
  cwd: string,
  id: string,
): Promise<PackCommandResult> {
  return runPackCommand({
    cwd,
    action: "use",
    name: id,
    dryRun: true,
    force: false,
  });
}

export async function applyRecipe(
  cwd: string,
  id: string,
  options: { force: boolean } = { force: false },
): Promise<PackCommandResult> {
  return runPackCommand({
    cwd,
    action: "use",
    name: id,
    dryRun: false,
    force: options.force,
  });
}
