import path from "node:path";
import { fileExists, readTextFile, writeTextFile } from "../../../core/fs.js";
import type { ProjectContext } from "../../../core/project-detector.js";
import type { DoctorFixContext, DoctorFixResult } from "../types.js";
import {
  insertAfter,
  replaceLiteralOnce,
} from "../utils/safe-text-replace.js";

const CANDIDATES = [
  path.join("src", "index.ts"),
  path.join("src", "server.ts"),
  "index.ts",
  "server.ts",
  path.join("src", "index.js"),
  path.join("src", "server.js"),
  "index.js",
  "server.js",
];

async function findPrimaryServerFile(
  rootDir: string,
): Promise<{ filePath: string; contents: string } | null> {
  const matches: { filePath: string; contents: string }[] = [];

  for (const candidate of CANDIDATES) {
    const filePath = path.join(rootDir, candidate);
    if (!(await fileExists(filePath))) continue;

    const contents = await readTextFile(filePath);
    if (contents && /express\s*\(/.test(contents)) {
      matches.push({ filePath, contents });
    }
  }

  if (matches.length !== 1) return null;
  return matches[0];
}

function findLastImportEnd(source: string): number {
  const lines = source.split("\n");
  let lastIdx = -1;
  let charCount = 0;

  for (const line of lines) {
    const lineLength = line.length + 1;
    if (/^\s*import\b/.test(line) || /^\s*const\s+\w+\s*=\s*require\(/.test(line)) {
      lastIdx = charCount + line.length;
    }
    charCount += lineLength;
  }

  return lastIdx;
}

export async function fixExpressMissingHelmet(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  const found = await findPrimaryServerFile(ctx.rootDir);

  if (!found) {
    return {
      fixed: false,
      skipped: true,
      message:
        "Could not identify a single Express entrypoint to modify safely.",
    };
  }

  const { filePath, contents } = found;

  if (contents.includes("helmet(")) {
    return {
      fixed: false,
      skipped: true,
      message: "helmet() is already used — nothing to do.",
    };
  }

  const importEnd = findLastImportEnd(contents);
  if (importEnd === -1) {
    return {
      fixed: false,
      skipped: true,
      message:
        "Could not find a safe place to insert the helmet import — leaving the file alone.",
    };
  }

  const withImport =
    contents.slice(0, importEnd) +
    `\nimport helmet from "helmet";` +
    contents.slice(importEnd);

  // Insert app.use(helmet()) right after the first `const app = express(...)`.
  const expressDecl = /const\s+app\s*=\s*express\s*\([^)]*\)\s*;?/;
  const declMatch = withImport.match(expressDecl);
  if (!declMatch) {
    return {
      fixed: false,
      skipped: true,
      message:
        "Found `helmet` import target but no `const app = express(...)` declaration — leaving the file alone.",
    };
  }

  const next = insertAfter(withImport, declMatch[0], "\n\napp.use(helmet());");
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not insert app.use(helmet()) safely.",
    };
  }

  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would add helmet import and app.use(helmet()) to ${path.relative(ctx.rootDir, filePath)}.`,
    };
  }

  await writeTextFile(filePath, next);
  return {
    fixed: true,
    message: `Added helmet to ${path.relative(ctx.rootDir, filePath)}.`,
  };
}

export async function fixExpressMissingJsonLimit(
  ctx: ProjectContext,
  options: DoctorFixContext,
): Promise<DoctorFixResult> {
  const found = await findPrimaryServerFile(ctx.rootDir);

  if (!found) {
    return {
      fixed: false,
      skipped: true,
      message:
        "Could not identify a single Express entrypoint to modify safely.",
    };
  }

  const { filePath, contents } = found;

  if (contents.includes("express.json({ limit:")) {
    return {
      fixed: false,
      skipped: true,
      message: "express.json already has a limit configured.",
    };
  }

  // Only rewrite the literal `express.json()` call. Anything more elaborate
  // (custom options, function references) gets skipped to avoid clobbering
  // intentional configuration.
  if (!contents.includes("express.json()")) {
    return {
      fixed: false,
      skipped: true,
      message:
        "Could not find a literal `express.json()` call to upgrade — leaving the file alone.",
    };
  }

  const next = replaceLiteralOnce(
    contents,
    "express.json()",
    `express.json({ limit: "1mb" })`,
  );

  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not replace express.json() safely.",
    };
  }

  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would set express.json({ limit: "1mb" }) in ${path.relative(ctx.rootDir, filePath)}.`,
    };
  }

  await writeTextFile(filePath, next);
  return {
    fixed: true,
    message: `Set express.json({ limit: "1mb" }) in ${path.relative(ctx.rootDir, filePath)}.`,
  };
}
