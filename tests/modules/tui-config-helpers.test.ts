import { describe, expect, it } from "vitest";
import {
  applySettingChange,
  clampIndex,
  findOptionIndex,
  findSettingByKey,
  getCurrentValue,
  getDefaultConfig,
  getSettingsForSection,
  SECTIONS,
  SETTINGS,
} from "../../src/tui/screens/config-helpers.js";
import type { ForgeConfig } from "../../src/schemas/forge-config.schema.js";

const baseline: ForgeConfig = {
  version: "0.1.0",
  preferredPackageManager: "npm",
  defaultPromptMode: "plan",
  componentStyle: "named-export",
  testFramework: "vitest",
};

describe("SETTINGS registry", () => {
  it("covers all enum fields on ForgeConfig", () => {
    const keys = SETTINGS.map((s) => s.key);
    expect(keys).toContain("preferredPackageManager");
    expect(keys).toContain("defaultPromptMode");
    expect(keys).toContain("componentStyle");
    expect(keys).toContain("testFramework");
  });

  it("references only known sections", () => {
    const sectionIds = SECTIONS.map((s) => s.id);
    for (const setting of SETTINGS) {
      expect(sectionIds).toContain(setting.section);
    }
  });

  it("declares non-empty options for every setting", () => {
    for (const setting of SETTINGS) {
      expect(setting.options.length).toBeGreaterThan(0);
    }
  });
});

describe("getSettingsForSection", () => {
  it("returns only the settings belonging to a section", () => {
    const defaults = getSettingsForSection("defaults");
    expect(defaults.every((s) => s.section === "defaults")).toBe(true);
    expect(defaults.length).toBeGreaterThan(0);
  });

  it("returns empty for sections with no settings", () => {
    expect(getSettingsForSection("paths")).toHaveLength(0);
    expect(getSettingsForSection("templates")).toHaveLength(0);
  });
});

describe("findSettingByKey", () => {
  it("returns the matching setting", () => {
    expect(findSettingByKey("preferredPackageManager")?.label).toBe(
      "Package manager",
    );
  });

  it("returns undefined for unknown keys", () => {
    // We intentionally pass a non-existent key via a cast for this branch.
    const setting = findSettingByKey("version" as keyof ForgeConfig);
    expect(setting).toBeUndefined();
  });
});

describe("getCurrentValue", () => {
  it("returns the current value for a setting", () => {
    const setting = findSettingByKey("preferredPackageManager");
    expect(setting).toBeDefined();
    if (setting) {
      expect(getCurrentValue(baseline, setting)).toBe("npm");
    }
  });
});

describe("applySettingChange", () => {
  it("returns ok with the updated config for a valid value", () => {
    const result = applySettingChange(
      baseline,
      "preferredPackageManager",
      "pnpm",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.preferredPackageManager).toBe("pnpm");
      // Other fields preserved.
      expect(result.config.defaultPromptMode).toBe("plan");
    }
  });

  it("returns ok for every option of each setting", () => {
    for (const setting of SETTINGS) {
      for (const value of setting.options) {
        const result = applySettingChange(baseline, setting.key, value);
        expect(result.ok).toBe(true);
      }
    }
  });

  it("returns error for an invalid value", () => {
    const result = applySettingChange(
      baseline,
      "preferredPackageManager",
      "cargo",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it("does not mutate the input config", () => {
    const snapshot = { ...baseline };
    applySettingChange(baseline, "defaultPromptMode", "implement");
    expect(baseline).toEqual(snapshot);
  });
});

describe("getDefaultConfig", () => {
  it("returns a config matching the schema defaults", () => {
    const config = getDefaultConfig();
    expect(config.preferredPackageManager).toBe("npm");
    expect(config.defaultPromptMode).toBe("plan");
    expect(config.componentStyle).toBe("named-export");
    expect(config.testFramework).toBe("vitest");
  });
});

describe("findOptionIndex", () => {
  it("returns the index of a known option", () => {
    const setting = findSettingByKey("preferredPackageManager");
    if (!setting) throw new Error("expected setting to exist");
    expect(findOptionIndex(setting, "pnpm")).toBe(
      setting.options.indexOf("pnpm"),
    );
  });

  it("returns 0 for an unknown option (safe fallback)", () => {
    const setting = findSettingByKey("preferredPackageManager");
    if (!setting) throw new Error("expected setting to exist");
    expect(findOptionIndex(setting, "unknown")).toBe(0);
  });
});

describe("clampIndex", () => {
  it("clamps to bounds", () => {
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(10, 3)).toBe(2);
    expect(clampIndex(1, 3)).toBe(1);
  });
});
