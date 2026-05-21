import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readTextFile } from "../../src/core/fs.js";
import { detectProjectContext } from "../../src/core/project-detector.js";
import {
  fixExpressMissingHelmet,
  fixExpressMissingJsonLimit,
} from "../../src/modules/repo-doctor/fixes/express.js";
import {
  fixMissingMetaDescription,
  fixMissingOpenGraphTags,
  fixMissingViewportMeta,
} from "../../src/modules/repo-doctor/fixes/metadata.js";
import {
  fixMissingBuildScript,
  fixMissingLintScript,
} from "../../src/modules/repo-doctor/fixes/scripts.js";
import { fixVercelSpaRewrite } from "../../src/modules/repo-doctor/fixes/vercel.js";
import {
  htmlHasMeta,
  insertIntoHead,
} from "../../src/modules/repo-doctor/utils/insert-into-html.js";
import {
  addScript,
  serializePackageJson,
} from "../../src/modules/repo-doctor/utils/update-package-json.js";
import { replaceLiteralOnce } from "../../src/modules/repo-doctor/utils/safe-text-replace.js";
import {
  createTmpProject,
  writeFile,
  writePackageJson,
} from "../helpers/tmp-project.js";

describe("doctor utils", () => {
  it("insertIntoHead inserts a tag just before </head> with indentation", () => {
    const html = `<html>\n  <head>\n    <title>x</title>\n  </head>\n</html>\n`;
    const next = insertIntoHead(html, `<meta name="viewport" />`);
    expect(next).not.toBeNull();
    expect(next).toMatch(
      /<title>x<\/title>\n {4}<meta name="viewport" \/>\n {2}<\/head>/,
    );
  });

  it("insertIntoHead returns null when </head> is missing", () => {
    expect(insertIntoHead("<html><body></body></html>", "<meta />")).toBeNull();
  });

  it("htmlHasMeta matches existing meta names", () => {
    const html = `<meta name="viewport" content="..." />`;
    expect(htmlHasMeta(html, "viewport")).toBe(true);
    expect(htmlHasMeta(html, "description")).toBe(false);
  });

  it("addScript adds new entries but preserves existing ones", () => {
    const { next, added } = addScript({ scripts: {} }, "build", "vite build");
    expect(added).toBe(true);
    expect(next.scripts?.build).toBe("vite build");

    const second = addScript({ scripts: { build: "custom" } }, "build", "v");
    expect(second.added).toBe(false);
    expect(second.next.scripts?.build).toBe("custom");
  });

  it("serializePackageJson emits a trailing newline", () => {
    const output = serializePackageJson({ name: "x" });
    expect(output.endsWith("\n")).toBe(true);
    expect(JSON.parse(output)).toEqual({ name: "x" });
  });

  it("replaceLiteralOnce replaces the first match exactly", () => {
    expect(replaceLiteralOnce("a b c", "b", "B")).toBe("a B c");
    expect(replaceLiteralOnce("nope", "missing", "x")).toBeNull();
  });
});

