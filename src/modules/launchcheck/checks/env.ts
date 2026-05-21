import path from "node:path";
import { readTextFile } from "../../../core/fs.js";
import type { LaunchCheck, LaunchCheckRunner } from "../types.js";

const TEST_MODE_HINTS = [
  { key: "STRIPE_SECRET_KEY", marker: "sk_test_", provider: "Stripe" },
  { key: "STRIPE_PUBLISHABLE_KEY", marker: "pk_test_", provider: "Stripe" },
  { key: "VITE_STRIPE_PUBLISHABLE_KEY", marker: "pk_test_", provider: "Stripe" },
  { key: "SQUARE_ENVIRONMENT", marker: "sandbox", provider: "Square" },
  { key: "SQUARE_ACCESS_TOKEN", marker: "EAAAEa", provider: "Square sandbox" },
];

export const envChecks: LaunchCheckRunner = async ({ context }) => {
  if (!context.packageJson) {
    return [];
  }

  const checks: LaunchCheck[] = [];

  checks.push({
    id: "env-example",
    title: ".env.example exists",
    status: context.envFiles.includes(".env.example") ? "pass" : "warn",
    message: context.envFiles.includes(".env.example")
      ? undefined
      : "Document required environment variables in .env.example.",
  });

  const testModeFindings = await detectTestModeKeys(context.rootDir);

  if (testModeFindings.length > 0) {
    const providers = Array.from(new Set(testModeFindings.map((f) => f.provider)));
    checks.push({
      id: "payment-test-mode",
      title: "Payment env variables look like test/sandbox keys",
      status: "warn",
      message: `Found ${providers.join(", ")} test/sandbox values in local env files (${testModeFindings
        .map((f) => f.key)
        .join(", ")}). Switch to live keys before launch.`,
    });
  }

  return checks;
};

type Finding = { key: string; provider: string };

async function detectTestModeKeys(rootDir: string): Promise<Finding[]> {
  const candidates = [".env", ".env.local", ".env.production"];
  const findings: Finding[] = [];

  for (const candidate of candidates) {
    const raw = await readTextFile(path.join(rootDir, candidate));

    if (!raw) continue;

    for (const hint of TEST_MODE_HINTS) {
      const line = raw
        .split("\n")
        .find((l) => l.trim().startsWith(`${hint.key}=`));

      if (line && line.includes(hint.marker)) {
        findings.push({ key: hint.key, provider: hint.provider });
      }
    }
  }

  return findings;
}
