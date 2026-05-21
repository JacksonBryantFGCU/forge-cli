import { z } from "zod";

export const TemplateFileOperationSchema = z.enum(["create", "overwrite"]);

export const TemplateFileSchema = z.object({
  path: z.string().min(1),
  template: z.string().min(1),
  operation: TemplateFileOperationSchema.default("create"),
});

export const ProjectTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  files: z.array(TemplateFileSchema).default([]),
});

export const ComponentTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  files: z.array(TemplateFileSchema).default([]),
});

export type TemplateFileOperation = z.infer<typeof TemplateFileOperationSchema>;
export type TemplateFile = z.infer<typeof TemplateFileSchema>;
export type ProjectTemplate = z.infer<typeof ProjectTemplateSchema>;
export type ComponentTemplate = z.infer<typeof ComponentTemplateSchema>;
