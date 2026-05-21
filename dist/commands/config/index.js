// src/commands/config/index.ts
import { Args, Command } from "@oclif/core";

// src/core/config.ts
import os from "os";
import path2 from "path";

// src/schemas/forge-config.schema.ts
import { z } from "zod";
var ForgeConfigSchema = z.object({
  version: z.string().default("0.1.0"),
  preferredPackageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
  defaultPromptMode: z.enum(["plan", "implement", "review"]).default("plan"),
  componentStyle: z.enum(["named-export", "default-export"]).default("named-export"),
  testFramework: z.enum(["vitest", "jest", "none"]).default("vitest")
});

// src/core/fs.ts
import fs from "fs/promises";
import path from "path";
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}
async function readTextFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
async function writeTextFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}
async function readJsonFile(filePath) {
  const raw = await readTextFile(filePath);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function writeJsonFile(filePath, data) {
  await writeTextFile(filePath, `${JSON.stringify(data, null, 2)}
`);
}

// src/core/config.ts
function getForgeHomeDir() {
  return path2.join(os.homedir(), ".forge");
}
function getForgeConfigPath() {
  return path2.join(getForgeHomeDir(), "config.json");
}
async function ensureForgeHome() {
  await ensureDir(getForgeHomeDir());
  await ensureDir(path2.join(getForgeHomeDir(), "recipes"));
  await ensureDir(path2.join(getForgeHomeDir(), "prompts"));
  await ensureDir(path2.join(getForgeHomeDir(), "templates"));
}
async function readForgeConfig() {
  await ensureForgeHome();
  const configPath = getForgeConfigPath();
  const rawConfig = await readJsonFile(configPath);
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
async function writeForgeConfig(config) {
  await ensureForgeHome();
  await writeJsonFile(getForgeConfigPath(), ForgeConfigSchema.parse(config));
}

// src/modules/config-manager/types.ts
var CONFIG_KEYS = [
  "preferredPackageManager",
  "defaultPromptMode",
  "componentStyle",
  "testFramework"
];

// src/modules/config-manager/index.ts
function isConfigKey(key) {
  return CONFIG_KEYS.includes(key);
}
async function getConfigPath() {
  return getForgeConfigPath();
}
async function listConfigEntries() {
  const config = await readForgeConfig();
  return CONFIG_KEYS.map((key) => ({ key, value: config[key] }));
}
async function getConfigValue(key) {
  if (!isConfigKey(key)) {
    throw new Error(
      `Unknown config key: ${key}. Supported: ${CONFIG_KEYS.join(", ")}`
    );
  }
  const config = await readForgeConfig();
  return config[key];
}
async function setConfigValue(key, value) {
  if (!isConfigKey(key)) {
    throw new Error(
      `Unknown config key: ${key}. Supported: ${CONFIG_KEYS.join(", ")}`
    );
  }
  const config = await readForgeConfig();
  const candidate = { ...config, [key]: value };
  const parsed = ForgeConfigSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues.find((i) => i.path[0] === key);
    const message = issue ? `Invalid value for ${key}: ${issue.message}` : `Invalid value for ${key}.`;
    throw new Error(message);
  }
  await writeForgeConfig(parsed.data);
  return parsed.data;
}
async function resetConfig() {
  const defaults = ForgeConfigSchema.parse({});
  await writeForgeConfig(defaults);
  return defaults;
}

// src/commands/config/index.ts
var ACTIONS = ["path", "list", "get", "set", "reset"];
var Config = class _Config extends Command {
  static description = "Read and edit Forge user configuration stored at ~/.forge/config.json.";
  static examples = [
    "forge config path",
    "forge config list",
    "forge config get preferredPackageManager",
    "forge config set preferredPackageManager pnpm",
    "forge config set defaultPromptMode implement",
    "forge config set componentStyle default-export",
    "forge config set testFramework jest",
    "forge config reset"
  ];
  static args = {
    action: Args.string({
      description: "Action to run.",
      required: true,
      options: [...ACTIONS]
    }),
    key: Args.string({
      description: `Config key (one of: ${CONFIG_KEYS.join(", ")}).`,
      required: false
    }),
    value: Args.string({
      description: "Value to set (only for `set`).",
      required: false
    })
  };
  async run() {
    const { args } = await this.parse(_Config);
    const action = args.action;
    if (action === "path") {
      this.log(await getConfigPath());
      return;
    }
    if (action === "list") {
      const entries = await listConfigEntries();
      for (const { key, value } of entries) {
        this.log(`${key} = ${value}`);
      }
      return;
    }
    if (action === "get") {
      const key = args.key;
      if (!key) {
        this.error("Missing config key. Example: forge config get preferredPackageManager");
      }
      if (!isConfigKey(key)) {
        this.error(
          `Unknown config key: ${key}. Supported: ${CONFIG_KEYS.join(", ")}`
        );
      }
      const value = await getConfigValue(key);
      this.log(String(value));
      return;
    }
    if (action === "set") {
      const key = args.key;
      const value = args.value;
      if (!key || value === void 0) {
        this.error("Usage: forge config set <key> <value>");
      }
      try {
        const next = await setConfigValue(key, value);
        const updated = next[key];
        this.log(`${key} = ${updated}`);
      } catch (err) {
        this.error(err instanceof Error ? err.message : String(err));
      }
      return;
    }
    if (action === "reset") {
      const defaults = await resetConfig();
      this.log("Reset to defaults:");
      for (const key of CONFIG_KEYS) {
        this.log(`${key} = ${defaults[key]}`);
      }
      return;
    }
  }
};
export {
  Config as default
};
//# sourceMappingURL=index.js.map