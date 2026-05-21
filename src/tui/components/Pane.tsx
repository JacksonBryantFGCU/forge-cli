import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.js";

type PaneProps = {
  title?: string;
  focused?: boolean;
  flexGrow?: number;
  flexBasis?: number;
  width?: number;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function Pane({
  title,
  focused = false,
  flexGrow,
  flexBasis,
  width,
  right,
  children,
}: PaneProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? theme.primary : theme.borderSoft}
      paddingX={1}
      flexGrow={flexGrow}
      flexBasis={flexBasis}
      width={width}
      minHeight={3}
    >
      {(title || right) && (
        <Box flexDirection="row" marginBottom={1}>
          {title && (
            <Text
              color={focused ? theme.text : theme.textSecondary}
              bold
            >
              {title.toUpperCase()}
            </Text>
          )}
          <Box flexGrow={1} />
          {right}
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
  );
}
