import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Pane } from "../components/Pane.js";
import { Tag } from "../components/Tag.js";
import { ListRow } from "../components/ListRow.js";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";
import type { AppState } from "../state.js";
import { listRecipes } from "../../modules/stackpack/recipe-store.js";
import {
  applyRecipe,
  previewRecipe,
} from "../../modules/stackpack/apply-helpers.js";
import type {
  Recipe,
  RecipeFileOperation,
} from "../../modules/stackpack/types.js";
import {
  clampIndex,
  filterRecipes,
  formatOperationCounts,
  summarizeOperations,
} from "./recipe-helpers.js";

type Mode = "browse" | "search" | "confirm-apply";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; recipes: Recipe[] }
  | { kind: "running"; message: string }
  | { kind: "error"; message: string };

type RecipesScreenProps = {
  appState: AppState;
};

const WINDOW_SIZE = 14;

const OPERATION_COLOR: Record<RecipeFileOperation, string> = {
  create: theme.success,
  overwrite: theme.warning,
  append: theme.secondary,
};

export function RecipesScreen({
  appState,
}: RecipesScreenProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [mode, setMode] = useState<Mode>("browse");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<string[]>([]);

  const reload = useCallback(async (): Promise<void> => {
    setState({ kind: "loading" });
    setFeedback(null);
    setFeedbackItems([]);
    try {
      const recipes = await listRecipes();
      setState({ kind: "ready", recipes });
      setSelectedIndex(0);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    appState.setInputCaptured(mode === "search");
    return (): void => {
      appState.setInputCaptured(false);
    };
  }, [mode, appState]);

  const recipes = state.kind === "ready" ? state.recipes : [];
  const filtered = useMemo(
    () => filterRecipes(recipes, search),
    [recipes, search],
  );
  const safeIndex = clampIndex(selectedIndex, filtered.length);
  const selected: Recipe | null = filtered[safeIndex] ?? null;

  const handlePreview = useCallback(async (): Promise<void> => {
    if (!selected) {
      setFeedback("No recipe selected.");
      return;
    }
    const target = selected;
    setState({ kind: "running", message: `Previewing ${target.id} …` });
    setFeedback(null);
    setFeedbackItems([]);
    try {
      const result = await previewRecipe(process.cwd(), target.id);
      setFeedback(result.message);
      setFeedbackItems(result.items);
    } catch (err) {
      setFeedback(
        `Preview failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setState({ kind: "ready", recipes });
    }
  }, [selected, recipes]);

  const handleApply = useCallback(async (): Promise<void> => {
    if (!selected) {
      setFeedback("No recipe selected.");
      setMode("browse");
      return;
    }
    const target = selected;
    setMode("browse");
    setState({ kind: "running", message: `Applying ${target.id} …` });
    setFeedback(null);
    setFeedbackItems([]);
    try {
      const result = await applyRecipe(process.cwd(), target.id);
      setFeedback(result.message);
      setFeedbackItems(result.items);
    } catch (err) {
      setFeedback(
        `Apply failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setState({ kind: "ready", recipes });
    }
  }, [selected, recipes]);

  useInput((input, key) => {
    if (state.kind !== "ready") return;

    if (mode === "search") {
      if (key.escape) {
        setSearch("");
        setMode("browse");
        return;
      }
      if (key.return) {
        setMode("browse");
        return;
      }
      if (key.backspace || key.delete) {
        setSearch((s) => s.slice(0, -1));
        return;
      }
      if (input && input.length > 0 && !key.ctrl && !key.meta) {
        setSearch((s) => s + input);
      }
      return;
    }

    if (mode === "confirm-apply") {
      if (input === "y") {
        void handleApply();
      } else if (input === "n" || key.escape) {
        setMode("browse");
        setFeedback(null);
      }
      return;
    }

    // browse mode
    if (key.escape) {
      if (search.length > 0) {
        setSearch("");
      } else {
        appState.setRoute("dashboard");
      }
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => clampIndex(i + 1, filtered.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => clampIndex(i - 1, filtered.length));
      return;
    }
    if (input === "/") {
      setMode("search");
      setFeedback(null);
      return;
    }
    if (input === "r") {
      void reload();
      return;
    }
    if (input === "p" || key.return) {
      void handlePreview();
      return;
    }
    if (input === "a") {
      if (!selected) {
        setFeedback("No recipe selected.");
        return;
      }
      setMode("confirm-apply");
    }
  });

  if (state.kind === "loading") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Recipes" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}>
              {" "}
              loading recipes from ~/.forge/recipes …
            </Text>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (state.kind === "running") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Recipes" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}> {state.message}</Text>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (state.kind === "error") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Recipes" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="column">
            <Text color={theme.danger} bold>
              {glyph("warn")} Could not load recipes
            </Text>
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>{state.message}</Text>
            </Box>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (recipes.length === 0) {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Recipes" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="column">
            <Text color={theme.text} bold>
              {glyph("pkg")} No recipes installed
            </Text>
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>
                Initialize the default recipe library with:
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color={theme.text} backgroundColor={theme.elevated}>
                {" forge pack init-defaults "}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color={theme.textMuted}>
                Then press r to refresh, or 1 to return to the dashboard.
              </Text>
            </Box>
          </Box>
        </Pane>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Box flexDirection="row" gap={1} flexGrow={1}>
        <RecipeListPane
          recipes={filtered}
          totalRecipes={recipes.length}
          selectedIndex={safeIndex}
          search={search}
          mode={mode}
        />
        <RecipeDetailPane recipe={selected} />
      </Box>
      <ActionFooter
        mode={mode}
        feedback={feedback}
        feedbackItems={feedbackItems}
        totalShown={filtered.length}
        totalAll={recipes.length}
        selectedId={selected?.id ?? null}
      />
    </Box>
  );
}

function RecipeListPane({
  recipes,
  totalRecipes,
  selectedIndex,
  search,
  mode,
}: {
  recipes: Recipe[];
  totalRecipes: number;
  selectedIndex: number;
  search: string;
  mode: Mode;
}): React.ReactElement {
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE / 2)),
      Math.max(0, recipes.length - WINDOW_SIZE),
    ),
  );
  const end = Math.min(recipes.length, start + WINDOW_SIZE);
  const window = recipes.slice(start, end);

  const headerRight = (
    <Text color={theme.textMuted}>
      {recipes.length === totalRecipes
        ? `${totalRecipes} installed`
        : `${recipes.length} shown · ${totalRecipes} installed`}
    </Text>
  );

  return (
    <Pane title="Recipes" focused flexGrow={1} right={headerRight}>
      <Box flexDirection="column">
        {(search.length > 0 || mode === "search") && (
          <Box marginBottom={1}>
            <Text color={theme.textMuted}>search</Text>
            <Text color={theme.text}> /{search}</Text>
            {mode === "search" && <Text color={theme.primary}>▎</Text>}
          </Box>
        )}
        {recipes.length === 0 ? (
          <Text color={theme.textMuted}>
            no recipes match the current search
          </Text>
        ) : (
          window.map((recipe, i) => {
            const flatIdx = start + i;
            const sel = flatIdx === selectedIndex;
            const fileCount = recipe.files.length;
            return (
              <ListRow
                key={recipe.id}
                selected={sel}
                prefix={<Text color={theme.textSecondary}>{glyph("pkg")}</Text>}
                right={
                  <Box flexDirection="row" gap={1}>
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    <Text color={theme.textMuted}>
                      {fileCount} file{fileCount === 1 ? "" : "s"}
                    </Text>
                  </Box>
                }
              >
                <Text color={sel ? theme.text : theme.textSecondary}>
                  {truncate(recipe.id, 36)}
                </Text>
              </ListRow>
            );
          })
        )}
        {recipes.length > WINDOW_SIZE && (
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              showing {start + 1}–{end} of {recipes.length} (j/k to scroll)
            </Text>
          </Box>
        )}
      </Box>
    </Pane>
  );
}

