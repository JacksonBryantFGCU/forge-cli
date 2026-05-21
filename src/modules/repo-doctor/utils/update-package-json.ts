export type PackageJsonShape = {
  scripts?: Record<string, string>;
  [key: string]: unknown;
};

/**
 * Add a script entry without clobbering an existing one. Returns the next
 * package.json shape plus a flag indicating whether the script was newly
 * added (false means the script already existed and we preserved it).
 */
export function addScript(
  pkg: PackageJsonShape,
  name: string,
  command: string,
): { next: PackageJsonShape; added: boolean } {
  const existing = pkg.scripts ?? {};

  if (existing[name]) {
    return { next: pkg, added: false };
  }

  return {
    next: {
      ...pkg,
      scripts: { ...existing, [name]: command },
    },
    added: true,
  };
}

export function serializePackageJson(pkg: PackageJsonShape): string {
  return `${JSON.stringify(pkg, null, 2)}\n`;
}
