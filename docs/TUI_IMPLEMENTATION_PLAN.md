# Forge TUI — Implementation Plan

This plan translates the browser React prototypes in `docs/design/forge-tui/` into a
practical Ink implementation. The HTML/CSS prototypes are **reference only** — they
rely on DOM features (CSS variables, gradients, SVG rings, blurred overlays, exact
pixel sizing) that do not exist in a terminal. The goal of this document is to map
those design intents to terminal-feasible equivalents and to lay out a phased build
order.

---

## 1. Stack & runtime

| Concern          | Choice                                                     |
| ---------------- | ---------------------------------------------------------- |
| Renderer         | [Ink 6](https://github.com/vadimdemedes/ink) (React in TTY) |
| Bundler/runtime  | Existing tsup + Node 20 ESM (matches the rest of Forge)    |
| Input            | `ink` `useInput` + custom focus context                    |
| Spinner / chrome | `ink-spinner`, `ink-text-input` for inline input fields    |
| Color            | `chalk` (already a dep) via Ink's `<Text color>` prop      |
| Layout primitive | `<Box>` (Yoga flexbox)                                     |
| Entry            | New command: `src/commands/tui/index.ts` → `forge tui`     |

No new heavy deps: only `ink`, `ink-spinner`, and `ink-text-input` (well-maintained,
small). Everything else lives in `src/modules/tui/`.

---

## 2. Folder structure

```
src/
  commands/
    tui/
      index.ts                      # `forge tui` entry — boots Ink render
  modules/
    tui/
      app.tsx                       # Top-level <App/> with router + global key handler
      theme/
        tokens.ts                   # Theme palettes + density + accent definitions
        glyphs.ts                   # Icon sets (nerd / unicode / ascii)
        ThemeProvider.tsx           # Context exposing theme + glyph getter
      hooks/
        useFocus.ts                 # Pane focus traversal (Tab / Shift-Tab)
        useListNav.ts               # j/k/↑↓ list selection with bounds
        useGlobalKeys.ts            # ⌘K, ?, esc, q, 1-9 numeric tabs
        useRoute.ts                 # Current route + history stack
      primitives/
        AppFrame.tsx                # Outer Box; was TuiFrame
        TopBar.tsx                  # Branding + breadcrumbs + right slot
        StatusBar.tsx               # Bottom hint strip + shortcut chips
        Workspace.tsx               # Padded flex container between TopBar/StatusBar
        Pane.tsx                    # Titled, optionally-focused content box
        ListRow.tsx                 # Selectable row with prefix/right slots
        Tag.tsx                     # Colored chip (subtle/solid tones)
        KeyValue.tsx                # Two-column key/value rail
        Kbd.tsx                     # Keycap render
        SectionTitle.tsx            # Dim uppercase header with rule
        Sparkline.tsx               # Block-char sparkline (▁▂▃▄▅▆▇█)
        ProgressBar.tsx             # Block-char bar
        DiffBlock.tsx               # Unified diff renderer (+/-/@)
        Heat.tsx                    # Single-number heat card
        ScoreBig.tsx                # Replacement for ScoreRing (text-only)
        Overlay.tsx                 # Full-screen modal frame (palette/help)
        FilterChip.tsx              # Active/inactive filter pill
        ActionHint.tsx              # "(a) apply  (s) skip" footer hints
      screens/
        Dashboard.tsx               # forge dash
        Doctor.tsx                  # forge doctor (triage)
        Launch.tsx                  # forge launch (diff)
        Recipes.tsx                 # forge pack (browser)
        Prompts.tsx                 # forge prompt history
        Config.tsx                  # forge config
        Onboarding.tsx              # first-run
        States/
          Loading.tsx               # mid-run progress (launch/doctor)
          Empty.tsx                 # zero-state for any list
          Error.tsx                 # rule crash / failed action
      overlays/
        CommandPalette.tsx          # ⌘K palette
        Help.tsx                    # ? keyboard reference
      data/
        adapters.ts                 # Map real Forge data → screen view-models
        types.ts                    # View-model types (no `any`)
  schemas/
    tui-config.schema.ts            # Theme/density/accent persisted to forge config
tests/
  modules/
    tui/
      primitives.test.tsx           # snapshot-style render via ink-testing-library
      list-nav.test.ts              # bounds + wrapping for useListNav
      route.test.ts                 # route stack push/pop
      adapters.test.ts              # data adapters produce expected view-models
```

`tsup.config.ts` adds one entry: `src/commands/tui/index.ts`. Everything else is
imported via that command.

---

## 3. Design tokens — what to keep, what to drop

The browser tokens (`tui-tokens.jsx`) define three themes (midnight / graphite /
slate), three density presets (compact / comfortable / roomy), five accents, four
border styles, and three icon sets. In Ink:

### Kept
- **Theme palettes**: `primary, secondary, success, warning, danger, text, textSec,
  textMuted, selection, focusBorder`. These map directly to Ink `<Text color>` /
  `<Box borderColor>`.
- **Accents**: same scheme — override `primary` + `secondary` per accent.
- **Icon sets** (`nerd / unicode / ascii`): kept verbatim. `glyph(name, set)` helper
  ports as-is.
- **Border styles**: collapse to two — `minimal` (focus ring only) and `single`
  (border on every pane). `double` becomes `borderStyle="double"` on the focused
  pane; `none` is the same as `minimal` without a focus border.

### Dropped or remapped
- **Pixel padding (`padX/padY/gap`)**: Ink only measures in character cells.
  `density` becomes integer cell counts:
  | Density      | padX | padY | gap | rowGap |
  | ------------ | ---- | ---- | --- | ------ |
  | compact      | 1    | 0    | 1   | 0      |
  | comfortable  | 2    | 1    | 1   | 0      |
  | roomy        | 3    | 1    | 2   | 1      |
- **`bg / panel / elevated`**: backgrounds via `<Text backgroundColor>` only.
  Cannot tint a region without per-character background; instead, use border color
  + dim text + selection highlight to imply elevation.
- **`shadow`, `boxShadow`, `borderRadius`, `boxShadow glow`**: drop entirely.
- **`focusBorder` width / double border**: Ink supports `borderStyle="double"`,
  `"single"`, `"round"`, `"bold"`. Pick one per state.
- **`fontPx`, `lineHeight`, `cellW`, `cellH`**: irrelevant — the terminal owns
  cell sizing.

`tokens.ts` exposes:

```ts
export type Theme = { primary: string; secondary: string; success: string; warning: string;
                     danger: string; text: string; textSec: string; textMuted: string;
                     selection: string; focusBorder: string; };
export const themes: Record<'midnight' | 'graphite' | 'slate', Theme>;
export const density: Record<'compact' | 'comfortable' | 'roomy', DensityCells>;
export const accents: Record<'blue' | 'cyan' | 'green' | 'violet' | 'amber',
                             Pick<Theme, 'primary' | 'secondary'>>;
```

User can change these via `forge config` (already exists) — read at startup, hot
reload on the Config screen.

---

## 4. Primitive → Ink mapping table

| Browser primitive (`tui-components.jsx`) | Ink replacement                | Implementation note                                                                 |
| ---------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `TuiFrame`                               | `AppFrame`                     | Top-level `<Box flexDirection="column" height={process.stdout.rows}>`               |
| `WindowChrome` (mac traffic lights)      | **dropped**                    | Terminal already provides its own chrome                                            |
| `TopBar`                                 | `TopBar`                       | Row of `<Text>` segments separated by `·`; right slot via `flexGrow:1` spacer       |
| `StatusBar`                              | `StatusBar`                    | One-row `<Box>` pinned at bottom; mode chip = `<Text inverse color="primary">`      |
| `Workspace`                              | `Workspace`                    | `<Box flexGrow={1} padding={...}>` — drop fractional padding, use whole cells       |
| `Pane`                                   | `Pane`                         | `<Box borderStyle="round" borderColor={focused?focus:soft}>` + title row            |
| `Row` / `Col`                            | use `<Box>` directly           | Pass `flexDirection`. No wrapper component needed in Ink                            |
| `KV`                                     | `KeyValue`                     | Two `<Text>` cells; left fixed-width, right grows                                   |
| `SevDot`                                 | inline `<Text color=...>●</Text>` | Single character, no component needed                                            |
| `Tag`                                    | `Tag`                          | Subtle = colored text in brackets `[name]`. Solid = `<Text inverse color>`          |
| `ListRow`                                | `ListRow`                      | Selection bar = left `▎` column + reverse video on selected line                    |
| `ProgressBar`                            | `ProgressBar`                  | `█` filled + `░` empty, fixed width in cells                                        |
| `Sparkline`                              | `Sparkline`                    | Block chars `▁▂▃▄▅▆▇█`, identical algorithm — already terminal-friendly             |
| `DiffBlock`                              | `DiffBlock`                    | Per-line color: `+` green, `-` red, `@` cyan. No background tint, just text color   |
| `SectionTitle`                           | `SectionTitle`                 | Dim uppercase text + `─` rule line via flexGrow                                     |
| `Dim` / `Sec`                            | `<Text dimColor>` / colored    | One-liner helpers; not separate components                                          |
| `Kbd`                                    | `Kbd`                          | `<Text inverse>` or `[key]` brackets                                                |
| `ScoreRing` (SVG)                        | `ScoreBig`                     | Large number + tiny block-char ring approximation `◐◓◑◒` for animation, or omit ring |
| `Heat`                                   | `Heat`                         | Big number + label, colored border. No background gradient                          |

### Things that simply do not translate
- **Blurred dim background overlays** (`filter: blur(0.5px) brightness(0.6)`):
  Replace with a darkened/dimmed copy of the underlying screen (every `<Text>`
  rendered with `dimColor` when an overlay is open). The palette/help overlay
  itself is a centered `<Box>` with a contrasting border.
- **Animation** (spinner spin, cursor blink, transition fades): only the spinner
  is preserved (use `ink-spinner`). Cursor blink comes from `ink-text-input`
  automatically.
- **Pixel-precise widths** (`width: 460`, `width: 240`, etc.): replaced with
  proportional flex (`flexBasis` in cells, or `flexGrow` ratios). E.g. the
  doctor design's `width={460}` (issue list pane) becomes `flexBasis={36}` (~36
  cells) or `flexGrow={1.2}` against a `flexGrow={1}` preview pane.
