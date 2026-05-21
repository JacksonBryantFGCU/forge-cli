# Changelog

All notable changes to Forge are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-05-21

The initial stable baseline. Nine commands, four template categories, a
validated recipe store, configurable defaults, user-level template overrides,
real launch validation, an asset validator, and a test suite.

### Commands

- `forge doctor` — modular rule engine (9 rules across 6 categories). Auto-fixes
  for `vercel-spa-rewrite`, `missing-env-example`, `missing-viewport-meta`,
  `missing-meta-description`, `missing-open-graph-tags`, `missing-build-script`
  (framework-aware), `missing-lint-script` (only with ESLint), and the two
  Express security rules (`helmet`, `express.json({ limit })`). Supports
  `--fix`, `--fix --dry-run`, `--category`, `--rule`, `--json`.
- `forge prompt` — eight prompt types (`feature`, `debug`, `refactor`, `audit`,
  `test`, `cleanup`, `deploy`, `review`) rendered from Eta templates with
  detected project context. `--mode` defaults to the configured
  `defaultPromptMode`. `--copy` works when `clipboardy` is installed,
  warns gracefully otherwise.
- `forge component` — generates `component | page | hook | form | layout |
  section | modal | card` from Eta templates. Flags: `--type`, `--dry-run`,
  `--with-test`, `--with-types`, `--with-motion`, `--path`, `--force`. Honors
  `componentStyle` (named / default exports) and `testFramework` (vitest /
  jest / none) from config.
- `forge new` — four project templates: `react-vite`, `react-vite-tailwind`,
  `express-api`, `client-static-site`. JSON manifest validated against
  `ProjectTemplateSchema`. `--dry-run`, `--install`. Install + "Next steps"
  honor `preferredPackageManager`.
- `forge pack` — recipe manager with `list | search | show | save | use |
  init-defaults | delete`. `create | overwrite | append` file operations.
  Seven built-in recipes (`vite-vercel-spa-rewrite`,
  `express-secure-baseline`, `supabase-client-react`, `github-actions-vite`,
  `playwright-basic-config`, `env-example-baseline`, `react-router-baseline`).
- `forge launch` — local checks (package, env, vercel, metadata, images,
  links, build) plus live URL validation when `--url` is passed (status,
  content-type, title, viewport, description, OG, canonical, cache-control,
  compression, TTFB, localhost references, test-key references). Flags:
  `--skip-build`, `--strict`, `--live-only`, `--json`.
- `forge dash` — terminal project summary. Optional `--with-launch` (with
  `--with-build` to include the real production build).
- `forge config` — `path | list | get | set | reset` over
  `~/.forge/config.json`. Four supported keys, all schema-validated:
  `preferredPackageManager`, `defaultPromptMode`, `componentStyle`,
  `testFramework`.
- `forge template` — `path | list | open` for inspecting and overriding
  bundled templates via `~/.forge/templates/`.

### Templates

- Four categories under `src/templates/`: `components/`, `projects/`,
  `prompts/`, `recipes/`.
- Eta-rendered with `useWith`, `autoEscape: false`, `autoTrim: false`.
- Resolution order: `~/.forge/templates/` → `dist/templates/` →
  `src/templates/`. Per-file override granularity.
- `scripts/copy-templates.mjs` syncs `src/templates/` → `dist/templates/` on
  every build.

### Schemas

- `ForgeConfigSchema`, `ProjectTemplateSchema`, `ComponentTemplateSchema`,
  `RecipeSchema`, `PromptTemplateSchema`, `DoctorIssueSchema` — all in
  `src/schemas/` and re-exported from `src/schemas/index.ts`.

### Asset validation

- `scripts/validate-assets.ts` runs as part of `npm run build` and verifies:
  every project manifest parses + references real files, every recipe JSON
  parses, every required prompt and component template exists. Currently
  83 checks.

### Tests

- 90 tests across 13 files (Vitest). Covers `core/fs`, `core/package-manager`,
  `core/project-detector`, `core/template-loader`, `repo-doctor` rules + fixes,
  `promptkit`, `compforge`, `stackpack`, `config-manager`, `template-manager`,
  and live launch validation (with mocked fetch).

### Local data

```
~/.forge/
  config.json    # forge config
  recipes/       # forge pack
  templates/     # forge template overrides
  prompts/       # reserved
```

### Known limitations

- `--copy` on `forge prompt` requires installing `clipboardy` manually (not a
  Forge dependency).
- Live launch validation uses native `fetch` and lightweight regex parsing —
  no full Lighthouse integration.
- The `express-wildcard-cors` doctor rule does not auto-fix (CORS allowlists
  require explicit origins from the user).
