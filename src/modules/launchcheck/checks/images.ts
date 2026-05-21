import fs from "node:fs/promises";
import path from "node:path";
import { directoryExists } from "../../../core/fs.js";
import type { LaunchCheck, LaunchCheckRunner } from "../types.js";

const MAX_BYTES = 1_000_000;

export const imageChecks: LaunchCheckRunner = async ({ context }) => {
  const publicDir = path.join(context.rootDir, "public");

  if (!(await directoryExists(publicDir))) {
    return [];
  }

  const largeFiles = await findLargeFiles(publicDir, MAX_BYTES);

  const check: LaunchCheck =
    largeFiles.length === 0
      ? {
          id: "large-images",
          title: "No oversized public assets",
          status: "pass",
        }
      : {
          id: "large-images",
          title: "No oversized public assets",
          status: "warn",
          message: `${largeFiles.length} file(s) over 1 MB in public/. Compress before launch (${largeFiles
            .slice(0, 3)
            .map((f) => path.relative(context.rootDir, f))
            .join(", ")}${largeFiles.length > 3 ? ", ..." : ""}).`,
        };

  return [check];
};

async function findLargeFiles(
  dir: string,
  maxBytes: number,
): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await findLargeFiles(fullPath, maxBytes)));
      continue;
    }

    if (!entry.isFile()) continue;

    const stat = await fs.stat(fullPath);

    if (stat.size > maxBytes) {
      results.push(fullPath);
    }
  }

  return results;
}
