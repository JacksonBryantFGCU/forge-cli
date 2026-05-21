import path from "node:path";
import { fileExists, writeTextFile } from "../../../core/fs.js";
import type { ProjectContext } from "../../../core/project-detector.js";
import type { DoctorFixContext, DoctorFixResult } from "../types.js";

const VERCEL_SPA_CONFIG = {
  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html",
    },
  ],
};

export async function fixVercelSpaRewrite(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  const vercelPath = path.join(ctx.rootDir, "vercel.json");

  if (await fileExists(vercelPath)) {
    return {
      fixed: false,
      skipped: true,
      message:
        "vercel.json already exists. Refusing to overwrite — edit it manually to add the SPA rewrite.",
    };
  }

  const content = `${JSON.stringify(VERCEL_SPA_CONFIG, null, 2)}\n`;

  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: "Would create vercel.json with SPA fallback rewrite.",
    };
  }

  await writeTextFile(vercelPath, content);
  return {
    fixed: true,
    message: "Created vercel.json with SPA fallback rewrite.",
  };
}