function RecipeDetailPane({
  recipe,
}: {
  recipe: Recipe | null;
}): React.ReactElement {
  if (!recipe) {
    return (
      <Pane title="Recipe" flexGrow={1}>
        <Text color={theme.textMuted}>Select a recipe to see details.</Text>
      </Pane>
    );
  }

  const counts = summarizeOperations(recipe);
  const opSummary = formatOperationCounts(counts);

  return (
    <Pane
      title={`Recipe · ${recipe.id}`}
      flexGrow={1}
      right={
        recipe.tags.length > 0 ? (
          <Box flexDirection="row" gap={1}>
            {recipe.tags.slice(0, 4).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Box>
        ) : undefined
      }
    >
      <Box flexDirection="column">
        <Text color={theme.text} bold>
          {recipe.name}
        </Text>
        <Box marginTop={1}>
          <Text color={theme.textSecondary}>
            {recipe.description.length > 0
              ? recipe.description
              : "(no description)"}
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="row">
          <Text color={theme.textMuted}>files </Text>
          <Text color={theme.text}>
            {recipe.files.length} · {opSummary}
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text color={theme.textMuted} bold>
            OPERATIONS
          </Text>
          <OperationList recipe={recipe} />
        </Box>

        {recipe.notes && recipe.notes.trim().length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text color={theme.textMuted} bold>
              NOTES
            </Text>
            <Box marginTop={0}>
              <Text color={theme.textSecondary}>
                {truncate(recipe.notes.trim(), 240)}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </Pane>
  );
}

function OperationList({ recipe }: { recipe: Recipe }): React.ReactElement {
  const MAX = 8;
  const visible = recipe.files.slice(0, MAX);
  const overflow = recipe.files.length - visible.length;

  if (visible.length === 0) {
    return <Text color={theme.textMuted}>no file operations</Text>;
  }

  return (
    <Box flexDirection="column">
      {visible.map((file, i) => (
        <Box key={`${i}-${file.path}`} flexDirection="row">
          <Box width={11}>
            <Tag color={OPERATION_COLOR[file.operation]} tone="solid">
              {file.operation}
            </Tag>
          </Box>
          <Text color={theme.textSecondary}> {truncate(file.path, 48)}</Text>
          <Box flexGrow={1} />
          <Text color={theme.textMuted}>
            {file.content.length} B
          </Text>
        </Box>
      ))}
      {overflow > 0 && (
        <Text color={theme.textMuted}>+ {overflow} more file(s) …</Text>
      )}
    </Box>
  );
}

function ActionFooter({
  mode,
  feedback,
  feedbackItems,
  totalShown,
  totalAll,
  selectedId,
}: {
  mode: Mode;
  feedback: string | null;
  feedbackItems: string[];
  totalShown: number;
  totalAll: number;
  selectedId: string | null;
}): React.ReactElement {
  let hint: string;
  if (mode === "search") {
    hint = "search · type to filter · enter to commit · esc to clear";
  } else if (mode === "confirm-apply") {
    hint = `apply ${selectedId ?? ""}? press y to confirm · n to cancel`;
  } else {
    hint =
      "j/k navigate · / search · enter preview · p preview · a apply · r refresh · esc back";
  }

  const visibleItems = feedbackItems.slice(0, 4);
  const overflow = feedbackItems.length - visibleItems.length;

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      paddingX={1}
      borderStyle="single"
      borderColor={theme.borderSoft}
    >
      <Box flexDirection="row">
        <Text color={theme.textMuted}>{hint}</Text>
        <Box flexGrow={1} />
        <Text color={theme.textMuted}>
          {totalShown} shown · {totalAll} installed
        </Text>
      </Box>
      {feedback && (
        <Box marginTop={0}>
          <Text color={theme.text}>{feedback}</Text>
        </Box>
      )}
      {visibleItems.length > 0 &&
        visibleItems.map((item, i) => (
          <Text key={i} color={theme.textSecondary}>
            {"  "}
            {item}
          </Text>
        ))}
      {overflow > 0 && (
        <Text color={theme.textMuted}>
          {"  "}+ {overflow} more line(s) …
        </Text>
      )}
    </Box>
  );
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}
