// src/commands/prompt/clear-history.ts
import { Command } from "@oclif/core";

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
async function writeTextFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}
async function writeJsonFile(filePath, data) {
  await writeTextFile(filePath, `${JSON.stringify(data, null, 2)}
`);
}

// src/core/project-detector.ts
import path4 from "path";

// src/core/package-manager.ts
import path3 from "path";

// src/core/template-loader.ts
import fs2 from "fs/promises";
import os2 from "os";
import path5 from "path";
import { fileURLToPath } from "url";
import { Eta } from "eta";
var eta = new Eta({
  useWith: true,
  autoEscape: false,
  autoTrim: false
});
var moduleDir = path5.dirname(fileURLToPath(import.meta.url));

// src/modules/promptkit/history.ts
import crypto from "crypto";
import os3 from "os";
import path6 from "path";
function getHistoryPath() {
  return path6.join(os3.homedir(), ".forge", "prompts", "history.json");
}
async function clearHistory() {
  await ensureDir(path6.dirname(getHistoryPath()));
  await writeJsonFile(getHistoryPath(), []);
}

// src/commands/prompt/clear-history.ts
var PromptClearHistory = class extends Command {
  static description = "Clear all saved prompt history.";
  static examples = ["forge prompt clear-history"];
  async run() {
    await clearHistory();
    this.log("Prompt history cleared.");
  }
};
export {
  PromptClearHistory as default
};
//# sourceMappingURL=clear-history.js.map