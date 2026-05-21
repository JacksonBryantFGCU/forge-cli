import {
  ForgeConfigSchema,
  type ForgeConfig,
} from "../../schemas/forge-config.schema.js";

export type ConfigSection =
  | "defaults"
  | "generation"
  | "templates"
  | "paths";

export type ConfigSetting = {
  key: keyof ForgeConfig;
  section: ConfigSection;
  label: string;
  description: string;
  options: readonly string[];
};

export const SECTIONS: ReadonlyArray<{
  id: ConfigSection;
  label: string;
}> = [
  { id: "defaults", label: "Defaults" },
  { id: "generation", label: "Generation" },
  { id: "templates", label: "Templates" },
  { id: "paths", label: "Paths" },
];

export const SETTINGS: readonly ConfigSetting[] = [
  {
    key: "preferredPackageManager",
    section: "defaults",
    label: "Package manager",
    description: "Preferred package manager for scaffolding commands.",
    options: ["npm", "pnpm", "yarn", "bun"] as const,
  },
  {
    key: "defaultPromptMode",
    section: "defaults",
    label: "Prompt mode",
    description:
      "Default mode for `forge prompt`. plan = inspect, implement = build, review = report.",
    options: ["plan", "implement", "review"] as const,
  },
  {
    key: "componentStyle",
    section: "generation",
    label: "Component style",
    description:
      "Export style used by `forge component` scaffolds (named vs default export).",
    options: ["named-export", "default-export"] as const,
  },
  {
    key: "testFramework",
    section: "generation",
    label: "Test framework",
    description: "Framework chosen by `forge component --with-test`.",
    options: ["vitest", "jest", "none"] as const,
  },
];

export function getSettingsForSection(
  section: ConfigSection,
): readonly ConfigSetting[] {
  return SETTINGS.filter((s) => s.section === section);
}

export function findSettingByKey(
  key: keyof ForgeConfig,
): ConfigSetting | undefined {
  return SETTINGS.find((s) => s.key === key);
}

export function getCurrentValue(
  config: ForgeConfig,
  setting: ConfigSetting,
): string {
  const value = config[setting.key];
  return typeof value === "string" ? value : String(value);
}

export type ApplyChangeResult =
  | { ok: true; config: ForgeConfig }
  | { ok: false; error: string };

export function applySettingChange(
  config: ForgeConfig,
  key: keyof ForgeConfig,
  value: string,
): ApplyChangeResult {
  const next = { ...config, [key]: value };
  const parsed = ForgeConfigSchema.safeParse(next);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }
  return { ok: true, config: parsed.data };
}

export function getDefaultConfig(): ForgeConfig {
  return ForgeConfigSchema.parse({});
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

export function findOptionIndex(
  setting: ConfigSetting,
  value: string,
): number {
  const idx = setting.options.indexOf(value);
  return idx >= 0 ? idx : 0;
}
