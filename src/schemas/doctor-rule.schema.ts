import { z } from "zod";

export const DoctorSeveritySchema = z.enum(["low", "medium", "high"]);

export const DoctorCategorySchema = z.enum([
  "project",
  "env",
  "deployment",
  "react",
  "express",
  "security",
]);

export const DoctorIssueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  message: z.string().default(""),
  category: DoctorCategorySchema,
  severity: DoctorSeveritySchema,
  fixed: z.boolean().optional(),
});

export type DoctorSeverity = z.infer<typeof DoctorSeveritySchema>;
export type DoctorCategory = z.infer<typeof DoctorCategorySchema>;
export type DoctorIssue = z.infer<typeof DoctorIssueSchema>;
