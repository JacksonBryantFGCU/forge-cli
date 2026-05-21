import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ProjectTemplateSchema,
  RecipeSchema,
} from "../src/schemas/index.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const templatesRoot = path.join(projectRoot, "src", "templates");

const REQUIRED_PROMPT_TEMPLATES = [
  "feature.md.eta",
  "debug.md.eta",
  "refactor.md.eta",
  "audit.md.eta",
  "test.md.eta",
  "cleanup.md.eta",
  "deploy.md.eta",
  "review.md.eta",
];

const REQUIRED_COMPONENT_TEMPLATES = [
  "component.tsx.eta",
  "page.tsx.eta",
  "hook.ts.eta",
  "form.tsx.eta",
  "layout.tsx.eta",
  "section.tsx.eta",
  "modal.tsx.eta",
  "card.tsx.eta",
  "index.ts.eta",
  "test.tsx.eta",
  "types.ts.eta",
];

const errors: string[] = [];
let checked = 0;

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(p: string): Promise<unknown> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

async function listSubdirs(dir: string): Promise<string[]> {
  if (!(await fileExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function listJsonFiles(dir: string): Promise<string[]> {
  if (!(await fileExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name);
}

async function validateProjectTemplates() {
  const projectsDir = path.join(templatesRoot, "projects");
  const ids = await listSubdirs(projectsDir);

  if (ids.length === 0) {
    errors.push(`No project templates found in ${projectsDir}.`);
    return;
  }

  for (const id of ids) {
    const manifestPath = path.join(projectsDir, id, "template.json");
    checked++;

    if (!(await fileExists(manifestPath))) {
      errors.push(`projects/${id}: missing template.json`);
      continue;
    }

    let raw: unknown;
    try {
      raw = await readJson(manifestPath);
    } catch (err) {
      errors.push(
        `projects/${id}/template.json: invalid JSON — ${(err as Error).message}`,
      );
      continue;
    }

    const parsed = ProjectTemplateSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(
        `projects/${id}/template.json: schema validation failed\n  ${parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("\n  ")}`,
      );
      continue;
    }

    if (parsed.data.id !== id) {
      errors.push(
        `projects/${id}/template.json: manifest id "${parsed.data.id}" does not match folder name "${id}"`,
      );
    }

    for (const file of parsed.data.files) {
      const etaPath = path.join(projectsDir, id, file.template);
      checked++;
      if (!(await fileExists(etaPath))) {
        errors.push(
          `projects/${id}: referenced template file missing — ${file.template}`,
        );
      }
    }
  }
}

async function validateRecipes() {
  const recipesDir = path.join(templatesRoot, "recipes");
  const files = await listJsonFiles(recipesDir);

  if (files.length === 0) {
    errors.push(`No recipes found in ${recipesDir}.`);
    return;
  }

  for (const file of files) {
    const filePath = path.join(recipesDir, file);
    checked++;

    let raw: unknown;
    try {
      raw = await readJson(filePath);
    } catch (err) {
      errors.push(`recipes/${file}: invalid JSON — ${(err as Error).message}`);
      continue;
    }

    const parsed = RecipeSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(
        `recipes/${file}: schema validation failed\n  ${parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("\n  ")}`,
      );
      continue;
    }

    const expectedFileName = `${parsed.data.id}.json`;
    if (file !== expectedFileName) {
      errors.push(
        `recipes/${file}: recipe id "${parsed.data.id}" should live in ${expectedFileName}`,
      );
    }
  }
}

async function validateRequiredFiles(
  category: string,
  required: string[],
): Promise<void> {
  const dir = path.join(templatesRoot, category);

  for (const name of required) {
    checked++;
    const target = path.join(dir, name);
    if (!(await fileExists(target))) {
      errors.push(`${category}/${name}: missing required template`);
    }
  }
}

async function main() {
  await validateProjectTemplates();
  await validateRecipes();
  await validateRequiredFiles("prompts", REQUIRED_PROMPT_TEMPLATES);
  await validateRequiredFiles("components", REQUIRED_COMPONENT_TEMPLATES);

  if (errors.length > 0) {
    console.error(`✗ Asset validation failed (${errors.length} error(s)):\n`);
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log(`✓ Asset validation passed (${checked} check(s)).`);
}

await main();
