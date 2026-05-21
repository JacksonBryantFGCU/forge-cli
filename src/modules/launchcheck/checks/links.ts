import fs from "node:fs/promises";
import path from "node:path";
import { directoryExists, fileExists, readTextFile } from "../../../core/fs.js";
import type { LaunchCheck, LaunchCheckRunner } from "../types.js";

const SCANNABLE_EXTENSIONS = new Set([".tsx", ".jsx", ".ts", ".js", ".html"]);
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".vercel",
  ".turbo",
  "coverage",
]);

const SUSPICIOUS_PATTERNS = [
  /href=["']\s*#\s*["']/g,
  /href=["']TODO["']/gi,
  /href=["']FIXME["']/gi,
  /to=["']TODO["']/gi,
  /to=["']FIXME["']/gi,
  /href=["']javascript:void\(0\)["']/gi,
];

type Finding = {
  file: string;
  snippet: string;
};

export const linkChecks: LaunchCheckRunner = async ({ context }) => {
  const targets: string[] = [];
  const srcDir = path.join(context.rootDir, "src");

  if (await directoryExists(srcDir)) {
    targets.push(...(await collectFiles(srcDir)));
  }

  const indexHtml = path.join(context.rootDir, "index.html");
  if (await fileExists(indexHtml)) {
    targets.push(indexHtml);
  }

  if (targets.length === 0) {
    return [];
  }

  const findings: Finding[] = [];

  for (const file of targets) {
    const content = await readTextFile(file);
    if (!content) continue;

    for (const pattern of SUSPICIOUS_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);
      if (match) {
        findings.push({ file, snippet: match[0] });
        break;
      }
    }
  }

  const check: LaunchCheck =
    findings.length === 0
      ? {
          id: "broken-links",
          title: "No obvious broken/placeholder links",
          status: "pass",
        }
      : {
          id: "broken-links",
          title: "Obvious placeholder or broken links found",
          status: "warn",
          message: `${findings.length} suspicious link(s) found, including: ${findings
            .slice(0, 3)
            .map(
              (f) =>
                `${path.relative(context.rootDir, f.file)} (${f.snippet})`,
            )
            .join("; ")}${findings.length > 3 ? "; ..." : ""}.`,
        };

  return [check];
};

async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      results.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (
      entry.isFile() &&
      SCANNABLE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    ) {
      results.push(fullPath);
    }
  }

  return results;
}
