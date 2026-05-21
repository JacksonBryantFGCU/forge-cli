import { z } from "zod";

export const PromptModeSchema = z.enum(["plan", "implement", "review"]);

export const PromptTypeSchema = z.enum([
  "feature",
  "debug",
  "refactor",
  "audit",
  "test",
  "cleanup",
  "deploy",
  "review",
]);

export const PromptTemplateSchema = z.object({
  type: PromptTypeSchema,
  headline: z.string().min(1),
  intent: z.string().min(1),
  steps: z.array(z.string()).default([]),
  constraints: z.array(z.string()).optional(),
});

export type PromptMode = z.infer<typeof PromptModeSchema>;
export type PromptType = z.infer<typeof PromptTypeSchema>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
