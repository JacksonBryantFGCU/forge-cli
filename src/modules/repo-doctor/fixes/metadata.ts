import path from "node:path";
import { fileExists, readTextFile, writeTextFile } from "../../../core/fs.js";
import type { ProjectContext } from "../../../core/project-detector.js";
import type { DoctorFixContext, DoctorFixResult } from "../types.js";
import {
  htmlHasMeta,
  htmlHasOgTags,
  insertIntoHead,
} from "../utils/insert-into-html.js";

const VIEWPORT_TAG =
  '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';

function describeProject(ctx: ProjectContext): string {
  return ctx.packageJson?.name ?? "this project";
}

async function applyHtmlInsertion(input: {
  ctx: ProjectContext;
  options: DoctorFixContext;
  alreadyPresent: (html: string) => boolean;
  buildTag: (ctx: ProjectContext) => string;
  successMessage: string;
}): Promise<DoctorFixResult> {
  const indexPath = path.join(input.ctx.rootDir, "index.html");

  if (!(await fileExists(indexPath))) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html not found — nothing to update.",
    };
  }

  const raw = await readTextFile(indexPath);
  if (raw === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html could not be read.",
    };
  }

  if (input.alreadyPresent(raw)) {
    return {
      fixed: false,
      skipped: true,
      message: "Tag already present — nothing to do.",
    };
  }

  const next = insertIntoHead(raw, input.buildTag(input.ctx));
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message:
        "index.html has no </head> closing tag — refusing to edit blindly.",
    };
  }

  if (input.options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would update index.html: ${input.successMessage}`,
    };
  }

  await writeTextFile(indexPath, next);
  return { fixed: true, message: input.successMessage };
}

export function fixMissingViewportMeta(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  return applyHtmlInsertion({
    ctx,
    options,
    alreadyPresent: (html) => htmlHasMeta(html, "viewport"),
    buildTag: () => VIEWPORT_TAG,
    successMessage: "Added viewport meta tag to index.html.",
  });
}

export function fixMissingMetaDescription(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  return applyHtmlInsertion({
    ctx,
    options,
    alreadyPresent: (html) => htmlHasMeta(html, "description"),
    buildTag: (c) =>
      `<meta name="description" content="${describeProject(c)}" />`,
    successMessage: "Added meta description to index.html.",
  });
}

export async function fixMissingOpenGraphTags(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  const indexPath = path.join(ctx.rootDir, "index.html");

  if (!(await fileExists(indexPath))) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html not found — nothing to update.",
    };
  }

  const raw = await readTextFile(indexPath);
  if (raw === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html could not be read.",
    };
  }

  if (htmlHasOgTags(raw)) {
    return {
      fixed: false,
      skipped: true,
      message: "Open Graph tags already present.",
    };
  }

  const name = describeProject(ctx);
  const ogTitle = `<meta property="og:title" content="${name}" />`;
  const ogDescription = `<meta property="og:description" content="${name}" />`;

  const afterTitle = insertIntoHead(raw, ogTitle);
  if (afterTitle === null) {
    return {
      fixed: false,
      skipped: true,
      message:
        "index.html has no </head> closing tag — refusing to edit blindly.",
    };
  }
  const next = insertIntoHead(afterTitle, ogDescription);
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message:
        "index.html has no </head> closing tag — refusing to edit blindly.",
    };
  }

  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message:
        "Would add og:title and og:description meta tags to index.html.",
    };
  }

  await writeTextFile(indexPath, next);
  return {
    fixed: true,
    message: "Added og:title and og:description meta tags to index.html.",
  };
}
