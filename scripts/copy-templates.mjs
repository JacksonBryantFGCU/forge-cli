import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

const src = path.join(projectRoot, "src", "templates");
const dest = path.join(projectRoot, "dist", "templates");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  if (!(await exists(src))) {
    console.log(`copy-templates: ${src} not found — nothing to copy.`);
    return;
  }

  await fs.rm(dest, { recursive: true, force: true });
  await copyDir(src, dest);
  console.log(`copy-templates: copied ${src} -> ${dest}`);
}

await main();
