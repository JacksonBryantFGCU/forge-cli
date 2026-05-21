// src/commands/prompt/history.ts
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
async function readTextFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
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
async function loadHistory() {
  const data = await readJsonFile(getHistoryPath());
  return Array.isArray(data) ? data : [];
}

// src/commands/prompt/history.ts
var PromptHistory = class extends Command {
  static description = "List previously generated prompts.";
  static examples = ["forge prompt history"];
  async run() {
    const history = await loadHistory();
    if (history.length === 0) {
      this.log("No prompt history found. Generate a prompt to start.");
      return;
    }
    this.log(`${history.length} saved prompt${history.length === 1 ? "" : "s"}:
`);
    for (const entry of history) {
      const preview = entry.task.length > 60 ? `${entry.task.slice(0, 60)}\u2026` : entry.task;
      this.log(`  ${entry.id}  ${entry.timestamp}  [${entry.type}/${entry.mode}]  ${preview}`);
    }
  }
};
export {
  PromptHistory as default
};
//# sourceMappingURL=history.js.map