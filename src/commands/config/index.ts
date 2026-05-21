import { Args, Command } from "@oclif/core";
import {
  CONFIG_KEYS,
  getConfigPath,
  getConfigValue,
  isConfigKey,
  listConfigEntries,
  resetConfig,
  setConfigValue,
} from "../../modules/config-manager/index.js";

const ACTIONS = ["path", "list", "get", "set", "reset"] as const;

export default class Config extends Command {
  static override description =
    "Read and edit Forge user configuration stored at ~/.forge/config.json.";

  static override examples = [
    "forge config path",
    "forge config list",
    "forge config get preferredPackageManager",
    "forge config set preferredPackageManager pnpm",
    "forge config set defaultPromptMode implement",
    "forge config set componentStyle default-export",
    "forge config set testFramework jest",
    "forge config reset",
  ];

  static override args = {
    action: Args.string({
      description: "Action to run.",
      required: true,
      options: [...ACTIONS],
    }),
    key: Args.string({
      description: `Config key (one of: ${CONFIG_KEYS.join(", ")}).`,
      required: false,
    }),
    value: Args.string({
      description: "Value to set (only for `set`).",
      required: false,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Config);
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
          `Unknown config key: ${key}. Supported: ${CONFIG_KEYS.join(", ")}`,
        );
      }
      const value = await getConfigValue(key);
      this.log(String(value));
      return;
    }

    if (action === "set") {
      const key = args.key;
      const value = args.value;
      if (!key || value === undefined) {
        this.error("Usage: forge config set <key> <value>");
      }
      try {
        const next = await setConfigValue(key, value);
        const updated = next[key as keyof typeof next];
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
}
