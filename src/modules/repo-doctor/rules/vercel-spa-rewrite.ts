import path from "node:path";
import { fileExists, readTextFile } from "../../../core/fs.js";
import { fixVercelSpaRewrite } from "../fixes/vercel.js";
import type { DoctorRule } from "../types.js";

export const vercelSpaRewriteRule: DoctorRule = {
  id: "vercel-spa-rewrite",
  title: "Vercel SPA rewrite",
  category: "deployment",
  severity: "high",
  async check(ctx) {
    if (ctx.framework !== "react-vite" || !ctx.hasReactRouter) {
      return null;
    }

    const vercelPath = path.join(ctx.rootDir, "vercel.json");

    if (!(await fileExists(vercelPath))) {
      return {
        id: "vercel-spa-rewrite",
        title: "Missing vercel.json for React Router app",
        category: "deployment",
        severity: "high",
        message:
          "Create vercel.json with a fallback rewrite to /index.html to avoid 404s on refresh.",
      };
    }

    const raw = await readTextFile(vercelPath);

    if (!raw?.includes("index.html")) {
      return {
        id: "vercel-spa-rewrite",
        title: "Vercel SPA rewrite may be missing",
        category: "deployment",
        severity: "high",
        message:
          "vercel.json exists, but it does not appear to rewrite unmatched routes to /index.html.",
      };
    }

    return null;
  },
  fix: fixVercelSpaRewrite,
};