- **Grid layouts** (`gridTemplateColumns: '1fr 1fr'`): rewritten as nested rows
  of equal-flex `<Box>` children.
- **Mouse `onClick`**: removed everywhere. Every interaction must have a
  keyboard binding.

---

## 5. Screen list

Match the prototype's screen list. Each screen is a single React component that
composes primitives. Direction A is the default; direction B is **deferred** —
listed for later iteration once direction A feels right in a real terminal.

| Screen        | Route key   | First impl direction | Notes                                          |
| ------------- | ----------- | -------------------- | ---------------------------------------------- |
| Dashboard     | `dash`      | A (cockpit)          | Default landing screen                         |
| Doctor        | `doctor`    | A (two-pane)         | Reuses existing `repo-doctor` module output    |
| Launch        | `launch`    | A (three-column diff)| Reuses `launchcheck` + new reports module      |
| Recipes       | `recipes`   | A (list + preview)   | Reuses `stackpack` module                      |
| Prompts       | `prompts`   | A (history + preview)| Reuses `promptkit` history (added previously)  |
| Config        | `config`    | A (sections list)    | Reads/writes via existing `core/config.ts`     |
| Onboarding    | `onboard`   | A                    | Shown when `~/.forge` doesn't exist yet        |
| Loading state | (per-screen)| A                    | Generic, parameterized by task list            |
| Empty state   | (per-list)  | A                    | Component, not a route                         |
| Error state   | (per-screen)| A                    | Error boundary fallback                        |

