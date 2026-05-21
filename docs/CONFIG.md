# Configuration

Forge stores user-level settings at `~/.forge/config.json`. The file is
validated by `ForgeConfigSchema` every time it is loaded, so invalid values
are rejected before they can affect a generation.

Manage the file through the `forge config` command — don't hand-edit unless
you know what you're doing.

## Subcommands

```bash
forge config path           # print ~/.forge/config.json
forge config list           # show all four keys and their current values
forge config get <key>      # print one value
forge config set <key> <v>  # validate + persist a new value
forge config reset          # rewrite the file with schema defaults
```

Examples:

```bash
forge config list
# preferredPackageManager = npm
# defaultPromptMode = plan
# componentStyle = named-export
# testFramework = vitest

forge config set preferredPackageManager pnpm
forge config set defaultPromptMode implement
forge config set componentStyle default-export
forge config set testFramework jest
forge config reset
```

Unknown keys and invalid enum values both fail with a clean error and a
non-zero exit code:

```bash
forge config set nope x
#  »   Error: Unknown config key: nope. Supported: preferredPackageManager, ...

forge config set preferredPackageManager bogus
#  »   Error: Invalid value for preferredPackageManager: Invalid option: expected one of "npm"|"pnpm"|"yarn"|"bun"
```

## Supported keys

| Key | Type | Default | Affects |
| --- | --- | --- | --- |
| `preferredPackageManager` | `npm \| pnpm \| yarn \| bun` | `npm` | `forge new` install command + "Next steps" output |
| `defaultPromptMode` | `plan \| implement \| review` | `plan` | `forge prompt <type> <task>` when `--mode` is omitted |
| `componentStyle` | `named-export \| default-export` | `named-export` | `forge component` — switches the `export` keyword and the `index.ts` re-export |
| `testFramework` | `vitest \| jest \| none` | `vitest` | `forge component --with-test` — picks the import line, or skips test generation entirely when `none` |

### preferredPackageManager

Used by `forge new` to:

- Spawn the right install command when `--install` is passed
  (`npm install` / `pnpm install` / `yarn install` / `bun install`).
- Print accurate "Next steps" lines after generation
  (`pnpm install` + `pnpm dev`, for example).

```bash
forge config set preferredPackageManager pnpm
forge new my-app --template react-vite-tailwind
# Next steps:
# cd my-app
# pnpm install
# pnpm dev
```

### defaultPromptMode

`forge prompt` accepts `--mode plan|implement|review`. When `--mode` is
omitted, the command falls back to this value. The mode controls the
"## Mode" sentence in the rendered prompt and is passed to every template as
`<%= mode %>` / `<%= modeInstructions %>`.

```bash
forge config set defaultPromptMode implement
forge prompt feature "add auth"
# → "# Implement a new feature (implement mode)" …
```

### componentStyle

Switches `forge component` between:

- `named-export` → `export function <Name>(...)` + `export { <Name> } from "./<Name>.js"`
- `default-export` → `export default function <Name>(...)` + `export { default as <Name> } from "./<Name>.js"`

Hooks are always named exports regardless of this setting (hooks rely on
named imports by convention).

```bash
forge config set componentStyle default-export
forge component Card --type card
# src/components/Card/Card.tsx → "export default function Card..."
# src/components/Card/index.ts → "export { default as Card } from \"./Card.js\";"
```

### testFramework

Controls what the generated `<Name>.test.tsx` (or `.test.ts` for hooks)
imports:

- `vitest` → `import { describe, expect, it } from "vitest";`
- `jest` → `import { describe, expect, it } from "@jest/globals";`
- `none` → no test file is generated. `forge component --with-test` still
  succeeds, but emits a warning explaining the setting and how to re-enable it.

```bash
forge config set testFramework jest
forge component Hero --type section --with-test
# Hero.test.tsx → "import { describe, expect, it } from \"@jest/globals\";"

forge config set testFramework none
forge component Hero --type section --with-test
# ! testFramework is set to 'none' in forge config — skipping test file generation.
```

## File location

The path comes from `getForgeHomeDir()` (which honors `HOME` /
`USERPROFILE`), so the config file lives at:

- macOS / Linux: `~/.forge/config.json`
- Windows: `C:\Users\<you>\.forge\config.json`

Run `forge config path` to print the exact path on your machine.

## Notes for contributors

- The schema lives at `src/schemas/forge-config.schema.ts` and is re-exported
  from `src/core/config.ts`.
- `setConfigValue` in `src/modules/config-manager/` validates with
  `ForgeConfigSchema.safeParse` before writing — adding a new key means
  extending the schema and (usually) wiring a consumer module.
- Tests in `tests/modules/config-manager.test.ts` and
  `tests/modules/config-consumers.test.ts` cover the read/write loop and the
  three consumer modules (`promptkit`, `compforge`, `devforge`).
