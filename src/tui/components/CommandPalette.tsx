import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";
import {
  clampIndex,
  filterActions,
  groupActions,
  type PaletteAction,
} from "./palette-helpers.js";

type CommandPaletteProps = {
  actions: PaletteAction[];
  onClose: () => void;
};

export function CommandPalette({
  actions,
  onClose,
}: CommandPaletteProps): React.ReactElement {
  const [query, setQuery] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterActions(actions, query),
    [actions, query],
  );
  const safeIndex = clampIndex(selectedIndex, filtered.length);
  const grouped = useMemo(() => groupActions(filtered), [filtered]);

  const runAction = async (action: PaletteAction): Promise<void> => {
    setBusy(action.label);
    try {
      await action.run();
    } finally {
      setBusy(null);
      onClose();
    }
  };

  useInput((input, key) => {
    if (busy) return;
    if (key.return) {
      const action = filtered[safeIndex];
      if (action) {
        void runAction(action);
      }
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => clampIndex(i + 1, filtered.length));
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => clampIndex(i - 1, filtered.length));
      return;
    }
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setSelectedIndex(0);
      return;
    }
    if (input && input.length > 0 && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setSelectedIndex(0);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={theme.primary}
        paddingX={1}
        paddingY={1}
      >
        <Box marginBottom={1} flexDirection="row">
          <Text color={theme.primary} bold>
            {">"}
          </Text>
          <Text color={theme.text}> {query}</Text>
          <Text color={theme.primary}>▎</Text>
          <Box flexGrow={1} />
          <Text color={theme.textMuted}>
            {busy
              ? `running · ${busy}`
              : `${filtered.length} of ${actions.length}`}
          </Text>
        </Box>

        {busy ? (
          <Box flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}> {busy} …</Text>
          </Box>
        ) : filtered.length === 0 ? (
          <Text color={theme.textMuted}>
            no commands match. press esc to close.
          </Text>
        ) : (
          <Box flexDirection="column">
            {grouped.map((g) => (
              <Box key={g.group} flexDirection="column" marginBottom={1}>
                <Text color={theme.textMuted} bold>
                  {g.group.toUpperCase()}
                </Text>
                {g.items.map((action) => {
                  const flatIdx = filtered.indexOf(action);
                  const sel = flatIdx === safeIndex;
                  return (
                    <Box key={action.id} flexDirection="row">
                      <Text color={sel ? theme.primary : theme.borderSoft}>
                        {sel ? "▎" : " "}
                      </Text>
                      <Text color={theme.secondary}>
                        {" "}
                        {glyph("terminal")}{" "}
                      </Text>
                      <Box flexGrow={1}>
                        <Text color={sel ? theme.text : theme.textSecondary}>
                          {action.label}
                        </Text>
                      </Box>
                      <Text color={theme.textMuted}>{action.hint}</Text>
                      {action.shortcut && (
                        <Box marginLeft={1}>
                          <Text
                            color={theme.text}
                            backgroundColor={theme.elevated}
                          >
                            {` ${action.shortcut} `}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}

        <Box marginTop={1} flexDirection="row">
          <Text color={theme.textMuted}>
            type to filter · up/down move · enter run · esc close
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