Overlays (rendered on top of the current route):
- **Command Palette** — `⌘K` / `Ctrl-K`
- **Help** — `?`

---

## 6. Keybindings (canonical)

Single source of truth lives in `useGlobalKeys.ts`. Per-screen handlers register
additional bindings via a `useScreenKeys(map)` hook.

### Global
| Key         | Action                              |
| ----------- | ----------------------------------- |
| `Ctrl-K`    | Open command palette                |
| `:`         | Open command palette in `:cmd` mode |
| `/`         | Start search input for current view |
| `?`         | Toggle help overlay                 |
| `Esc`       | Close overlay → back → exit         |
| `q`         | Quit (only if no overlay)           |
| `Tab` / `Shift-Tab` | Cycle pane focus            |
| `1`–`9`     | Jump to numbered tab                |

### Navigation
| Key      | Action                       |
| -------- | ---------------------------- |
| `j` `↓`  | Next item                    |
| `k` `↑`  | Previous item                |
| `h` `←`  | Previous pane                |
| `l` `→`  | Next pane                    |
| `g`      | Top of list                  |
| `G`      | Bottom of list               |
| `Enter`  | Open / activate selected     |

### Tab letters (consistent with status bar in designs)
| Key | Screen     |
| --- | ---------- |
| `D` | Dashboard  |
| `d` | Doctor     |
| `R` | Recipes    |
| `P` | Prompts    |
| `L` | Launch     |
| `C` | Config     |

