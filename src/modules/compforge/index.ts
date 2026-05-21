import path from "node:path";
import { readForgeConfig } from "../../core/config.js";
import type { ForgeConfig } from "../../core/config.js";
import { fileExists, writeTextFile } from "../../core/fs.js";
import { detectProjectContext } from "../../core/project-detector.js";
import { renderTextTemplate } from "../../core/template-loader.js";

export const COMPONENT_TYPES = [
  "component",
  "page",
  "hook",
  "form",
  "layout",
  "section",
  "modal",
  "card",
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

export type GenerateComponentOptions = {
  cwd: string;
  name: string;
  type: ComponentType;
  dryRun: boolean;
  withTest: boolean;
  withTypes: boolean;
  withMotion: boolean;
  customPath?: string;
  force: boolean;
};

export type FileAction = "create" | "overwrite" | "skip";

export type GeneratedFile = {
  path: string;
  content: string;
  action: FileAction;
};

export type GenerateComponentResult = {
  name: string;
  type: ComponentType;
  targetDir: string;
  files: GeneratedFile[];
  warnings: string[];
  componentStyle: ForgeConfig["componentStyle"];
  testFramework: ForgeConfig["testFramework"];
};

const COMPONENT_TEMPLATE_FILE: Record<ComponentType, string> = {
  component: "component.tsx.eta",
  page: "page.tsx.eta",
  hook: "hook.ts.eta",
  form: "form.tsx.eta",
  layout: "layout.tsx.eta",
  section: "section.tsx.eta",
  modal: "modal.tsx.eta",
  card: "card.tsx.eta",
};

export async function generateComponent(
  options: GenerateComponentOptions,
): Promise<GenerateComponentResult> {
  const config = await readForgeConfig();

  const name =
    options.type === "hook"
      ? toHookName(options.name)
      : toPascalCase(options.name);

  const targetDir = resolveTargetDir(options, name);
  const warnings = await collectWarnings(options, config);

  const planned = await buildPlannedFiles({
    name,
    targetDir,
    type: options.type,
    withTest: options.withTest,
    withTypes: options.withTypes,
    withMotion: options.withMotion,
    componentStyle: config.componentStyle,
    testFramework: config.testFramework,
  });

  const files: GeneratedFile[] = [];

  for (const file of planned) {
    const exists = await fileExists(file.path);
    let action: FileAction;

    if (!exists) {
      action = "create";
    } else if (options.force) {
      action = "overwrite";
    } else {
      action = "skip";
    }

    if (!options.dryRun && action !== "skip") {
      await writeTextFile(file.path, file.content);
    }

    files.push({ ...file, action });
  }

  return {
    name,
    type: options.type,
    targetDir,
    files,
    warnings,
    componentStyle: config.componentStyle,
    testFramework: config.testFramework,
  };
}

function resolveTargetDir(
  options: GenerateComponentOptions,
  name: string,
): string {
  if (options.customPath) {
    return path.isAbsolute(options.customPath)
      ? options.customPath
      : path.join(options.cwd, options.customPath);
  }

  switch (options.type) {
    case "page":
      return path.join(options.cwd, "src", "pages", name);
    case "hook":
      return path.join(options.cwd, "src", "hooks");
    case "form":
      return path.join(options.cwd, "src", "components", "forms", name);
    case "component":
    case "card":
    case "modal":
    case "section":
    case "layout":
      return path.join(options.cwd, "src", "components", name);
  }
}

async function collectWarnings(
  options: GenerateComponentOptions,
  config: ForgeConfig,
): Promise<string[]> {
  const warnings: string[] = [];

  if (options.withMotion) {
    const ctx = await detectProjectContext(options.cwd);
    const hasFramerMotion = Boolean(
      ctx.dependencies["framer-motion"] ||
        ctx.devDependencies["framer-motion"],
    );

    if (!hasFramerMotion) {
      warnings.push(
        "framer-motion is not listed in package.json. Install it with `npm install framer-motion` before running the generated component.",
      );
    }
  }

  if (options.withTest && config.testFramework === "none") {
    warnings.push(
      "testFramework is set to 'none' in forge config — skipping test file generation. Run `forge config set testFramework vitest` to re-enable.",
    );
  }

  return warnings;
}

type PlannedFile = {
  path: string;
  content: string;
};

type BuildInput = {
  name: string;
  targetDir: string;
  type: ComponentType;
  withTest: boolean;
  withTypes: boolean;
  withMotion: boolean;
  componentStyle: ForgeConfig["componentStyle"];
  testFramework: ForgeConfig["testFramework"];
};

async function buildPlannedFiles(input: BuildInput): Promise<PlannedFile[]> {
  const exportName = input.name;
  const isHook = input.type === "hook";

  // Hooks are always named exports regardless of componentStyle.
  const useDefaultExport =
    !isHook && input.componentStyle === "default-export";

  const data = {
    name: input.name,
    exportName,
    type: input.type,
    useMotion: input.withMotion && !isHook,
    hasTypes: input.withTypes && !isHook,
    componentStyle: input.componentStyle,
    testFramework: input.testFramework,
    exportPrefix: useDefaultExport
      ? "export default function"
      : "export function",
    indexExport: useDefaultExport
      ? `export { default as ${exportName} } from "./${input.name}.js";`
      : `export { ${exportName} } from "./${input.name}.js";`,
    testFrameworkImport: testFrameworkImport(input.testFramework),
    componentImport: isHook
      ? `import { ${exportName} } from "./${input.name}.js";`
      : useDefaultExport
        ? `import ${exportName} from "./${input.name}.js";`
        : `import { ${exportName} } from "./${input.name}.js";`,
  };

  const includeTest =
    input.withTest && input.testFramework !== "none";

  if (isHook) {
    const files: PlannedFile[] = [
      {
        path: path.join(input.targetDir, `${input.name}.ts`),
        content: await renderTextTemplate(
          ["components", "hook.ts.eta"],
          data,
        ),
      },
    ];

    if (includeTest) {
      files.push({
        path: path.join(input.targetDir, `${input.name}.test.ts`),
        content: await renderTextTemplate(
          ["components", "test.tsx.eta"],
          data,
        ),
      });
    }

    return files;
  }

  const files: PlannedFile[] = [];

  files.push({
    path: path.join(input.targetDir, `${input.name}.tsx`),
    content: await renderTextTemplate(
      ["components", COMPONENT_TEMPLATE_FILE[input.type]],
      data,
    ),
  });

  files.push({
    path: path.join(input.targetDir, "index.ts"),
    content: await renderTextTemplate(["components", "index.ts.eta"], data),
  });

  if (input.withTypes) {
    files.push({
      path: path.join(input.targetDir, `${input.name}.types.ts`),
      content: await renderTextTemplate(["components", "types.ts.eta"], data),
    });
  }

  if (includeTest) {
    files.push({
      path: path.join(input.targetDir, `${input.name}.test.tsx`),
      content: await renderTextTemplate(["components", "test.tsx.eta"], data),
    });
  }

  return files;
}

function testFrameworkImport(framework: ForgeConfig["testFramework"]): string {
  switch (framework) {
    case "jest":
      return `import { describe, expect, it } from "@jest/globals";`;
    case "vitest":
    case "none":
      return `import { describe, expect, it } from "vitest";`;
  }
}

function toPascalCase(value: string): string {
  return value
    .replace(/[-_\s]+(.)?/g, (_, char: string | undefined) =>
      char ? char.toUpperCase() : "",
    )
    .replace(/^(.)/, (char) => char.toUpperCase());
}

function toHookName(value: string): string {
  const pascal = toPascalCase(value);
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  return camel.startsWith("use") ? camel : `use${pascal}`;
}
