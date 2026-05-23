import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import { AppFrame } from "./components/AppFrame.js";
import { TopBar } from "./components/TopBar.js";
import { StatusBar } from "./components/StatusBar.js";
import { HelpOverlay } from "./components/HelpOverlay.js";
import { CommandPalette } from "./components/CommandPalette.js";
import { SmallScreenWarning } from "./components/SmallScreenWarning.js";
import type { PaletteAction } from "./components/palette-helpers.js";
import { DashboardScreen } from "./screens/DashboardScreen.js";
import { DoctorScreen } from "./screens/DoctorScreen.js";
import { RecipesScreen } from "./screens/RecipesScreen.js";
import { PromptsScreen } from "./screens/PromptsScreen.js";
import { LaunchScreen } from "./screens/LaunchScreen.js";
import { ConfigScreen } from "./screens/ConfigScreen.js";
import { OnboardingScreen } from "./screens/OnboardingScreen.js";
import { useAppState } from "./state.js";
import type { AppState } from "./state.js";
import { findRouteByKey, findRouteByNumericKey } from "./routes.js";
import { theme } from "./theme/tokens.js";
import { installDefaultRecipes } from "../modules/stackpack/recipe-store.js";
import {
  collectFirstRunSignals,
  evaluateFirstRun,
} from "./onboarding-helpers.js";
import { isPaletteShortcut } from "./key-helpers.js";

const globalShortcuts = [
  { key: "1-6", label: "tabs" },
  { key: "?", label: "help" },
  { key: "shift+p", label: "palette" },
  { key: "tab", label: "focus" },
  { key: "q", label: "quit" },
];


export function App(): React.ReactElement {
  const { exit } = useApp();
  const state = useAppState();
  const interactedRef = useRef<boolean>(false);
  const { cols, rows } = useTerminalSize();

  useEffect(() => {
    let cancelled = false;
    void (async (): Promise<void> => {
      try {
        const signals = await collectFirstRunSignals(process.cwd());
        if (cancelled || interactedRef.current) return;
        if (evaluateFirstRun(signals)) {
          state.setRoute("onboarding");
        }
      } catch {
        // ignore: stay on default route
      }
    })();
    return (): void => {
      cancelled = true;
    };
    // Intentionally run only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useInput((input, key) => {
    interactedRef.current = true;
    if (state.overlay !== null) {
      if (key.escape) {
        state.closeOverlay();
      }
      return;
    }

    if (state.inputCaptured) {
      // A screen owns the keyboard right now (e.g. filter editing).
      return;
    }

    if (isPaletteShortcut(input, key)) {
      state.togglePalette();
      return;
    }

    if (input === "?") {
      state.toggleHelp();
      return;
    }

    if (input === "q") {
      exit();
      return;
    }

    if (key.tab) {
      state.cycleFocus();
      return;
    }

    const numericRoute = findRouteByNumericKey(input);
    if (numericRoute) {
      state.setRoute(numericRoute.key);
    }
  });

  const paletteActions = useMemo<PaletteAction[]>(
    () => buildPaletteActions(state, exit),
    [state, exit],
  );

  const currentRoute = findRouteByKey(state.route);

  const tooSmall = cols < 100 || rows < 30;

  return (
    <AppFrame>
      {tooSmall && <SmallScreenWarning cols={cols} rows={rows} />}
      <TopBar
        crumbs={[currentRoute.label.toLowerCase()]}
        right={
          <Text color={theme.textMuted}>
            focus · pane {state.focusIndex + 1}
          </Text>
        }
      />
      <Box flexGrow={1} flexDirection="column">
        {state.overlay === "help" ? (
          <HelpOverlay currentRoute={state.route} />
        ) : state.overlay === "palette" ? (
          <CommandPalette
            actions={paletteActions}
            onClose={state.closeOverlay}
          />
        ) : (
          renderScreen(state)
        )}
      </Box>
      <StatusBar
        mode={currentRoute.label.toUpperCase()}
        shortcuts={globalShortcuts}
        hint={
          state.overlay === "help"
            ? "help overlay · esc to close"
            : state.overlay === "palette"
              ? "palette · esc to close"
              : `${currentRoute.label} screen`
        }
      />
    </AppFrame>
  );
}

function buildPaletteActions(
  state: AppState,
  exit: () => void,
): PaletteAction[] {
  return [
    {
      id: "go-dashboard",
      group: "Navigate",
      label: "Go to Dashboard",
      hint: "project overview",
      shortcut: "1",
      run: () => state.setRoute("dashboard"),
    },
    {
      id: "go-doctor",
      group: "Navigate",
      label: "Go to Doctor",
      hint: "triage repo issues",
      shortcut: "2",
      run: () => state.setRoute("doctor"),
    },
    {
      id: "go-recipes",
      group: "Navigate",
      label: "Go to Recipes",
      hint: "browse stackpack recipes",
      shortcut: "3",
      run: () => state.setRoute("recipes"),
    },
    {
      id: "go-prompts",
      group: "Navigate",
      label: "Go to Prompts",
      hint: "prompt history",
      shortcut: "4",
      run: () => state.setRoute("prompts"),
    },
    {
      id: "go-launch",
      group: "Navigate",
      label: "Go to Launch",
      hint: "launch reports",
      shortcut: "5",
      run: () => state.setRoute("launch"),
    },
    {
      id: "go-config",
      group: "Navigate",
      label: "Go to Config",
      hint: "edit ~/.forge/config.json",
      shortcut: "6",
      run: () => state.setRoute("config"),
    },
    {
      id: "run-doctor",
      group: "Doctor",
      label: "Run Doctor",
      hint: "scan rules (no fixes)",
      run: () => state.setRoute("doctor"),
    },
    {
      id: "init-recipes",
      group: "Recipes",
      label: "Init Default Recipes",
      hint: "install bundled defaults",
      run: async (): Promise<void> => {
        await installDefaultRecipes({ force: false });
        state.setRoute("recipes");
      },
    },
    {
      id: "open-config-path",
      group: "Config",
      label: "Open Config Path",
      hint: "show ~/.forge/config.json",
      run: () => state.setRoute("config"),
    },
    {
      id: "show-help",
      group: "Global",
      label: "Show Help",
      hint: "keyboard reference",
      shortcut: "?",
      run: () => state.setOverlay("help"),
    },
    {
      id: "quit",
      group: "Global",
      label: "Quit",
      hint: "exit forge tui",
      shortcut: "q",
      run: () => exit(),
    },
  ];
}

function renderScreen(state: AppState): React.ReactElement {
  switch (state.route) {
    case "dashboard":
      return <DashboardScreen />;
    case "doctor":
      return <DoctorScreen appState={state} />;
    case "recipes":
      return <RecipesScreen appState={state} />;
    case "prompts":
      return <PromptsScreen appState={state} />;
    case "launch":
      return <LaunchScreen appState={state} />;
    case "config":
      return <ConfigScreen appState={state} />;
    case "onboarding":
      return <OnboardingScreen />;
  }
}

function useTerminalSize(): { cols: number; rows: number } {
  const { stdout } = useStdout();
  const [size, setSize] = useState<{ cols: number; rows: number }>({
    cols: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  });

  useEffect(() => {
    if (!stdout) return;
    const handler = (): void => {
      setSize({
        cols: stdout.columns ?? 80,
        rows: stdout.rows ?? 24,
      });
    };
    stdout.on("resize", handler);
    return (): void => {
      stdout.off("resize", handler);
    };
  }, [stdout]);

  return size;
}
