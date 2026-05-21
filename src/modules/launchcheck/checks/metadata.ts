import path from "node:path";
import { fileExists, readTextFile } from "../../../core/fs.js";
import type { LaunchCheck, LaunchCheckRunner } from "../types.js";

export const metadataChecks: LaunchCheckRunner = async ({ context }) => {
  if (context.framework !== "react-vite" && context.framework !== "next") {
    return [];
  }

  const indexPath = path.join(context.rootDir, "index.html");

  if (!(await fileExists(indexPath))) {
    return [];
  }

  const raw = await readTextFile(indexPath);

  if (!raw) {
    return [];
  }

  const checks: LaunchCheck[] = [];

  const hasTitle = /<title>[^<\s][^<]*<\/title>/i.test(raw);
  checks.push({
    id: "html-title",
    title: "index.html has a non-empty <title>",
    status: hasTitle ? "pass" : "fail",
    message: hasTitle
      ? undefined
      : "Set a real <title> in index.html before launch.",
  });

  const hasViewport = raw.includes('name="viewport"');
  checks.push({
    id: "viewport",
    title: "Viewport meta tag exists",
    status: hasViewport ? "pass" : "warn",
    message: hasViewport
      ? undefined
      : "Add a viewport tag for responsive behavior.",
  });

  const hasDescription = raw.includes('name="description"');
  checks.push({
    id: "meta-description",
    title: "Meta description exists",
    status: hasDescription ? "pass" : "warn",
    message: hasDescription
      ? undefined
      : "Add a meta description for better search previews.",
  });

  const hasOpenGraph = raw.includes("og:title") || raw.includes("og:description");
  checks.push({
    id: "open-graph",
    title: "Open Graph metadata exists",
    status: hasOpenGraph ? "pass" : "warn",
    message: hasOpenGraph
      ? undefined
      : "Add og:title and og:description before sharing the site publicly.",
  });

  return checks;
};
