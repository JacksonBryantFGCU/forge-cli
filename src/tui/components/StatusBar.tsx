import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.js";

export type Shortcut = {
  key: string;
  label: string;
};

type StatusBarProps = {
  mode: string;
  shortcuts: Shortcut[];
  hint?: string;
};

export function StatusBar({
  mode,
  shortcuts,
  hint,
}: StatusBarProps): React.ReactElement {
  return (
    <Box flexDirection="row" paddingX={1} borderStyle="single" borderColor={theme.borderSoft} borderTop borderBottom={false} borderLeft={false} borderRight={false}>
      <Text color={theme.bg} backgroundColor={theme.primary} bold>
        {` ${mode} `}
      </Text>
      {shortcuts.map((s, i) => (
        <Box key={`${i}-${s.key}`} marginLeft={2} flexDirection="row">
          <Text color={theme.text} backgroundColor={theme.elevated}>
            {` ${s.key} `}
          </Text>
          <Text color={theme.textMuted}> {s.label}</Text>
        </Box>
      ))}
      <Box flexGrow={1} />
      {hint && <Text color={theme.textMuted}>{hint}</Text>}
    </Box>
  );
}
