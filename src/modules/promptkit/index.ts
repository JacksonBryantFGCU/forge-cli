import { readForgeConfig } from "../../core/config.js";
import { detectProjectContext } from "../../core/project-detector.js";
import type { ProjectContext } from "../../core/project-detector.js";
import { renderTextTemplate } from "../../core/template-loader.js";
import {
  PROMPT_TYPES,
  type GeneratePromptOptions,
  type PromptMode,
  type PromptType,
} from "./types.js";

const TEMPLATE_FILES: Record<PromptType, string> = {
  feature: "feature.md.eta",
  debug: "debug.md.eta",
  refactor: "refactor.md.eta",
  audit: "audit.md.eta",
  test: "test.md.eta",
  cleanup: "cleanup.md.eta",
  deploy: "deploy.md.eta",
  review: "review.md.eta",
};

export async function generatePrompt(
  options: GeneratePromptOptions,
): Promise<string> {
  const type = normalizeType(options.type);
  const mode = await resolveMode(options.mode);
  const context = await detectProjectContext(options.cwd);

  const data = {
    task: options.task,
    mode,
    framework: context.framework,
    language: context.language,
    packageManager: context.packageManager,
    hasTailwind: context.hasTailwind,
    hasReactRouter: context.hasReactRouter,
    scripts: formatScripts(context),
    constraints: [] as string[],
    modeInstructions: renderModeInstruction(mode),
  };

  const rendered = await renderTextTemplate(
    ["prompts", TEMPLATE_FILES[type]],
    data,
  );

  return rendered.trimEnd() + "\n";
}

function formatScripts(context: ProjectContext): string {
  const keys = Object.keys(context.scripts);
  return keys.length > 0 ? keys.join(", ") : "none";
}

function renderModeInstruction(mode: PromptMode): string {
  switch (mode) {
    case "plan":
      return "Inspect the relevant files and produce a clear implementation plan. Do not edit code yet — wait for approval before applying changes.";
    case "implement":
      return "Inspect the relevant files, implement the change, update or add tests where appropriate, and finish with a summary of what changed and why.";
    case "review":
      return "Read the relevant code and report findings with suggested changes. Do not edit files unless explicitly instructed to apply the suggestions.";
  }
}

function isPromptMode(value: string): value is PromptMode {
  return value === "implement" || value === "review" || value === "plan";
}

export async function resolvePromptMode(
  mode: string | undefined,
): Promise<PromptMode> {
  return resolveMode(mode);
}

async function resolveMode(mode: string | undefined): Promise<PromptMode> {
  if (mode && isPromptMode(mode)) {
    return mode;
  }

  if (mode && mode.length > 0) {
    // Caller passed something explicit but invalid — surface it.
    throw new Error(
      `Unknown prompt mode: ${mode}. Supported: plan, implement, review`,
    );
  }

  const config = await readForgeConfig();
  return config.defaultPromptMode;
}

function normalizeType(type: string): PromptType {
  const match = PROMPT_TYPES.find((t) => t === type);

  if (!match) {
    throw new Error(
      `Unknown prompt type: ${type}. Supported: ${PROMPT_TYPES.join(", ")}`,
    );
  }

  return match;
}

export type {
  GeneratePromptOptions,
  PromptHistoryEntry,
  PromptMode,
  PromptType,
} from "./types.js";
export { PROMPT_TYPES } from "./types.js";
export {
  appendToHistory,
  clearHistory,
  findById,
  generateId,
  loadHistory,
} from "./history.js";
