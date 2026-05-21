import React, { useCallback, useEffect, useMemo, useState } from "react";
import os from "node:os";
import path from "node:path";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Pane } from "../components/Pane.js";
import { Tag } from "../components/Tag.js";
import { ListRow } from "../components/ListRow.js";
import { KeyValue } from "../components/KeyValue.js";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";
import type { AppState } from "../state.js";
import {
  getForgeConfigPath,
  getForgeHomeDir,
  readForgeConfig,
  writeForgeConfig,
} from "../../core/config.js";
import type { ForgeConfig } from "../../schemas/forge-config.schema.js";
import {
  applySettingChange,
  clampIndex,
  type ConfigSection,
  type ConfigSetting,
  findOptionIndex,
  getCurrentValue,
  getDefaultConfig,
  getSettingsForSection,
  SECTIONS,
  SETTINGS,
} from "./config-helpers.js";

type Mode = "browse" | "edit" | "confirm-reset";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; config: ForgeConfig }
  | { kind: "working"; message: string }
  | { kind: "error"; message: string };

type ConfigScreenProps = {
  appState: AppState;
};

export function ConfigScreen({
  appState,
}: ConfigScreenProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [settingIndex, setSettingIndex] = useState<number>(0);
  const [mode, setMode] = useState<Mode>("browse");
  const [editOptionIndex, setEditOptionIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setState({ kind: "loading" });
    setFeedback(null);
    try {
      const config = await readForgeConfig();
      setState({ kind: "ready", config });
      setSettingIndex(0);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const config = state.kind === "ready" ? state.config : null;
  const safeIndex = clampIndex(settingIndex, SETTINGS.length);
  const selectedSetting: ConfigSetting | null = SETTINGS[safeIndex] ?? null;
  const currentSection: ConfigSection | null =
    selectedSetting?.section ?? null;

  const handleEnterEdit = useCallback((): void => {
    if (!config || !selectedSetting) return;
    const current = getCurrentValue(config, selectedSetting);
    setEditOptionIndex(findOptionIndex(selectedSetting, current));
    setMode("edit");
    setFeedback(null);
  }, [config, selectedSetting]);

  const handleCommitEdit = useCallback(async (): Promise<void> => {
    if (!config || !selectedSetting) {
      setMode("browse");
      return;
    }
    const value = selectedSetting.options[editOptionIndex];
    if (typeof value !== "string") {
      setMode("browse");
      return;
    }
    const result = applySettingChange(config, selectedSetting.key, value);
    if (!result.ok) {
      setFeedback(`Invalid value: ${result.error}`);
      setMode("browse");
      return;
    }
    setState({
      kind: "working",
      message: `Saving ${selectedSetting.key} = ${value} …`,
    });
    try {
      await writeForgeConfig(result.config);
      setState({ kind: "ready", config: result.config });
      setFeedback(`Saved ${selectedSetting.label}: ${value}`);
    } catch (err) {
      setFeedback(
        `Save failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      setState({ kind: "ready", config });
    }
    setMode("browse");
  }, [config, selectedSetting, editOptionIndex]);

  const handleReset = useCallback(async (): Promise<void> => {
    setMode("browse");
    setState({ kind: "working", message: "Resetting config to defaults …" });
    try {
      const next = getDefaultConfig();
      await writeForgeConfig(next);
      setState({ kind: "ready", config: next });
      setFeedback("Reset config to defaults.");
    } catch (err) {
      setFeedback(
        `Reset failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (config) {
        setState({ kind: "ready", config });
      }
    }
  }, [config]);

  useInput((input, key) => {
    if (state.kind !== "ready") return;

    if (mode === "edit") {
      if (!selectedSetting) {
        setMode("browse");
        return;
      }
      if (key.escape) {
        setMode("browse");
        setFeedback(null);
        return;
      }
      if (key.return) {
        void handleCommitEdit();
        return;
      }
      if (key.downArrow || input === "j") {
        setEditOptionIndex((i) =>
          clampIndex(i + 1, selectedSetting.options.length),
        );
        return;
      }
      if (key.upArrow || input === "k") {
        setEditOptionIndex((i) =>
          clampIndex(i - 1, selectedSetting.options.length),
        );
        return;
      }
      return;
    }

    if (mode === "confirm-reset") {
      if (input === "y") {
        void handleReset();
      } else if (input === "n" || key.escape) {
        setMode("browse");
        setFeedback(null);
      }
      return;
    }

    if (key.escape) {
      appState.setRoute("dashboard");
      return;
    }
    if (key.downArrow || input === "j") {
      setSettingIndex((i) => clampIndex(i + 1, SETTINGS.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSettingIndex((i) => clampIndex(i - 1, SETTINGS.length));
      return;
    }
    if (key.return) {
      handleEnterEdit();
      return;
    }
    if (input === "r") {
      setMode("confirm-reset");
      return;
    }
    if (input === "p") {
      setFeedback(`Config path: ${getForgeConfigPath()}`);
    }
  });

  if (state.kind === "loading") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Config" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}> reading ~/.forge/config.json …</Text>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (state.kind === "working") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Config" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}> {state.message}</Text>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (state.kind === "error" || !config) {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Config" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="column">
            <Text color={theme.danger} bold>
              {glyph("warn")} Could not load config
            </Text>
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>
                {state.kind === "error" ? state.message : "unknown error"}
              </Text>
            </Box>
          </Box>
        </Pane>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Box flexDirection="row" gap={1} flexGrow={1}>
        <SectionsPane currentSection={currentSection} />
        <SettingsPane
          config={config}
          selectedSettingIndex={safeIndex}
          mode={mode}
          editOptionIndex={editOptionIndex}
        />
      </Box>
      <ActionFooter
        mode={mode}
        feedback={feedback}
        selectedSetting={selectedSetting}
        configPath={getForgeConfigPath()}
      />
    </Box>
  );
}

function SectionsPane({
  currentSection,
}: {
  currentSection: ConfigSection | null;
}): React.ReactElement {
  const home = getForgeHomeDir();
  const homeDisplay = home.replace(os.homedir(), "~");

  return (
    <Pane title="Sections" flexGrow={1}>
      <Box flexDirection="column">
        {SECTIONS.map((section) => {
          const count = SETTINGS.filter((s) => s.section === section.id).length;
          return (
            <ListRow
              key={section.id}
              selected={section.id === currentSection}
              prefix={<Text color={theme.textSecondary}>{glyph("chevron")}</Text>}
              right={
                count > 0 ? (
                  <Text color={theme.textMuted}>{count}</Text>
                ) : (
                  <Text color={theme.textMuted}>info</Text>
                )
              }
            >
              <Text
                color={
                  section.id === currentSection
                    ? theme.text
                    : theme.textSecondary
                }
              >
                {section.label}
              </Text>
            </ListRow>
          );
        })}

        <Box marginTop={1} flexDirection="column">
          <Text color={theme.textMuted} bold>
            PATHS
          </Text>
          <Text color={theme.textSecondary}>
            {glyph("folder")} {homeDisplay}
          </Text>
          <Text color={theme.textSecondary}>
            {glyph("folder")} {homeDisplay}/recipes
          </Text>
          <Text color={theme.textSecondary}>
            {glyph("folder")} {homeDisplay}/templates
          </Text>
          <Text color={theme.textSecondary}>
            {glyph("folder")} {homeDisplay}/prompts/history.json
          </Text>
        </Box>
      </Box>
    </Pane>
  );
}

function SettingsPane({
  config,
  selectedSettingIndex,
  mode,
  editOptionIndex,
}: {
  config: ForgeConfig;
  selectedSettingIndex: number;
  mode: Mode;
  editOptionIndex: number;
}): React.ReactElement {
  return (
    <Pane title="Settings" focused flexGrow={2}>
      <Box flexDirection="column">
        {SECTIONS.filter(
          (section) => getSettingsForSection(section.id).length > 0,
        ).map((section) => {
          const sectionSettings = getSettingsForSection(section.id);
          return (
            <Box key={section.id} flexDirection="column" marginBottom={1}>
              <Text color={theme.textMuted} bold>
                {section.label.toUpperCase()}
              </Text>
              {sectionSettings.map((setting) => {
                const flatIdx = SETTINGS.indexOf(setting);
                const sel = flatIdx === selectedSettingIndex;
                const value = getCurrentValue(config, setting);
                return (
                  <ListRow
                    key={setting.key}
                    selected={sel}
                    prefix={<Text color={theme.textSecondary}>{setting.label}</Text>}
                    right={<Tag color={theme.primary} tone="solid">{value}</Tag>}
                  >
                    {" "}
                  </ListRow>
                );
              })}
            </Box>
          );
        })}

        {mode === "edit" && (
          <EditPicker
            setting={SETTINGS[selectedSettingIndex]}
            optionIndex={editOptionIndex}
          />
        )}

        {mode === "browse" && SETTINGS[selectedSettingIndex] && (
          <SettingDetail
            setting={SETTINGS[selectedSettingIndex]}
            value={getCurrentValue(config, SETTINGS[selectedSettingIndex])}
          />
        )}
      </Box>
    </Pane>
  );
}

function SettingDetail({
  setting,
  value,
}: {
  setting: ConfigSetting;
  value: string;
}): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      marginTop={1}
      paddingX={1}
      borderStyle="round"
      borderColor={theme.borderSoft}
    >
      <Box flexDirection="row">
        <Text color={theme.text} bold>
          {setting.label}
        </Text>
        <Box marginLeft={1}>
          <Tag color={theme.secondary}>enum</Tag>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.textSecondary}>{setting.description}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <KeyValue label="current" value={
          <Tag color={theme.primary} tone="solid">{value}</Tag>
        } />
        <KeyValue
          label="options"
          value={
            <Text color={theme.textSecondary}>{setting.options.join(", ")}</Text>
          }
        />
        <KeyValue label="key" value={setting.key} />
      </Box>
      <Box marginTop={1}>
        <Text color={theme.textMuted}>
          {glyph("arrow")} press enter to edit
        </Text>
      </Box>
    </Box>
  );
}

function EditPicker({
  setting,
  optionIndex,
}: {
  setting: ConfigSetting | undefined;
  optionIndex: number;
}): React.ReactElement {
  if (!setting) {
    return <Box />;
  }
  return (
    <Box
      flexDirection="column"
      marginTop={1}
      paddingX={1}
      borderStyle="double"
      borderColor={theme.primary}
    >
      <Box flexDirection="row" marginBottom={1}>
        <Text color={theme.primary} bold>
          Edit · {setting.label}
        </Text>
        <Box flexGrow={1} />
        <Text color={theme.textMuted}>
          {glyph("arrow")} j/k select · enter save · esc cancel
        </Text>
      </Box>
      {setting.options.map((opt, i) => {
        const active = i === optionIndex;
        return (
          <Box key={opt} flexDirection="row">
            <Text color={active ? theme.primary : theme.borderSoft}>
              {active ? "▎" : " "}
            </Text>
            <Box marginLeft={1}>
              {active ? (
                <Tag color={theme.primary} tone="solid">{opt}</Tag>
              ) : (
                <Text color={theme.textSecondary}>{opt}</Text>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function ActionFooter({
  mode,
  feedback,
  selectedSetting,
  configPath,
}: {
  mode: Mode;
  feedback: string | null;
  selectedSetting: ConfigSetting | null;
  configPath: string;
}): React.ReactElement {
  let hint: string;
  if (mode === "edit") {
    hint = "edit · j/k select option · enter save · esc cancel";
  } else if (mode === "confirm-reset") {
    hint = "reset all settings to defaults? press y to confirm · n to cancel";
  } else {
    hint = "j/k navigate · enter edit · r reset · p show path · esc back";
  }

  const compactPath = configPath.replace(os.homedir(), "~");

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      paddingX={1}
      borderStyle="single"
      borderColor={theme.borderSoft}
    >
      <Box flexDirection="row">
        <Text color={theme.textMuted}>{hint}</Text>
        <Box flexGrow={1} />
        <Text color={theme.textMuted}>
          {selectedSetting
            ? `editing ${selectedSetting.key}`
            : `config · ${path.basename(configPath)}`}
        </Text>
      </Box>
      <Box marginTop={0}>
        <Text color={theme.textMuted}>{compactPath}</Text>
      </Box>
      {feedback && (
        <Box marginTop={0}>
          <Text color={theme.text}>{feedback}</Text>
        </Box>
      )}
    </Box>
  );
}
