import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";

type TopBarProps = {
  crumbs: string[];
  right?: React.ReactNode;
};

export function TopBar({ crumbs, right }: TopBarProps): React.ReactElement {
  return (
    <Box paddingX={1} paddingY={0} flexDirection="row">
      <Text color={theme.primary} bold>
        {glyph("forge")} forge
      </Text>
      <Text color={theme.textMuted}> · </Text>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={`${i}-${crumb}`}>
          <Text color={i === crumbs.length - 1 ? theme.text : theme.textSecondary}>
            {crumb}
          </Text>
          {i < crumbs.length - 1 && (
            <Text color={theme.textMuted}> {glyph("chevron")} </Text>
          )}
        </React.Fragment>
      ))}
      <Box flexGrow={1} />
      {right}
    </Box>
  );
}
