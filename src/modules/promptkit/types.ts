export type PromptMode = "plan" | "implement" | "review";

export const PROMPT_TYPES = [
  "feature",
  "debug",
  "refactor",
  "audit",
  "test",
  "cleanup",
  "deploy",
  "review",
] as const;

export type PromptType = (typeof PROMPT_TYPES)[number];

export type GeneratePromptOptions = {
  type: string;
  task: string;
  mode?: string;
  cwd: string;
};

export type PromptHistoryEntry = {
  id: string;
  timestamp: string;
  type: PromptType;
  mode: PromptMode;
  task: string;
  projectRoot: string;
  prompt: string;
};
