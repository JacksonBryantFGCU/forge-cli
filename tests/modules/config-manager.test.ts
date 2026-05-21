import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getConfigValue,
  listConfigEntries,
  resetConfig,
  setConfigValue,
} from "../../src/modules/config-manager/index.js";
import { createTmpProject, isolateForgeHome } from "../helpers/tmp-project.js";

describe("config-manager", () => {
  let cleanup: () => Promise<void>;
  let restore: () => void;

  beforeEach(async () => {
    const tmp = await createTmpProject("forge-config-");
    cleanup = tmp.cleanup;
    restore = isolateForgeHome(tmp.dir).restore;
  });

  afterEach(async () => {
    restore();
    await cleanup();
  });

  it("listConfigEntries returns all four keys with default values", async () => {
    const entries = await listConfigEntries();
    const keys = entries.map((e) => e.key);

    expect(keys).toEqual([
      "preferredPackageManager",
      "defaultPromptMode",
      "componentStyle",
      "testFramework",
    ]);

    const byKey = Object.fromEntries(entries.map((e) => [e.key, e.value]));
    expect(byKey.preferredPackageManager).toBe("npm");
    expect(byKey.defaultPromptMode).toBe("plan");
    expect(byKey.componentStyle).toBe("named-export");
    expect(byKey.testFramework).toBe("vitest");
  });

  it("set + get round-trip persists the value", async () => {
    await setConfigValue("preferredPackageManager", "pnpm");
    expect(await getConfigValue("preferredPackageManager")).toBe("pnpm");

    await setConfigValue("defaultPromptMode", "implement");
    expect(await getConfigValue("defaultPromptMode")).toBe("implement");
  });

  it("rejects unknown keys", async () => {
    await expect(setConfigValue("nope", "x")).rejects.toThrow(
      /Unknown config key/,
    );
  });

  it("rejects invalid enum values", async () => {
    await expect(
      setConfigValue("preferredPackageManager", "notapm"),
    ).rejects.toThrow(/Invalid value for preferredPackageManager/);

    await expect(setConfigValue("defaultPromptMode", "yolo")).rejects.toThrow(
      /Invalid value for defaultPromptMode/,
    );

    await expect(
      setConfigValue("componentStyle", "anonymous"),
    ).rejects.toThrow(/Invalid value for componentStyle/);

    await expect(setConfigValue("testFramework", "mocha")).rejects.toThrow(
      /Invalid value for testFramework/,
    );
  });

  it("reset restores all defaults", async () => {
    await setConfigValue("preferredPackageManager", "yarn");
    await setConfigValue("componentStyle", "default-export");

    const defaults = await resetConfig();
    expect(defaults.preferredPackageManager).toBe("npm");
    expect(defaults.componentStyle).toBe("named-export");
  });
});
