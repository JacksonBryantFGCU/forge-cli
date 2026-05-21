import type { ForgeConfig } from "../../core/config.js";

export const CONFIG_KEYS = [
  "preferredPackageManager",
  "defaultPromptMode",
  "componentStyle",
  "testFramework",
] as const;

export type ConfigKey = (typeof CONFIG_KEYS)[number];

export type ConfigEntry = {
  key: ConfigKey;
  value: ForgeConfig[ConfigKey];
};
