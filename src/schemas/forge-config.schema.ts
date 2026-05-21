import { z } from "zod";

export const ForgeConfigSchema = z.object({
  version: z.string().default("0.1.0"),
  preferredPackageManager: z
    .enum(["npm", "pnpm", "yarn", "bun"])
    .default("npm"),
  defaultPromptMode: z.enum(["plan", "implement", "review"]).default("plan"),
  componentStyle: z
    .enum(["named-export", "default-export"])
    .default("named-export"),
  testFramework: z.enum(["vitest", "jest", "none"]).default("vitest"),
});

export type ForgeConfig = z.infer<typeof ForgeConfigSchema>;
