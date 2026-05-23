# Forge TUI

`forge tui` launches an interactive Ink-based terminal UI for the Forge
toolkit. It is a thin layer over the same modules the CLI uses — no
business logic is duplicated.

## Running

```bash
forge tui
```

The TUI takes over the terminal until you press `q` (or `Esc` on the
dashboard). It is keyboard-only by design.

On first run (no recipes, no prompt history, no saved launch reports) the
TUI auto-routes to a Welcome screen with detected status and suggested
next steps. Any key dismisses it.

## Screens

| # | Screen      | What it shows / does                                                                 |
| - | ----------- | ------------------------------------------------------------------------------------ |
| 1 | Dashboard   | Project, Doctor summary, Launch score, Environment, Recent activity, System info.    |
| 2 | Doctor      | Repo issues grouped by category. Apply / preview / apply-all fixes interactively.    |
| 3 | Recipes     | Browse `~/.forge/recipes`. Preview operations, apply with confirmation.              |
| 4 | Prompts     | Prompt history with type filter chips, search, copy to clipboard, clear with confirm.|
| 5 | Launch      | Saved reports list, summary banner, per-check diff (fixed / regressed / new).        |
| 6 | Config      | Edit `~/.forge/config.json` enum settings. Schema-validated saves, reset to defaults. |

Two overlays:

- **Command palette** — `Shift+P` opens a fuzzy-filter list of every action
  (navigate, run doctor, init default recipes, show help, quit). Shift+P
  is used instead of Ctrl+K because many terminals (Windows Terminal,
  VS Code's integrated terminal, several shells) bind Ctrl+K to their
  own actions.
- **Help** — `?` shows global + screen-specific keybindings.

## Keybindings

### Global

| Key      | Action                                       |
| -------- | -------------------------------------------- |
| `1`–`6`  | Jump to numbered screen                      |
| `Shift+P`| Open command palette                         |
| `?`      | Toggle help overlay                          |
| `Esc`    | Close overlay / clear filter / back          |
| `Tab`    | Cycle pane focus indicator                   |
| `q`      | Quit                                         |

### Lists (every screen)

| Key       | Action            |
| --------- | ----------------- |
| `j` / `↓` | Next item         |
| `k` / `↑` | Previous item     |
| `/`       | Start filter/search input |
| `Enter`   | Primary action on the selected row |

### Screen-specific

| Screen   | Keys                                                                |
| -------- | ------------------------------------------------------------------- |
| Doctor   | `f` apply, `d` preview, `a` apply-all (with `y/n` confirm)          |
| Recipes  | `p` preview, `a` apply (with `y/n` confirm), `r` refresh            |
| Prompts  | `t` cycle type filter, `y` copy, `c` clear history (with confirm)   |
| Launch   | `d` compare, `r` run check (build skipped), `s` save current run     |
| Config   | `Enter` edit selected enum, `r` reset (with confirm), `p` show path |

### Command palette

| Key        | Action                  |
| ---------- | ----------------------- |
| any char   | Append to filter query  |
| Backspace  | Delete one char         |
| `↑` / `↓`  | Move selection          |
| `Enter`    | Run selected action     |
| `Esc`      | Close palette           |

## Limitations

This is a terminal UI built on [Ink](https://github.com/vadimdemedes/ink),
not a desktop app. A few things from the browser-based design references
do not translate:

- **No pixel measurements.** Every layout is expressed in character cells
  via flex ratios. The recommended size is **≥100×30**. Below that, a
  yellow warning banner is shown above the top bar and panes may
  truncate, but the TUI stays functional.
- **No region backgrounds.** Ink can color text but not fill arbitrary
  regions, so depth comes from borders and selection bars rather than
  layered surfaces.
- **No animation** beyond the spinner (`ink-spinner`) and the cursor in
  filter inputs.
- **No mouse.** All interactions are keyboard-driven.
- **No inline file diffs in the doctor screen.** The current doctor
  engine reports fix preview text only — see the TODO in
  `src/tui/screens/DoctorScreen.tsx`.

## Nerd Font

The TUI uses Unicode glyphs (`●`, `◆`, `✓`, `✕`, `→`, `▎`, `▾`, etc.) that
render correctly in every modern terminal font. **A Nerd Font is not
required.** If you happen to use one, the existing glyphs still look right
— there is no special private-use codepoint set.

## Design reference

The original browser-based React mockups live in
`docs/design/forge-tui/`. They are reference designs only; the Ink
implementation translates the layout and interaction intent, not the
HTML/CSS verbatim. See `docs/TUI_IMPLEMENTATION_PLAN.md` for the
browser-to-Ink mapping table.

## Crash safety

The TUI never assumes a full project context. It works (with appropriate
empty states) when:

- there is no `package.json` in the current directory
- `~/.forge` has no recipes, no prompt history, or no saved launch reports
- the directory is not a git repository
- the terminal is smaller than the recommended size

Each screen renders an empty state with a suggested CLI command rather
than failing.

## Architecture

```
src/
  commands/tui/index.ts             # oclif entry — render(<App/>)
  tui/
    App.tsx                         # routes, key handling, first-run check
    state.ts                        # useAppState hook
    routes.ts                       # route table
    onboarding-helpers.ts           # first-run detection
    theme/                          # tokens, glyphs
    components/                     # primitives + overlays
      AppFrame, TopBar, StatusBar, Pane, Tag,
      KeyValue, ListRow, HelpOverlay, CommandPalette,
      SmallScreenWarning
    screens/
      DashboardScreen.tsx
      DoctorScreen.tsx        (+ doctor-helpers.ts)
      RecipesScreen.tsx       (+ recipe-helpers.ts)
      PromptsScreen.tsx       (+ prompt-helpers.ts)
      LaunchScreen.tsx        (+ launch-helpers.ts)
      ConfigScreen.tsx        (+ config-helpers.ts)
      OnboardingScreen.tsx
```

Screens import existing modules directly (`detectProjectContext`,
`runDoctor`, `runLaunchCheck`, `listRecipes`, `loadHistory`,
`readForgeConfig` / `writeForgeConfig`, …). New TUI-specific work (e.g.
`previewFix`, `applyRecipe`, `copyPrompt`, `saveReport`) is exposed as
thin, non-breaking helpers in the same modules so the CLI commands are
unchanged.
