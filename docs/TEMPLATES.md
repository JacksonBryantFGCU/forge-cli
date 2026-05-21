# Templates

All Forge code generation runs through editable templates under
`src/templates/`. There are four flavors:

```
src/templates/
  components/   # React/TS scaffolds for forge component
  projects/     # full project scaffolds for forge new
  prompts/      # Claude Code prompts for forge prompt
  recipes/      # default recipes for forge pack init-defaults
```

Rendering uses [Eta](https://eta.js.org/). The loader (`src/core/template-loader.ts`)
walks up from its own location at runtime, preferring `dist/templates/` after
build and falling back to `src/templates/` during `tsx` dev. The build step
copies `src/templates/` into `dist/templates/` via
`scripts/copy-templates.mjs`.

## User overrides

You can override any bundled template with a file under
`~/.forge/templates/`. The loader checks the user store first and falls back
to the bundled location only when no user file exists.

**Resolution order for every template lookup:**

1. `~/.forge/templates/<category>/<...>` (user override)
2. `dist/templates/<category>/<...>` (shipped with the installed CLI)
3. `src/templates/<category>/<...>` (only during `tsx` dev)

This applies to all four categories — `components`, `projects`, `prompts`,
`recipes` — and to every individual file inside a category, so you can override
a single prompt or a single template file inside a project scaffold without
forking the whole template.

Manage overrides with the `forge template` command:

```bash
forge template path                                     # print ~/.forge/templates
forge template list                                     # show bundled/overridden/user-only entries
forge template open prompts feature.md.eta             # seed the user copy from the bundle, print its path
forge template open projects react-vite-tailwind        # works on whole project folders too
```

`forge template open` copies the bundled file (or directory, for projects)
into the user store the first time it is called, so you immediately have
something to edit. Subsequent calls just print the path.

**Tips for safe customization:**

- Always run `forge template open <category> <name>` first — never hand-create
  user paths. It mirrors the bundled layout so the loader can find your file.
- For project templates, the `template` field inside `template.json`
  references files relative to the project folder. If your user override
  references files that don't exist in the bundled project either, generation
  will fail with a "template not found" error.
- Keep the Eta variable names identical to the bundled version; the rendering
  module passes a fixed set of variables (see the per-category tables below).
- To go back to the bundled version, just delete the user file or folder.

### Example: override a component template

Replace the default `component.tsx.eta` with one that adds a `data-testid`
attribute on every generated component:

```bash
forge template open components component.tsx.eta
# prints: ~/.forge/templates/components/component.tsx.eta
```

Open that file and edit the JSX (Eta vars stay the same — `name`, `exportName`,
`useMotion`, `hasTypes`, etc.):

```eta
<%= exportPrefix %> <%= exportName %>({ className }: <%= hasTypes ? name + "Props" : "{ className?: string }" %>) {
  return (
    <section data-testid="<%= name %>" className={["p-4", className].filter(Boolean).join(" ")}>
      <h2 className="text-xl font-semibold"><%= name %></h2>
    </section>
  );
}
```

Now every `forge component <Name>` writes the customized version. Run
`forge template list` to confirm it shows up as `overridden`. Delete the user
file to revert.

### Example: override a prompt template

Tighten the debug prompt's constraints for your workflow:

```bash
forge template open prompts debug.md.eta
```

Edit the constraints list inside the user copy — for example, add
`- Always reproduce in a failing test before changing production code.` to the
`## Constraints` block. The next `forge prompt debug "..."` invocation will
render with your override.

## Eta basics

Forge configures Eta with `useWith: true`, `autoEscape: false`, and
`autoTrim: false`, so:

- Variables are referenced directly by name (`<%= projectName %>`)
- HTML entities are NOT escaped — output is raw text
- Newlines after tags are NOT trimmed (important for bulleted output)

Common syntax:

```eta
<%= variable %>                <!-- output a value -->
<% if (cond) { %>...<% } %>    <!-- conditional block -->
<% for (const x of list) { %>- <%= x %>
<% } %>                        <!-- loop -->
```

## Project templates

Layout: one folder per template under `src/templates/projects/<id>/`.

Each folder contains:

- `template.json` — manifest validated against `ProjectTemplateSchema`
- One `.eta` source file per generated file

`template.json` shape:

```json
{
  "id": "react-vite-tailwind",
  "name": "React + Vite + Tailwind",
  "description": "...",
  "tags": ["react", "vite", "typescript", "tailwind"],
  "files": [
    { "path": "package.json",  "template": "package.json.eta" },
    { "path": "src/App.tsx",   "template": "src/App.tsx.eta"  }
  ]
}
```

- `path` — where the file is written in the generated project, relative to the
  project root
- `template` — the `.eta` source file, relative to the template folder
- `operation` — `create` (default) or `overwrite`

Available Eta variable:

| Variable | Value |
| --- | --- |
| `projectName` | sanitized project name passed to `forge new` |

To add a new project template:

1. Create `src/templates/projects/<id>/template.json` and the matching `.eta`
   files. The manifest `id` must match the folder name.
2. Add the id to `TEMPLATE_NAMES` in `src/modules/devforge/types.ts`.
3. Run `npm run validate:assets`.
4. Smoke-test with `forge new <name> --template <id> --dry-run`.

## Component templates

Flat layout under `src/templates/components/`:

```
component.tsx.eta, page.tsx.eta, hook.ts.eta, form.tsx.eta,
layout.tsx.eta, section.tsx.eta, modal.tsx.eta, card.tsx.eta,
index.ts.eta, test.tsx.eta, types.ts.eta
```

Variables passed by `compforge`:

| Variable | Type | Notes |
| --- | --- | --- |
| `name` | string | PascalCase component name (or hook name) |
| `exportName` | string | Currently identical to `name` |
| `type` | string | `component`, `page`, `hook`, etc. |
| `useMotion` | boolean | True when `--with-motion` is passed |
| `hasTypes` | boolean | True when `--with-types` is passed |

To add a new component type:

1. Add the type to `COMPONENT_TYPES` in `src/modules/compforge/index.ts`.
2. Add a corresponding `<type>.tsx.eta` file in `src/templates/components/`.
3. Add it to `COMPONENT_TEMPLATE_FILE` map in the same module.
4. Update routing in `resolveTargetDir` if it needs a custom path.

## Prompt templates

One Eta file per prompt type under `src/templates/prompts/`:

```
feature.md.eta, debug.md.eta, refactor.md.eta, audit.md.eta,
test.md.eta, cleanup.md.eta, deploy.md.eta, review.md.eta
```

Variables passed by `promptkit`:

| Variable | Type |
| --- | --- |
| `task` | string |
| `mode` | `"plan" \| "implement" \| "review"` |
| `framework` | string |
| `language` | string |
| `packageManager` | string |
| `hasTailwind` | boolean |
| `hasReactRouter` | boolean |
| `scripts` | string (comma-joined or `"none"`) |
| `constraints` | `string[]` (extra pass-through constraints) |
| `modeInstructions` | string (precomputed sentence for the mode) |

To add a new prompt type:

1. Add the type to `PROMPT_TYPES` in `src/modules/promptkit/types.ts`.
2. Add `<type>.md.eta` to `src/templates/prompts/`.
3. Add it to `TEMPLATE_FILES` map in `src/modules/promptkit/index.ts`.
4. Add the file to the required-template list in `scripts/validate-assets.ts`.

## Recipe templates

Recipes are pure JSON, not Eta. See [RECIPES.md](RECIPES.md) for details.

## Validation

`npm run validate:assets` (run automatically by `npm run build`) checks that:

- Every `projects/<id>/template.json` parses against `ProjectTemplateSchema`
  and references files that actually exist on disk.
- Every `recipes/*.json` parses against `RecipeSchema` and lives in
  `<id>.json`.
- All required prompt and component template files exist.

If anything is missing or invalid, the script prints a precise per-issue error
and exits with code 1.