### Action verbs (lowercase, screen-specific)
| Key | Action                                       |
| --- | -------------------------------------------- |
| `a` | Apply (fix / recipe)                         |
| `A` | Apply all auto                               |
| `s` | Skip                                         |
| `y` | Yank to clipboard (uses existing clipboardy) |
| `r` | Rerun / regenerate                           |
| `o` | Open file in `$EDITOR`                       |
| `e` | Explain / edit                               |
| `n` | New (prompt / report)                        |
| `x` | Delete                                       |

Capital vs lowercase preserved exactly as in design files.

---

## 7. Build phases

Five focused phases, each landable on its own.

### Phase 1 — Skeleton & primitives
**Deliverable:** `forge tui` launches, shows a stub Dashboard with project name,
exits on `q`. No interactivity beyond exit.

- `src/commands/tui/index.ts` — boots `render(<App/>)` from Ink
- `ThemeProvider` reading midnight/comfortable/blue from config
- `AppFrame`, `TopBar`, `StatusBar`, `Workspace`, `Pane`, `Tag`, `KeyValue`, `Kbd`
- `useGlobalKeys` (only `q` and `?` initially)
- `data/adapters.ts` — wraps `detectProjectContext` for the dashboard
- Tests: render primitives via `ink-testing-library`, assert frame strings

### Phase 2 — Routing + Dashboard
**Deliverable:** Dashboard (direction A) fully populated from real data.
Letter keys (`D R P L d C`) switch routes. Each non-Dashboard route renders
a placeholder "Coming soon" pane.

- `useRoute` — stack-based route history; `Esc` pops
- All Dashboard panes wired to real adapters:
  - Project pane → `detectProjectContext`
  - Doctor pane → `runRepoDoctor` summary
  - Launch pane → most recent saved report (from `launchcheck/reports.ts`)
  - Environment pane → `~/.forge` introspection
  - Recent prompts → `loadHistory`
  - Recipes → `listRecipes`
  - Warnings → top 2 doctor issues
- `Sparkline` primitive
- Tests: adapter shape, route reducer

### Phase 3 — Doctor + Launch + List navigation
**Deliverable:** Two interactive screens. `j/k` navigation in lists with diff
preview pane updating live. No mutations yet — apply/fix shows the diff but is
not wired to disk.

- `useListNav` hook
- `ListRow`, `SectionTitle`, `FilterChip`, `DiffBlock`, `Heat`, `ScoreBig`
- Doctor: grouped issue list (left) + diff preview (right)
- Launch: previous + delta + current three-column diff
- Tests: list nav bounds, diff renderer for `+`/`-`/`@` lines

