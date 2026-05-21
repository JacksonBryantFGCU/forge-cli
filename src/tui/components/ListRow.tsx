import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.js";

type ListRowProps = {
  selected?: boolean;
  prefix?: React.ReactNode;
  right?: React.ReactNode;
  dim?: boolean;
  children: React.ReactNode;
};

export function ListRow({
  selected = false,
  prefix,
  right,
  dim = false,
  children,
}: ListRowProps): React.ReactElement {
  const indicatorColor = selected ? theme.primary : theme.borderSoft;
  const textColor = dim ? theme.textMuted : theme.text;

  return (
    <Box flexDirection="row">
      <Text color={indicatorColor}>{selected ? "▎" : " "}</Text>
      {prefix !== undefined && (
        <Box marginRight={1} marginLeft={0}>
          {typeof prefix === "string" ? <Text>{prefix}</Text> : prefix}
        </Box>
      )}
      <Box flexGrow={1}>
        {typeof children === "string" ? (
          <Text color={textColor}>{children}</Text>
        ) : (
          children
        )}
      </Box>
      {right !== undefined && (
        <Box marginLeft={1}>
          {typeof right === "string" ? (
            <Text color={theme.textMuted}>{right}</Text>
          ) : (
            right
          )}
        </Box>
      )}
    </Box>
  );
}
