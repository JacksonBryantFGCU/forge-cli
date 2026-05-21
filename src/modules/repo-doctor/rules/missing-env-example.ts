import path from "node:path";
import { writeTextFile } from "../../../core/fs.js";
import type { DoctorRule } from "../types.js";

export const missingEnvExampleRule: DoctorRule = {
  id: "missing-env-example",
  title: "Missing .env.example",
  category: "env",
  severity: "medium",
  async check(ctx) {
    if (!ctx.packageJson || ctx.envFiles.includes(".env.example")) {
      return null;
    }

    return {
      id: "missing-env-example",
      title: "Missing .env.example",
      category: "env",
      severity: "medium",
      message:
        "Add .env.example so required environment variables are documented.",
    };
  },
  async fix(ctx, options) {
    if (options.dryRun) {
      return {
        fixed: false,
        preview: true,
        message: "Would create .env.example.",
      };
    }

    await writeTextFile(
      path.join(ctx.rootDir, ".env.example"),
      "# Add required environment variables here.\n",
    );

    return {
      fixed: true,
      message: "Created .env.example.",
    };
  },
};