### Phase 4 — Recipes + Prompts + Config + actions
**Deliverable:** All read-only screens work. Mutating actions wired up
(apply recipe, copy prompt, clear history, set config value). Editor open
via `$EDITOR`.

- Recipes screen with operations preview, `a` to apply
- Prompts screen reusing `promptkit/history` — `y` yanks via clipboardy
- Config screen with enum/bool/number editors
- `Overlay` primitive
- Tests: action handlers (mocked filesystem)

### Phase 5 — Overlays, onboarding, polish
**Deliverable:** Command palette, help overlay, onboarding flow.
Loading + empty + error states. Theme/density/accent live-switch via Config.

- `CommandPalette` overlay with fuzzy filter (`fzy`-style, no new dep — small
  in-tree matcher)
- `Help` overlay
- `Onboarding` (direction A) — only shown when `~/.forge` is missing
- `States/Loading.tsx`, `States/Empty.tsx`, `States/Error.tsx`
- Hot-swap theme/density/accent when changed via Config screen

---

## 8. What to implement first

Phase 1 plus the Dashboard route from Phase 2. Concretely, the very first
landable PR is:

1. `forge tui` command
2. `AppFrame` + `TopBar` + `StatusBar` + `Workspace` + `Pane` + `Tag` + `KeyValue`
3. `ThemeProvider` with midnight/comfortable/blue baked in
4. Dashboard direction A (cockpit) rendering project + doctor + launch + env
   panes with real data
5. `q` to quit, `?` for a stub help message

This gives a usable cockpit you can run in a real terminal and validate visually
against `screenshots/05-prototype-clean.png` before investing in the rest.

---

## 9. What to defer

- **Direction B variants** of every screen (hero dashboard, triage doctor,
  studio prompts, single-page config). Direction A is sufficient on launch.
- **ScoreRing** — replace with a large numeric score for now. Add the
  block-char ring approximation only if direction A feels visually flat.
- **Heatmap calendar** in prompts (last-4-weeks grid). Skip until Phase 5.
- **Mouse support**. Ink supports it but the design is keyboard-first;
  resist adding mouse for v1.
- **Animated transitions**. Ship without; only the spinner animates.
- **Live URL fetches** triggered from the TUI. The Launch screen reads saved
  reports; running a new check stays on the CLI (`forge launch --save`).
- **Theme picker UI** — exposed as raw config values in Phase 4. A dedicated
  picker screen is post-v1.

---

## 10. Limitations of Ink vs the browser prototype

| Browser feature                | Ink reality                                                                 |
| ------------------------------ | --------------------------------------------------------------------------- |
| Pixel measurements             | Cells only. Layouts must be expressed in flex ratios or whole-cell widths.  |
| `background-color` on regions  | Per-character only. Large filled regions render line-by-line at best.       |
| Border radius / shadows        | Not supported — use border styles (`single`, `round`, `double`).            |
| Gradients                      | Not supported.                                                              |
| SVG (ScoreRing)                | Not supported. Use big text or block-char approximation.                    |
| Blur / brightness filters      | Not supported. Use `dimColor` on every text node behind overlays.           |
| Mouse hover / `cursor: pointer`| Not applicable. All interactions via keyboard.                              |
| CSS animation                  | Not supported. `ink-spinner` for the one allowed animation.                 |
| Per-pixel positioning          | `position: 'absolute'` does not exist. Overlays are full-screen flex boxes. |
| HTML font choice               | Inherits the user's terminal font; we don't pick.                           |
| `letterSpacing`                | Ignored.                                                                    |
| `text-overflow: ellipsis`      | Manual: truncate strings to fit the available cell count.                   |
| Embedded HTML (`<pre>`)        | Use raw `<Text>` with newlines. No `white-space` control beyond Ink's wrap. |

Implication: the TUI will feel **calmer and flatter** than the browser
prototype, but the information hierarchy and keyboard model should match.

---

## 11. Data adapters

