import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";

type SmallScreenWarningProps = {
  cols: number;
  rows: number;
};

export function SmallScreenWarning({
  cols,
  rows,
}: SmallScreenWarningProps): React.ReactElement {
  return (
    <Box paddingX={1}>
      <Text color={theme.bg} backgroundColor={theme.warning} bold>
        {` ${glyph("warn")} `}
      </Text>
      <Text color={theme.warning}>
        {` terminal is ${cols}×${rows} — TUI recommends ≥100×30. Panes may truncate.`}
      </Text>
    </Box>
  );
}
