import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.js";
import type { RouteKey } from "../routes.js";

type HelpGroup = {
  title: string;
  items: Array<[string, string]>;
};

const GLOBAL_GROUP: HelpGroup = {
  title: "Global",
  items: [
    ["?", "toggle this help"],
    ["shift+p", "open command palette"],
    ["esc", "close overlay / back"],
    ["q", "quit"],
  ],
};

const NAV_GROUP: HelpGroup = {
  title: "Navigation",
  items: [
    ["1", "dashboard"],
    ["2", "doctor"],
    ["3", "recipes"],
    ["4", "prompts"],
    ["5", "launch"],
    ["6", "config"],
    ["tab", "cycle pane focus"],
  ],
};

const SCREEN_KEYS: Record<RouteKey, HelpGroup> = {
  dashboard: {
    title: "Dashboard",
    items: [["?", "show this help"]],
  },
  doctor: {
    title: "Doctor",
    items: [
      ["j/k or ↑↓", "navigate issues"],
      ["/", "filter"],
      ["f", "apply selected fix"],
      ["d", "preview selected fix"],
      ["a", "apply all auto-fixable"],
      ["esc", "clear filter or back"],
    ],
  },
  recipes: {
    title: "Recipes",
    items: [
      ["j/k or ↑↓", "navigate recipes"],
      ["/", "search"],
      ["enter or p", "preview (dry run)"],
      ["a", "apply selected recipe"],
      ["r", "refresh list"],
      ["esc", "clear search or back"],
    ],
  },
  prompts: {
    title: "Prompts",
    items: [
      ["j/k or ↑↓", "navigate history"],
      ["/", "search"],
      ["t", "cycle type filter"],
      ["y", "copy prompt"],
      ["c", "clear history"],
      ["esc", "clear filters or back"],
    ],
  },
  launch: {
    title: "Launch",
    items: [
      ["j/k or ↑↓", "navigate reports"],
      ["d", "compare with previous"],
      ["r", "run check (no build)"],
      ["s", "save current run"],
      ["esc", "back"],
    ],
  },
  config: {
    title: "Config",
    items: [
      ["j/k or ↑↓", "navigate settings"],
      ["enter", "edit selected setting"],
      ["r", "reset to defaults"],
      ["p", "show config path"],
      ["esc", "back"],
    ],
  },
  onboarding: {
    title: "Welcome",
    items: [
      ["1-6", "enter a screen"],
      ["shift+p", "open command palette"],
      ["?", "toggle this help"],
      ["q", "quit"],
    ],
  },
};

type HelpOverlayProps = {
  currentRoute: RouteKey;
};

export function HelpOverlay({
  currentRoute,
}: HelpOverlayProps): React.ReactElement {
  const screenGroup = SCREEN_KEYS[currentRoute];

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={theme.primary}
        paddingX={2}
        paddingY={1}
      >
        <Box marginBottom={1} flexDirection="row">
          <Text color={theme.primary} bold>
            keyboard reference
          </Text>
          <Text color={theme.textMuted}> · press ? to toggle · esc to close</Text>
          <Box flexGrow={1} />
          <Text color={theme.textMuted}>
            current screen · {currentRoute}
          </Text>
        </Box>
        <HelpGroupBlock group={GLOBAL_GROUP} />
        <HelpGroupBlock group={NAV_GROUP} />
        <HelpGroupBlock group={screenGroup} />
      </Box>
    </Box>
  );
}

function HelpGroupBlock({ group }: { group: HelpGroup }): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={theme.textMuted} bold>
        {group.title.toUpperCase()}
      </Text>
      {group.items.map(([key, label]) => (
        <Box key={key} flexDirection="row">
          <Box width={14}>
            <Text color={theme.text} backgroundColor={theme.elevated}>
              {` ${key} `}
            </Text>
          </Box>
          <Text color={theme.textSecondary}> {label}</Text>
        </Box>
      ))}
    </Box>
  );
}