`data/adapters.ts` is the boundary between the existing Forge modules and the
TUI view-models. Each screen receives a fully resolved view-model (no async in
render). The adapter layer is what allows the TUI to be tested with fixtures and
to never call `any`.

| View-model              | Source                                              |
| ----------------------- | --------------------------------------------------- |
| `DashboardData`         | `detectProjectContext` + summary calls below        |
| `DoctorViewModel`       | `runRepoDoctor` (existing)                          |
| `LaunchViewModel`       | `listReports` + `diffReports` (added previously)    |
| `RecipeViewModel`       | `listRecipes` from `stackpack`                      |
| `PromptHistoryViewModel`| `loadHistory` from `promptkit/history`              |
| `ConfigViewModel`       | `readForgeConfig` + schema                          |

Each adapter returns a strictly typed object — no `any`, no `unknown` past the
adapter boundary.

---

## 12. Testing strategy

- **`ink-testing-library`** for component render snapshots. Each primitive gets
  one test asserting the rendered string contains the expected glyphs / colors.
- **Pure logic tests** (no Ink) for `useListNav`, `useRoute`, palette filter,
  adapters. These cover most of the interesting behavior.
- **No e2e TTY tests** — too brittle. Manual smoke runs in real terminals
  (Windows Terminal, iTerm, Alacritty) at the end of each phase.

---

## 13. Open questions to resolve before Phase 1

1. **Minimum terminal size** — assume 100×30 cells? Below that, render a
   "terminal too small, resize to ≥100×30" message instead of degrading.
2. **Config persistence of TUI prefs** — extend `ForgeConfigSchema` with
   `tui: { theme, density, accent, iconSet }` or keep them in a sibling
   `tui.json`. Sibling is simpler and avoids polluting the public config.
3. **Should `forge tui` accept a starting route?** e.g. `forge tui doctor`.
   Recommend yes — `--screen <name>` flag, defaulting to `dash`.

These are tracked but don't block starting Phase 1.

---

## 14. File-by-file mapping from design to Ink

| Design file                          | Becomes                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `tui-tokens.jsx`                     | `modules/tui/theme/tokens.ts` + `theme/glyphs.ts`                              |
| `tui-components.jsx`                 | `modules/tui/primitives/*.tsx`                                                 |
| `tui-data.jsx`                       | replaced by `modules/tui/data/adapters.ts` (real data, not fixtures)           |
| `tui-screen-dashboard.jsx`           | `modules/tui/screens/Dashboard.tsx`                                            |
| `tui-screen-doctor.jsx`              | `modules/tui/screens/Doctor.tsx`                                               |
| `tui-screen-launch.jsx`              | `modules/tui/screens/Launch.tsx`                                               |
| `tui-screen-recipes.jsx`             | `modules/tui/screens/Recipes.tsx`                                              |
| `tui-screen-prompts.jsx`             | `modules/tui/screens/Prompts.tsx`                                              |
| `tui-screen-config.jsx`              | `modules/tui/screens/Config.tsx`                                               |
| `tui-screen-extras.jsx`              | `modules/tui/overlays/CommandPalette.tsx`, `overlays/Help.tsx`, `screens/Onboarding.tsx`, `screens/States/*` |
| `tweaks-panel.jsx`                   | dropped (designer-only tooling)                                                |
| `canvas-app.jsx` / `canvas-system.jsx` / `design-canvas.jsx` | dropped (browser scaffolding)                            |
| `*.html`                             | dropped (browser entry points)                                                 |
| `screenshots/*.png`                  | retained as visual reference for QA                                            |

---

## 15. Definition of done for the TUI

- `forge tui` runs at ≥30 fps on a typical terminal (no perceived lag while
  scrolling lists)
- All six tab letters route correctly
- Every screen has a working `Esc` back path
- No `any` types in `src/modules/tui/` or `src/commands/tui/`
- All files use `.js` import extensions (ESM rule already enforced in this repo)
- Tests pass + `npm run typecheck` + `npm run build` + `npm run validate:assets`
- README adds a short `forge tui` section

This is the end state. Implementation starts at Phase 1.
