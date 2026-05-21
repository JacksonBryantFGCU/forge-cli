import React from "react";
import { Box } from "ink";

type AppFrameProps = {
  children: React.ReactNode;
};

export function AppFrame({ children }: AppFrameProps): React.ReactElement {
  return (
    <Box flexDirection="column" width="100%">
      {children}
    </Box>
  );
}
