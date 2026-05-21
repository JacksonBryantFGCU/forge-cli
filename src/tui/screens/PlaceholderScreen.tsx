import React from "react";
import { Box, Text } from "ink";
import { Pane } from "../components/Pane.js";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";

type PlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function PlaceholderScreen({
  title,
  description,
}: PlaceholderScreenProps): React.ReactElement {
  return (
    <Box flexGrow={1} flexDirection="row" paddingX={1}>
      <Pane title={title} focused flexGrow={1}>
        <Box flexDirection="column" paddingY={1}>
          <Text color={theme.primary} bold>
            {glyph("wrench")} {title} — placeholder
          </Text>
          <Box marginTop={1}>
            <Text color={theme.textSecondary}>
              {description ??
                "This screen is part of a later phase. The underlying CLI command still works."}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              Press 1 to return to the dashboard, ? for help, q to quit.
            </Text>
          </Box>
        </Box>
      </Pane>
    </Box>
  );
}
