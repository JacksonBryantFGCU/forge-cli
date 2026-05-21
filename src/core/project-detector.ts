import path from "node:path";
import { directoryExists, fileExists, readJsonFile } from "./fs.js";
import {
  detectPackageManager,
  type PackageManager,
} from "./package-manager.js";

export type Framework = "react-vite" | "next" | "express" | "node" | "unknown";

export type ProjectLanguage = "typescript" | "javascript" | "unknown";

export type PackageJson = {
  name?: string;
  version?: string;
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type ProjectContext = {
  rootDir: string;
  packageJson: PackageJson | null;
  packageManager: PackageManager;
  framework: Framework;
  language: ProjectLanguage;
  hasGit: boolean;
  hasTailwind: boolean;
  hasReactRouter: boolean;
  envFiles: string[];
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

export async function detectProjectContext(
  cwd: string,
): Promise<ProjectContext> {
  const rootDir = cwd;
  const packageJsonPath = path.join(rootDir, "package.json");

  const packageJson = await readJsonFile<PackageJson>(packageJsonPath);

  const dependencies = packageJson?.dependencies ?? {};
  const devDependencies = packageJson?.devDependencies ?? {};
  const scripts = packageJson?.scripts ?? {};

  const packageManager = await detectPackageManager(rootDir);

  const envFiles = await detectEnvFiles(rootDir);

  return {
    rootDir,
    packageJson,
    packageManager,
    framework: await detectFramework(rootDir, dependencies, devDependencies),
    language: await detectLanguage(rootDir, dependencies, devDependencies),
    hasGit: await directoryExists(path.join(rootDir, ".git")),
    hasTailwind: await detectTailwind(rootDir, dependencies, devDependencies),
    hasReactRouter: hasDependency(
      dependencies,
      devDependencies,
      "react-router-dom",
    ),
    envFiles,
    scripts,
    dependencies,
    devDependencies,
  };
}

async function detectFramework(
  rootDir: string,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
): Promise<Framework> {
  if (hasDependency(dependencies, devDependencies, "next")) {
    return "next";
  }

  if (
    hasDependency(dependencies, devDependencies, "vite") &&
    hasDependency(dependencies, devDependencies, "react")
  ) {
    return "react-vite";
  }

  if (hasDependency(dependencies, devDependencies, "express")) {
    return "express";
  }

  if (await fileExists(path.join(rootDir, "package.json"))) {
    return "node";
  }

  return "unknown";
}

async function detectLanguage(
  rootDir: string,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
): Promise<ProjectLanguage> {
  if (
    (await fileExists(path.join(rootDir, "tsconfig.json"))) ||
    hasDependency(dependencies, devDependencies, "typescript")
  ) {
    return "typescript";
  }

  if (await fileExists(path.join(rootDir, "package.json"))) {
    return "javascript";
  }

  return "unknown";
}

async function detectTailwind(
  rootDir: string,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
): Promise<boolean> {
  return (
    hasDependency(dependencies, devDependencies, "tailwindcss") ||
    (await fileExists(path.join(rootDir, "tailwind.config.js"))) ||
    (await fileExists(path.join(rootDir, "tailwind.config.ts"))) ||
    (await fileExists(path.join(rootDir, "tailwind.config.cjs"))) ||
    (await fileExists(path.join(rootDir, "tailwind.config.mjs")))
  );
}

async function detectEnvFiles(rootDir: string): Promise<string[]> {
  const candidates = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.example",
  ];

  const existing: string[] = [];

  for (const candidate of candidates) {
    if (await fileExists(path.join(rootDir, candidate))) {
      existing.push(candidate);
    }
  }

  return existing;
}

function hasDependency(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  name: string,
): boolean {
  return Boolean(dependencies[name] || devDependencies[name]);
}