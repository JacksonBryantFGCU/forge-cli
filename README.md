# Forge

A personal developer CLI suite for project scaffolding, repo checks, prompt
generation, reusable recipes, component scaffolding, launch checks, and project
dashboards.

Forge is opinionated for the stack I use most: TypeScript, React + Vite +
Tailwind, Express APIs, and Vercel/Supabase. It is local-first — recipes and
config live in `~/.forge`, and everything is generated from editable templates
under `src/templates/`.

## Install / local dev

```bash
git clone <this-repo> forge
cd forge
npm install
npm run build
npm link            # exposes `forge` globally
```

Day-to-day:

```bash
npm run dev          # run via tsx without building
npm run typecheck    # tsc --noEmit
npm run test         # vitest
npm run build        # validate assets, bundle, copy templates
npm run validate:assets   # schema/template sanity check
```

After `npm link`, the `forge` command is available globally and resolves
templates out of `dist/templates/` (or `src/templates/` during development).

## Commands

| Command | Purpose |
| --- | --- |
| `forge doctor` | Scan the project for setup, config, and deployment issues |
| `forge prompt` | Generate structured Claude Code prompts |
| `forge component` | Scaffold a React component, page, hook, form, layout, section, modal, or card |
| `forge new` | Create a new project from a template |
| `forge pack` | Manage reusable recipes stored in `~/.forge/recipes/` |
| `forge launch` | Run a pre-launch checklist (build, env, SEO, assets) |
| `forge dash` | Terminal dashboard summarizing the current project |
| `forge config` | Read/write Forge user configuration |
| `forge template` | Inspect bundled templates and override them in `~/.forge/templates/` |

Run `forge <command> --help` for full flag and example listings.

## Examples

### forge doctor

```bash
forge doctor
forge doctor --fix
forge doctor --json
forge doctor --category deployment
forge doctor --rule missing-env-example
```

### forge prompt

```bash
forge prompt feature "add Supabase auth"
forge prompt debug "Vercel refresh gives 404"
forge prompt refactor "split large React component" --mode plan
forge prompt audit "check Express security" --mode review
forge prompt cleanup "remove Stripe after Square migration" --mode plan
forge prompt deploy "ship to Vercel" --mode plan
forge prompt feature "add settings page" --copy
```

### forge component

```bash
forge component Navbar
forge component Contact --type page
forge component useContactForm --type hook
forge component ContactForm --type form --with-types --with-test
forge component Hero --type section --with-motion
forge component ConfirmModal --type modal
forge component Banner --path src/marketing --force --dry-run
```

### forge new

```bash
forge new my-app --template react-vite-tailwind
forge new api --template express-api
forge new contractor-site --template client-static-site
forge new lab --template react-vite --dry-run
forge new client-site --template client-static-site --install
```

### forge pack

```bash
forge pack init-defaults
forge pack list
forge pack search vercel
forge pack show vite-vercel-spa-rewrite
forge pack use vite-vercel-spa-rewrite --dry-run
forge pack use vite-vercel-spa-rewrite --force
forge pack save my-recipe --description "Setup snippet" --tags vite,react
forge pack delete my-recipe
```

### forge launch

```bash
forge launch
forge launch --skip-build
forge launch --strict
forge launch --json
forge launch --url https://example.com
```

### forge dash

```bash
forge dash
forge dash --with-launch
forge dash --with-launch --with-build
forge dash --json
```

### forge template

```bash
forge template path
forge template list
forge template open prompts feature.md.eta
forge template open projects react-vite-tailwind
forge template open components component.tsx.eta
```

## Template system

Forge ships four kinds of editable assets under `src/templates/`:

- `src/templates/projects/` — project scaffolds (one folder per template)
- `src/templates/components/` — component/hook/page/form scaffolds (Eta)
- `src/templates/prompts/` — Claude Code prompt templates (Eta)
- `src/templates/recipes/` — default recipe JSON files

Templates render through Eta. The loader resolves the templates directory by
walking up from the loader's own location and preferring `dist/templates/`
(after build) over `src/templates/` (during dev with `tsx`).

Any file under `~/.forge/templates/<category>/...` overrides its bundled
counterpart. Use `forge template list` to see what is bundled vs overridden,
and `forge template open <category> <name>` to seed an editable copy in the
user store.

The `build` script copies `src/templates/` → `dist/templates/` automatically
(see `scripts/copy-templates.mjs`) so installed/linked copies of Forge still
find their assets.

See [docs/TEMPLATES.md](docs/TEMPLATES.md) for the full layout, Eta variable
reference, and how to add a new template.

## Recipe system

Recipes are small, reusable "drop this in" snippets stored as JSON in
`~/.forge/recipes/`. Each recipe lists one or more files to write into the
current project with a `create`, `overwrite`, or `append` operation.

```bash
forge pack init-defaults    # copies built-in recipes into ~/.forge/recipes/
forge pack list
forge pack show vite-vercel-spa-rewrite
forge pack use vite-vercel-spa-rewrite --dry-run
```

Default recipes shipped with Forge:

- `vite-vercel-spa-rewrite`
- `express-secure-baseline`
- `supabase-client-react`
- `github-actions-vite`
- `playwright-basic-config`
- `env-example-baseline`
- `react-router-baseline`

See [docs/RECIPES.md](docs/RECIPES.md) for the schema, file-operation
semantics, and how to author your own.

## Local data

Forge writes user data under `~/.forge/`:

```
~/.forge/
  config.json         # user-level CLI config (forge config)
  recipes/*.json      # saved recipes (custom + defaults)
  prompts/            # reserved for future prompt presets
  templates/          # user template overrides (components/projects/prompts/recipes)
```

`forge pack init-defaults` is the one-time bootstrap that copies the bundled
default recipes into `~/.forge/recipes/`. You can edit, override (with
`--force`), or `forge pack delete` any of them after that.

## License

MIT.
