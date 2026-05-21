import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFileIfMissing,
  directoryExists,
  ensureDir,
  fileExists,
  pathExists,
  readJsonFile,
  readTextFile,
  writeJsonFile,
  writeTextFile,
} from "../../src/core/fs.js";
import { createTmpProject } from "../helpers/tmp-project.js";

describe("core/fs", () => {
  let dir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const tmp = await createTmpProject();
    dir = tmp.dir;
    cleanup = tmp.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  it("fileExists returns false for missing path and true for created file", async () => {
    const filePath = path.join(dir, "a.txt");
    expect(await fileExists(filePath)).toBe(false);
    await fs.writeFile(filePath, "x");
    expect(await fileExists(filePath)).toBe(true);
  });

  it("directoryExists distinguishes files from directories", async () => {
    const subDir = path.join(dir, "sub");
    expect(await directoryExists(subDir)).toBe(false);
    await fs.mkdir(subDir);
    expect(await directoryExists(subDir)).toBe(true);
    expect(await fileExists(subDir)).toBe(false);
  });

  it("ensureDir creates nested directories", async () => {
    const nested = path.join(dir, "a", "b", "c");
    await ensureDir(nested);
    expect(await directoryExists(nested)).toBe(true);
  });

  it("pathExists returns true for both files and directories", async () => {
    const filePath = path.join(dir, "f.txt");
    await fs.writeFile(filePath, "x");
    expect(await pathExists(filePath)).toBe(true);
    expect(await pathExists(dir)).toBe(true);
    expect(await pathExists(path.join(dir, "missing"))).toBe(false);
  });

  it("readTextFile returns null when missing and content when present", async () => {
    expect(await readTextFile(path.join(dir, "nope.txt"))).toBeNull();
    await fs.writeFile(path.join(dir, "yes.txt"), "hi");
    expect(await readTextFile(path.join(dir, "yes.txt"))).toBe("hi");
  });

  it("writeTextFile creates the directory tree as needed", async () => {
    const target = path.join(dir, "deep", "nested", "file.txt");
    await writeTextFile(target, "hello");
    expect(await readTextFile(target)).toBe("hello");
  });

  it("readJsonFile parses JSON and returns null for invalid/missing", async () => {
    const validPath = path.join(dir, "v.json");
    await writeJsonFile(validPath, { a: 1 });
    const parsed = await readJsonFile<{ a: number }>(validPath);
    expect(parsed?.a).toBe(1);

    expect(await readJsonFile(path.join(dir, "missing.json"))).toBeNull();

    const invalidPath = path.join(dir, "bad.json");
    await fs.writeFile(invalidPath, "{not json");
    expect(await readJsonFile(invalidPath)).toBeNull();
  });

  it("createFileIfMissing creates once and skips after", async () => {
    const target = path.join(dir, "once.txt");
    expect(await createFileIfMissing(target, "v1")).toBe("created");
    expect(await createFileIfMissing(target, "v2")).toBe("skipped");
    expect(await readTextFile(target)).toBe("v1");
  });
});
