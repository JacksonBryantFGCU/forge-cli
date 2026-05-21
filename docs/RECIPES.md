# Recipes

A recipe is a small, reusable bundle of files that can be applied to any
project. Recipes live as JSON in two places:

- **Bundled defaults:** `src/templates/recipes/*.json` (shipped with Forge)
- **User store:** `~/.forge/recipes/*.json` (managed by `forge pack`)

`forge pack init-defaults` copies the bundled defaults into the user store so
they are available everywhere.

## Schema

Recipes are validated against `RecipeSchema` from `src/schemas/recipe.schema.ts`:

```ts
RecipeSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-_]*$/),
  name: z.string().min(1),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  files: z.array(RecipeFileSchema).default([]),
  notes: z.string().optional(),
});

RecipeFileSchema = z.object({
  path: z.string(),
  operation: z.enum(["create", "overwrite", "append"]),
  content: z.string(),
});
```

| Field | Notes |
| --- | --- |
| `id` | Lowercase slug. Must match the filename: `<id>.json`. |
| `name` | Human-readable title shown by `forge pack list/show`. |
| `description` | One-line summary used by search and listings. |
| `tags` | Free-form tags; `forge pack search` matches against these. |
| `files` | Each entry describes a single file to write. |
| `notes` | Optional. Printed by `forge pack show`. Use it for install hints. |

## File operations

Every `files[]` entry has an `operation`. Behavior when `forge pack use <id>`
is run:

| Operation | If target missing | If target exists |
| --- | --- | --- |
| `create` | write the file | skip (or write with `--force`) |
| `overwrite` | write the file | refuse without `--force` (preview with `--dry-run`) |
| `append` | create with the given content | append to the existing file (newline-aware) |

`--dry-run` previews every operation without touching disk.

## Default recipes

Shipped with Forge and seeded by `forge pack init-defaults`:

| Recipe | What it adds |
| --- | --- |
| `vite-vercel-spa-rewrite` | `vercel.json` SPA fallback for React Router refresh 404s |
| `express-secure-baseline` | helmet + JSON body limit + explicit CORS allowlist middleware |
| `supabase-client-react` | Singleton Supabase client + `.env.example` append |
| `github-actions-vite` | CI workflow that installs, typechecks, and builds |
| `playwright-basic-config` | Playwright config + a smoke test |
| `env-example-baseline` | Starter `.env.example` for common app vars |
| `react-router-baseline` | `BrowserRouter` with Home/About route pair |

`init-defaults` skips recipes that already exist in `~/.forge/recipes/`. Pass
`--force` to overwrite them with the latest bundled versions.

## Authoring a custom recipe

1. Save a starter:

   ```bash
   forge pack save my-recipe --description "..." --tags react,vite
   ```

   This writes `~/.forge/recipes/my-recipe.json` with a placeholder file.

2. Open the file and replace `files[]` with the real content:

   ```json
   {
     "id": "my-recipe",
     "name": "My Recipe",
     "description": "...",
     "tags": ["..."],
     "files": [
       {
         "path": "src/lib/config.ts",
         "operation": "create",
         "content": "export const config = {};\n"
       }
     ]
   }
   ```

3. Apply it from any project:

   ```bash
   forge pack use my-recipe --dry-run
   forge pack use my-recipe
   ```

Forge re-validates the JSON with `RecipeSchema` every time it is loaded, so a
malformed recipe surfaces a clear error instead of writing partial output.

## Adding a recipe to the bundled defaults

1. Drop a `<id>.json` file into `src/templates/recipes/`.
2. Add the id to `DEFAULT_RECIPE_IDS` in
   `src/modules/stackpack/default-recipes.ts`.
3. Run `npm run validate:assets` to confirm the manifest parses.
4. Mention the new recipe in [README.md](../README.md) and this file.