describe("doctor fixes", () => {
  let dir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const tmp = await createTmpProject("forge-doctor-fix-");
    dir = tmp.dir;
    cleanup = tmp.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  it("fixVercelSpaRewrite creates vercel.json with a SPA rewrite", async () => {
    await writePackageJson(dir, { name: "site" });

    const ctx = await detectProjectContext(dir);
    const result = await fixVercelSpaRewrite(ctx, { dryRun: false });

    expect(result.fixed).toBe(true);
    const json = await readTextFile(path.join(dir, "vercel.json"));
    expect(json).toContain('"destination": "/index.html"');
  });

  it("fixVercelSpaRewrite previews without writing when dryRun is set", async () => {
    await writePackageJson(dir, { name: "site" });

    const ctx = await detectProjectContext(dir);
    const result = await fixVercelSpaRewrite(ctx, { dryRun: true });

    expect(result.fixed).toBe(false);
    expect(result.preview).toBe(true);
    expect(await readTextFile(path.join(dir, "vercel.json"))).toBeNull();
  });

  it("fixVercelSpaRewrite refuses to overwrite an existing vercel.json", async () => {
    await writePackageJson(dir, { name: "site" });
    await writeFile(dir, "vercel.json", "{}\n");

    const ctx = await detectProjectContext(dir);
    const result = await fixVercelSpaRewrite(ctx, { dryRun: false });

    expect(result.fixed).toBe(false);
    expect(result.skipped).toBe(true);
  });

  it("fixMissingViewportMeta inserts a viewport tag into index.html", async () => {
    await writePackageJson(dir, { name: "site" });
    await writeFile(
      dir,
      "index.html",
      `<html>\n  <head>\n    <title>x</title>\n  </head>\n  <body></body>\n</html>\n`,
    );

    const ctx = await detectProjectContext(dir);
    const result = await fixMissingViewportMeta(ctx, { dryRun: false });

    expect(result.fixed).toBe(true);
    const html = (await readTextFile(path.join(dir, "index.html"))) ?? "";
    expect(html).toContain('<meta name="viewport"');
    expect(html.indexOf("<meta name=\"viewport\"")).toBeLessThan(
      html.indexOf("</head>"),
    );
  });

  it("fixMissingMetaDescription skips when description already exists", async () => {
    await writePackageJson(dir, { name: "site" });
    await writeFile(
      dir,
      "index.html",
      `<html><head><meta name="description" content="x" /></head></html>`,
    );

    const ctx = await detectProjectContext(dir);
    const result = await fixMissingMetaDescription(ctx, { dryRun: false });

    expect(result.fixed).toBe(false);
    expect(result.skipped).toBe(true);
  });

  it("fixMissingOpenGraphTags inserts og:title and og:description", async () => {
    await writePackageJson(dir, { name: "demo" });
    await writeFile(
      dir,
      "index.html",
      `<html>\n  <head>\n    <title>x</title>\n  </head>\n  <body></body>\n</html>\n`,
    );

    const ctx = await detectProjectContext(dir);
    const result = await fixMissingOpenGraphTags(ctx, { dryRun: false });

    expect(result.fixed).toBe(true);
    const html = (await readTextFile(path.join(dir, "index.html"))) ?? "";
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
  });

  it("fixMissingBuildScript adds 'vite build' for a react-vite project", async () => {
    await writePackageJson(dir, {
      name: "site",
      dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
      devDependencies: { vite: "^5.0.0", typescript: "^5.0.0" },
    });

    const ctx = await detectProjectContext(dir);
    const result = await fixMissingBuildScript(ctx, { dryRun: false });

    expect(result.fixed).toBe(true);
    const pkg = JSON.parse(
      (await readTextFile(path.join(dir, "package.json"))) ?? "{}",
    );
    expect(pkg.scripts.build).toBe("tsc -b && vite build");
  });

  it("fixMissingBuildScript skips when framework has no default build", async () => {
    await writePackageJson(dir, { name: "lib" });

    const ctx = await detectProjectContext(dir);
    const result = await fixMissingBuildScript(ctx, { dryRun: false });

    expect(result.fixed).toBe(false);
    expect(result.skipped).toBe(true);
  });

  it("fixMissingLintScript adds 'eslint .' only when ESLint is installed", async () => {
    await writePackageJson(dir, {
      name: "x",
      devDependencies: { eslint: "^9.0.0" },
    });

    const ctx = await detectProjectContext(dir);
    const result = await fixMissingLintScript(ctx, { dryRun: false });

    expect(result.fixed).toBe(true);
    const pkg = JSON.parse(
      (await readTextFile(path.join(dir, "package.json"))) ?? "{}",
    );
    expect(pkg.scripts.lint).toBe("eslint .");
  });

  it("fixMissingLintScript skips when ESLint is not installed", async () => {
    await writePackageJson(dir, { name: "x" });

    const ctx = await detectProjectContext(dir);
    const result = await fixMissingLintScript(ctx, { dryRun: false });

    expect(result.fixed).toBe(false);
    expect(result.skipped).toBe(true);
  });

  it("fixExpressMissingHelmet inserts helmet import and use call", async () => {
    await writePackageJson(dir, {
      name: "api",
      dependencies: { express: "^4.0.0" },
    });
    await writeFile(
      dir,
      "src/index.ts",
      `import express from "express";\n\nconst app = express();\n\napp.get("/", (_req, res) => res.send("ok"));\n\napp.listen(3001);\n`,
    );

    const ctx = await detectProjectContext(dir);
    const result = await fixExpressMissingHelmet(ctx, { dryRun: false });

    expect(result.fixed).toBe(true);
    const updated =
      (await readTextFile(path.join(dir, "src/index.ts"))) ?? "";
    expect(updated).toContain(`import helmet from "helmet";`);
    expect(updated).toContain("app.use(helmet());");
    // helmet middleware should appear before the route handler.
    expect(updated.indexOf("app.use(helmet())")).toBeLessThan(
      updated.indexOf("app.get("),
    );
  });

  it("fixExpressMissingJsonLimit rewrites express.json()", async () => {
    await writePackageJson(dir, {
      name: "api",
      dependencies: { express: "^4.0.0" },
    });
    await writeFile(
      dir,
      "src/index.ts",
      `import express from "express";\n\nconst app = express();\napp.use(express.json());\n`,
    );

    const ctx = await detectProjectContext(dir);
    const result = await fixExpressMissingJsonLimit(ctx, { dryRun: false });

    expect(result.fixed).toBe(true);
    const updated =
      (await readTextFile(path.join(dir, "src/index.ts"))) ?? "";
    expect(updated).toContain(`express.json({ limit: "1mb" })`);
  });

  it("fixExpressMissingHelmet skips when multiple entrypoints could match", async () => {
    await writePackageJson(dir, {
      name: "api",
      dependencies: { express: "^4.0.0" },
    });
    await writeFile(
      dir,
      "src/index.ts",
      `import express from "express"; const app = express();`,
    );
    await writeFile(
      dir,
      "src/server.ts",
      `import express from "express"; const app = express();`,
    );

    const ctx = await detectProjectContext(dir);
    const result = await fixExpressMissingHelmet(ctx, { dryRun: false });

    expect(result.fixed).toBe(false);
    expect(result.skipped).toBe(true);
  });
});
