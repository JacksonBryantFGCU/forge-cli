import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.js";

type KeyValueProps = {
  label: string;
  value: React.ReactNode;
  labelWidth?: number;
};

export function KeyValue({
  label,
  value,
  labelWidth = 16,
}: KeyValueProps): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Box width={labelWidth}>
        <Text color={theme.textMuted}>{label}</Text>
      </Box>
      {typeof value === "string" || typeof value === "number" ? (
        <Text color={theme.text}>{value}</Text>
      ) : (
        value
      )}
    </Box>
  );
}
