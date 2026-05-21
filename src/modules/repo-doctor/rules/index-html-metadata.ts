import path from "node:path";
import { fileExists, readTextFile } from "../../../core/fs.js";
import {
  fixMissingMetaDescription,
  fixMissingOpenGraphTags,
  fixMissingViewportMeta,
} from "../fixes/metadata.js";
import { htmlHasOgTags } from "../utils/insert-into-html.js";
import type { DoctorRule } from "../types.js";

async function readIndexHtml(rootDir: string): Promise<string | null> {
  const indexPath = path.join(rootDir, "index.html");

  if (!(await fileExists(indexPath))) {
    return null;
  }

  return readTextFile(indexPath);
}

const missingViewportMetaRule: DoctorRule = {
  id: "missing-viewport-meta",
  title: "Missing viewport meta tag",
  category: "react",
  severity: "medium",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);

    if (!raw || raw.includes('name="viewport"')) {
      return null;
    }

    return {
      id: "missing-viewport-meta",
      title: "Missing viewport meta tag",
      category: "react",
      severity: "medium",
      message:
        "Add a viewport meta tag to index.html for proper responsive behavior.",
    };
  },
  fix: fixMissingViewportMeta,
};

const missingMetaDescriptionRule: DoctorRule = {
  id: "missing-meta-description",
  title: "Missing meta description",
  category: "react",
  severity: "low",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);

    if (!raw || raw.includes('name="description"')) {
      return null;
    }

    return {
      id: "missing-meta-description",
      title: "Missing meta description",
      category: "react",
      severity: "low",
      message: "Add a meta description to improve search and link previews.",
    };
  },
  fix: fixMissingMetaDescription,
};

const missingOpenGraphTagsRule: DoctorRule = {
  id: "missing-open-graph-tags",
  title: "Missing Open Graph metadata",
  category: "react",
  severity: "low",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);

    if (!raw || htmlHasOgTags(raw)) {
      return null;
    }

    return {
      id: "missing-open-graph-tags",
      title: "Missing Open Graph metadata",
      category: "react",
      severity: "low",
      message:
        "Add og:title and og:description meta tags before sharing the site publicly.",
    };
  },
  fix: fixMissingOpenGraphTags,
};

export const indexHtmlMetadataRules: DoctorRule[] = [
  missingViewportMetaRule,
  missingMetaDescriptionRule,
  missingOpenGraphTagsRule,
];
