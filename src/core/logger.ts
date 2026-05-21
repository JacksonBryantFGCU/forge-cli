import chalk from "chalk";

export type LogLevel = "info" | "success" | "warn" | "error";

export function logInfo(message: string): void {
  console.log(chalk.blue("ℹ"), message);
}

export function logSuccess(message: string): void {
  console.log(chalk.green("✓"), message);
}

export function logWarn(message: string): void {
  console.log(chalk.yellow("!"), message);
}

export function logError(message: string): void {
  console.error(chalk.red("✗"), message);
}

export function formatSeverity(severity: "low" | "medium" | "high"): string {
  switch (severity) {
    case "high":
      return chalk.red(severity.toUpperCase());
    case "medium":
      return chalk.yellow(severity.toUpperCase());
    case "low":
      return chalk.gray(severity.toUpperCase());
  }
}

export function section(title: string): void {
  console.log("");
  console.log(chalk.bold(title));
}