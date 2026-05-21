import {
  ForgeConfigSchema,
  getForgeConfigPath,
  readForgeConfig,
  writeForgeConfig,
} from "../../core/config.js";
import type { ForgeConfig } from "../../core/config.js";
import { CONFIG_KEYS, type ConfigEntry, type ConfigKey } from "./types.js";

export { CONFIG_KEYS } from "./types.js";
export type { ConfigKey, ConfigEntry } from "./types.js";

export function isConfigKey(key: string): key is ConfigKey {
  return (CONFIG_KEYS as readonly string[]).includes(key);
}

export async function getConfigPath(): Promise<string> {
  return getForgeConfigPath();
}

export async function getConfig(): Promise<ForgeConfig> {
  return readForgeConfig();
}

export async function listConfigEntries(): Promise<ConfigEntry[]> {
  const config = await readForgeConfig();
  return CONFIG_KEYS.map((key) => ({ key, value: config[key] }));
}

export async function getConfigValue<K extends ConfigKey>(
  key: K,
): Promise<ForgeConfig[K]> {
  if (!isConfigKey(key)) {
    throw new Error(
      `Unknown config key: ${key}. Supported: ${CONFIG_KEYS.join(", ")}`,
    );
  }

  const config = await readForgeConfig();
  return config[key];
}

export async function setConfigValue(
  key: string,
  value: string,
): Promise<ForgeConfig> {
  if (!isConfigKey(key)) {
    throw new Error(
      `Unknown config key: ${key}. Supported: ${CONFIG_KEYS.join(", ")}`,
    );
  }

  const config = await readForgeConfig();
  const candidate = { ...config, [key]: value };

  const parsed = ForgeConfigSchema.safeParse(candidate);

  if (!parsed.success) {
    const issue = parsed.error.issues.find((i) => i.path[0] === key);
    const message = issue
      ? `Invalid value for ${key}: ${issue.message}`
      : `Invalid value for ${key}.`;
    throw new Error(message);
  }

  await writeForgeConfig(parsed.data);
  return parsed.data;
}

export async function resetConfig(): Promise<ForgeConfig> {
  const defaults = ForgeConfigSchema.parse({});
  await writeForgeConfig(defaults);
  return defaults;
}
