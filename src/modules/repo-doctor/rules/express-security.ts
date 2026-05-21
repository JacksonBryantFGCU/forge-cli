import path from "node:path";
import { readTextFile } from "../../../core/fs.js";
import type { ProjectContext } from "../../../core/project-detector.js";
import {
  fixExpressMissingHelmet,
  fixExpressMissingJsonLimit,
} from "../fixes/express.js";
import type { DoctorRule } from "../types.js";

async function readExpressServerSources(rootDir: string): Promise<string> {
  const candidates = [
    path.join(rootDir, "src", "index.ts"),
    path.join(rootDir, "src", "server.ts"),
    path.join(rootDir, "index.ts"),
    path.join(rootDir, "server.ts"),
    path.join(rootDir, "src", "index.js"),
    path.join(rootDir, "src", "server.js"),
    path.join(rootDir, "index.js"),
    path.join(rootDir, "server.js"),
  ];

  const contents: string[] = [];

  for (const candidate of candidates) {
    const raw = await readTextFile(candidate);

    if (raw) {
      contents.push(raw);
    }
  }

  return contents.join("\n");
}

async function getServerSourceIfExpress(
  ctx: ProjectContext,
): Promise<string | null> {
  if (ctx.framework !== "express") {
    return null;
  }

  const combined = await readExpressServerSources(ctx.rootDir);

  return combined || null;
}

const expressMissingHelmetRule: DoctorRule = {
  id: "express-missing-helmet",
  title: "Express app may be missing helmet",
  category: "express",
  severity: "medium",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);

    if (!source || source.includes("helmet(")) {
      return null;
    }

    return {
      id: "express-missing-helmet",
      title: "Express app may be missing helmet",
      category: "express",
      severity: "medium",
      message: "Use helmet() to add common security headers.",
    };
  },
  fix: fixExpressMissingHelmet,
};

const expressMissingJsonLimitRule: DoctorRule = {
  id: "express-missing-json-limit",
  title: "Express JSON body limit may be missing",
  category: "express",
  severity: "medium",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);

    if (!source || source.includes("express.json({ limit:")) {
      return null;
    }

    return {
      id: "express-missing-json-limit",
      title: "Express JSON body limit may be missing",
      category: "express",
      severity: "medium",
      message:
        "Use express.json({ limit: '1mb' }) or similar to avoid accepting huge request bodies.",
    };
  },
  fix: fixExpressMissingJsonLimit,
};

const expressWildcardCorsRule: DoctorRule = {
  id: "express-wildcard-cors",
  title: "Express CORS may allow all origins",
  category: "security",
  severity: "high",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);

    if (
      !source ||
      (!source.includes('origin: "*"') && !source.includes("origin: '*'"))
    ) {
      return null;
    }

    return {
      id: "express-wildcard-cors",
      title: "Express CORS may allow all origins",
      category: "security",
      severity: "high",
      message:
        "Avoid wildcard CORS in production. Use an explicit allowed origin list.",
    };
  },
};

export const expressSecurityRules: DoctorRule[] = [
  expressMissingHelmetRule,
  expressMissingJsonLimitRule,
  expressWildcardCorsRule,
];
