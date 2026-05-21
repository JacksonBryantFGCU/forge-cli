import fs from "node:fs/promises";
import path from "node:path";
import { directoryExists, readTextFile } from "../../../core/fs.js";
import type { DoctorRule } from "../types.js";

const SUSPICIOUS_PATTERNS = [
  "SERVICE_ROLE",
  "SECRET",
  "PRIVATE_KEY",
  "ACCESS_TOKEN",
];

const SCANNABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
]);

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".vercel",
  "coverage",
]);

async function collectSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (
      entry.isFile() &&
      SCANNABLE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

type SuspiciousMatch = {
  file: string;
  pattern: string;
};

async function scanForSuspiciousEnvUsage(
  srcDir: string,
): Promise<SuspiciousMatch[]> {
  const files = await collectSourceFiles(srcDir);
  const matches: SuspiciousMatch[] = [];

  for (const file of files) {
    const content = await readTextFile(file);

    if (!content) {
      continue;
    }

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (content.includes(pattern)) {
        matches.push({ file, pattern });
      }
    }
  }

  return matches;
}

export const frontendEnvSecretsRule: DoctorRule = {
  id: "frontend-env-secrets",
  title: "Frontend may reference secret env variables",
  category: "security",
  severity: "high",
  async check(ctx) {
    if (ctx.framework !== "react-vite") {
      return null;
    }

    const srcDir = path.join(ctx.rootDir, "src");

    if (!(await directoryExists(srcDir))) {
      return null;
    }

    const matches = await scanForSuspiciousEnvUsage(srcDir);

    if (matches.length === 0) {
      return null;
    }

    const unique = Array.from(new Set(matches.map((m) => m.pattern))).join(
      ", ",
    );

    return {
      id: "frontend-env-secrets",
      title: "Frontend may reference secret env variables",
      category: "security",
      severity: "high",
      message: `Found references to suspicious names (${unique}) in src/. Vite only exposes variables prefixed with VITE_ to the browser, and any such value is publicly readable. Keep secrets on the server.`,
    };
  },
};
