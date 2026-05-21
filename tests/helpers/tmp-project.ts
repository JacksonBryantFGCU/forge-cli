import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type TmpProject = {
  dir: string;
  cleanup: () => Promise<void>;
};

export async function createTmpProject(
  prefix = "forge-test-",
): Promise<TmpProject> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));

  return {
    dir,
    cleanup: async () => {
      await fs.rm(dir, { recursive: true, force: true });
    },
  };
}

export async function writeFile(
  dir: string,
  relPath: string,
  content: string,
): Promise<void> {
  const fullPath = path.join(dir, relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf8");
}

type PackageJsonInput = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export async function writePackageJson(
  dir: string,
  pkg: PackageJsonInput,
): Promise<void> {
  await writeFile(dir, "package.json", JSON.stringify(pkg, null, 2));
}

export type IsolatedHome = {
  homeDir: string;
  restore: () => void;
};

export function isolateForgeHome(homeDir: string): IsolatedHome {
  const originalHome = process.env.HOME;
  const originalUserProfile = process.env.USERPROFILE;
  process.env.HOME = homeDir;
  process.env.USERPROFILE = homeDir;

  return {
    homeDir,
    restore: () => {
      process.env.HOME = originalHome;
      process.env.USERPROFILE = originalUserProfile;
    },
  };
}
