import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { Pane } from "../components/Pane.js";
import { Tag } from "../components/Tag.js";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";
import {
  collectFirstRunSignals,
  type FirstRunSignals,
} from "../onboarding-helpers.js";

export function OnboardingScreen(): React.ReactElement {
  const [signals, setSignals] = useState<FirstRunSignals | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async (): Promise<void> => {
      const s = await collectFirstRunSignals(process.cwd());
      if (!cancelled) setSignals(s);
    })();
    return (): void => {
      cancelled = true;
    };
  }, []);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Pane title="Welcome to Forge" focused flexGrow={1}>
        <Box flexDirection="column" paddingY={1}>
          <Box flexDirection="row">
            <Text color={theme.primary} bold>
              {glyph("forge")} forge tui
            </Text>
            <Text color={theme.textMuted}> · local developer cockpit</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.textSecondary}>
              Project scaffolding · repo doctor · prompt generation · recipes · launch checks.
            </Text>
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text color={theme.textMuted} bold>
              CURRENT STATE
            </Text>
            {signals ? (
              <SignalsList signals={signals} />
            ) : (
              <Box flexDirection="row">
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.textSecondary}> detecting …</Text>
              </Box>
            )}
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text color={theme.textMuted} bold>
              GET STARTED
            </Text>
            <StepLine
              keyHint="1"
              label="Open the dashboard"
              detail="see project, doctor, and launch summary at a glance"
            />
            <StepLine
              keyHint="2"
              label="Triage repo issues"
              detail="forge doctor scans for security, deploy, and react gotchas"
            />
            <StepLine
              keyHint="3"
              label="Browse recipes"
              detail="install bundled defaults via the command palette (ctrl+k)"
            />
            <StepLine
              keyHint="ctrl+k"
              label="Open the command palette"
              detail="navigate, run actions, or init defaults from one menu"
            />
            <StepLine
              keyHint="?"
              label="Show keyboard reference"
              detail="every screen has screen-specific shortcuts"
            />
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text color={theme.textMuted} bold>
              ALSO ON THE CLI
            </Text>
            <Text color={theme.textSecondary}>
              {"  "}forge pack init-defaults
            </Text>
            <Text color={theme.textSecondary}>
              {'  forge prompt feature "add Supabase auth"'}
            </Text>
            <Text color={theme.textSecondary}>
              {"  "}forge launch --skip-build --save
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              Press 1–6 to enter a screen, ctrl+k for the action palette, ? for
              help, q to quit.
            </Text>
          </Box>
        </Box>
      </Pane>
    </Box>
  );
}

function SignalsList({
  signals,
}: {
  signals: FirstRunSignals;
}): React.ReactElement {
  return (
    <Box flexDirection="column">
      <SignalRow
        ok={signals.hasPackage}
        label="package.json"
        ok_detail="found in current directory"
        missing_detail="run forge tui inside a project, or use `forge new <name>`"
      />
      <SignalRow
        ok={signals.hasConfig}
        label="~/.forge/config.json"
        ok_detail="forge configuration is initialized"
        missing_detail="will be created automatically on first save"
      />
      <SignalRow
        ok={signals.recipeCount > 0}
        label="recipes"
        ok_detail={`${signals.recipeCount} installed`}
        missing_detail="run `forge pack init-defaults` to install bundled recipes"
      />
      <SignalRow
        ok={signals.promptCount > 0}
        label="prompt history"
        ok_detail={`${signals.promptCount} saved`}
        missing_detail='run `forge prompt feature "…"` to generate a prompt'
      />
      <SignalRow
        ok={signals.reportCount > 0}
        label="launch reports"
        ok_detail={`${signals.reportCount} saved`}
        missing_detail="run `forge launch --skip-build --save` to capture one"
      />
    </Box>
  );
}

function SignalRow({
  ok,
  label,
  ok_detail,
  missing_detail,
}: {
  ok: boolean;
  label: string;
  ok_detail: string;
  missing_detail: string;
}): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Box width={3}>
        <Text color={ok ? theme.success : theme.textMuted}>
          {ok ? glyph("check") : glyph("cross")}
        </Text>
      </Box>
      <Box width={26}>
        <Text color={ok ? theme.text : theme.textSecondary}>{label}</Text>
      </Box>
      <Text color={theme.textMuted}>
        {ok ? ok_detail : missing_detail}
      </Text>
    </Box>
  );
}

function StepLine({
  keyHint,
  label,
  detail,
}: {
  keyHint: string;
  label: string;
  detail: string;
}): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Box width={10}>
        <Text color={theme.text} backgroundColor={theme.elevated}>
          {` ${keyHint} `}
        </Text>
      </Box>
      <Box width={32}>
        <Text color={theme.text}> {label}</Text>
      </Box>
      <Text color={theme.textMuted}>{detail}</Text>
    </Box>
  );
}
