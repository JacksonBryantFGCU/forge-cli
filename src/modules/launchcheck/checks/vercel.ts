import path from "node:path";
import { fileExists, readTextFile } from "../../../core/fs.js";
import type { LaunchCheck, LaunchCheckRunner } from "../types.js";

export const vercelChecks: LaunchCheckRunner = async ({ context }) => {
  if (context.framework !== "react-vite" || !context.hasReactRouter) {
    return [];
  }

  const vercelPath = path.join(context.rootDir, "vercel.json");

  if (!(await fileExists(vercelPath))) {
    return [
      {
        id: "vercel-json",
        title: "Vercel SPA rewrite exists",
        status: "fail",
        message:
          "React Router apps on Vercel need a fallback rewrite to /index.html.",
      },
    ];
  }

  const raw = await readTextFile(vercelPath);
  const hasRewrite = Boolean(raw?.includes("index.html"));

  return [
    {
      id: "vercel-spa-rewrite",
      title: "Vercel SPA rewrite exists",
      status: hasRewrite ? "pass" : "fail",
      message: hasRewrite
        ? undefined
        : "vercel.json exists, but it does not appear to rewrite to /index.html.",
    },
  ];
};
