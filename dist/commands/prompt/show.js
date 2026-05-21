// src/commands/prompt/show.ts
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
function findById(history, id) {
  return history.find((e) => e.id === id);
}

// src/commands/prompt/show.ts
var PromptShow = class _PromptShow extends Command {
  static description = "Show the full text of a saved prompt by ID.";
  static examples = ["forge prompt show a1b2c3d4"];
  static args = {
    id: Args.string({
      description: "Prompt history entry ID (from `forge prompt history`).",
      required: true
    })
  };
  async run() {
    const { args } = await this.parse(_PromptShow);
    const history = await loadHistory();
    const entry = findById(history, args.id);
    if (!entry) {
      this.error(`No prompt found with ID "${args.id}". Run \`forge prompt history\` to list saved prompts.`);
    }
    this.log(`ID:      ${entry.id}`);
    this.log(`Time:    ${entry.timestamp}`);
    this.log(`Type:    ${entry.type}`);
    this.log(`Mode:    ${entry.mode}`);
    this.log(`Task:    ${entry.task}`);
    this.log(`Project: ${entry.projectRoot}`);
    this.log("");
    this.log(entry.prompt);
  }
};
export {
  PromptShow as default
};
//# sourceMappingURL=show.js.map