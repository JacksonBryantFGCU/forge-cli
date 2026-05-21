import { z } from "zod";

export const RecipeFileOperationSchema = z.enum([
  "create",
  "overwrite",
  "append",
]);

export const RecipeFileSchema = z.object({
  path: z.string().min(1),
  operation: RecipeFileOperationSchema,
  content: z.string(),
});

export const RecipeSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-_]*$/, "id must be a lowercase slug"),
  name: z.string().min(1),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  files: z.array(RecipeFileSchema).default([]),
  notes: z.string().optional(),
});

export type RecipeFileOperation = z.infer<typeof RecipeFileOperationSchema>;
export type RecipeFile = z.infer<typeof RecipeFileSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
