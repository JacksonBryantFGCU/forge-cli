import os from "node:os";
import path from "node:path";
import {
  ForgeConfigSchema,
  type ForgeConfig,
} from "../schemas/forge-config.schema.js";
import { ensureDir, readJsonFile, writeJsonFile } from "./fs.js";

export { ForgeConfigSchema };
export type { ForgeConfig };

export function getForgeHomeDir(): string {
  return path.join(os.homedir(), ".forge");
}

export function getForgeConfigPath(): string {
  return path.join(getForgeHomeDir(), "config.json");
}

export async function ensureForgeHome(): Promise<void> {
  await ensureDir(getForgeHomeDir());
  await ensureDir(path.join(getForgeHomeDir(), "recipes"));
  await ensureDir(path.join(getForgeHomeDir(), "prompts"));
  await ensureDir(path.join(getForgeHomeDir(), "templates"));
}

export async function readForgeConfig(): Promise<ForgeConfig> {
  await ensureForgeHome();

  const configPath = getForgeConfigPath();
  const rawConfig = await readJsonFile<unknown>(configPath);

  if (!rawConfig) {
    const defaultConfig = ForgeConfigSchema.parse({});
    await writeForgeConfig(defaultConfig);
    return defaultConfig;
  }

  const parsed = ForgeConfigSchema.safeParse(rawConfig);

  if (!parsed.success) {
    const defaultConfig = ForgeConfigSchema.parse({});
    await writeForgeConfig(defaultConfig);
    return defaultConfig;
  }

  return parsed.data;
}

export async function writeForgeConfig(config: ForgeConfig): Promise<void> {
  await ensureForgeHome();
  await writeJsonFile(getForgeConfigPath(), ForgeConfigSchema.parse(config));
}