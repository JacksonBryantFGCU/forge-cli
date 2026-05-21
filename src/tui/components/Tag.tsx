import React from "react";
import { Text } from "ink";
import { theme } from "../theme/tokens.js";

type TagTone = "subtle" | "solid";

type TagProps = {
  children: string;
  color?: string;
  tone?: TagTone;
};

export function Tag({
  children,
  color,
  tone = "subtle",
}: TagProps): React.ReactElement {
  const fg = color ?? theme.textSecondary;
  if (tone === "solid") {
    return (
      <Text color={theme.bg} backgroundColor={fg} bold>
        {` ${children} `}
      </Text>
    );
  }
  return <Text color={fg}>[{children}]</Text>;
}
