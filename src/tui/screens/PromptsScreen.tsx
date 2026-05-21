import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Pane } from "../components/Pane.js";
import { Tag } from "../components/Tag.js";
import { ListRow } from "../components/ListRow.js";
import { KeyValue } from "../components/KeyValue.js";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";
import type { AppState } from "../state.js";
import {
  clearHistory,
  copyPrompt,
  loadHistory,
} from "../../modules/promptkit/history.js";
import type {
  PromptHistoryEntry,
  PromptType,
} from "../../modules/promptkit/types.js";
import {
  clampIndex,
  cycleTypeFilter,
  filterPrompts,
  formatTimestamp,
  PROMPT_TYPE_LIST,
  sortNewestFirst,
} from "./prompt-helpers.js";

type Mode = "browse" | "search" | "confirm-clear";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; prompts: PromptHistoryEntry[] }
  | { kind: "working"; message: string }
  | { kind: "error"; message: string };

type PromptsScreenProps = {
  appState: AppState;
};

const WINDOW_SIZE = 14;
const BODY_LINE_LIMIT = 28;

const TYPE_COLORS: Record<PromptType, string> = {
  feature: theme.primary,
  debug: theme.warning,
  refactor: theme.secondary,
  audit: theme.danger,
  test: theme.success,
  cleanup: theme.textSecondary,
  deploy: theme.primary,
  review: theme.secondary,
};

export function PromptsScreen({
  appState,
}: PromptsScreenProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<PromptType | null>(null);
  const [mode, setMode] = useState<Mode>("browse");
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setState({ kind: "loading" });
    setFeedback(null);
    try {
      const prompts = sortNewestFirst(await loadHistory());
      setState({ kind: "ready", prompts });
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

  const prompts = state.kind === "ready" ? state.prompts : [];
  const filtered = useMemo(
    () => filterPrompts(prompts, search, typeFilter),
    [prompts, search, typeFilter],
  );
  const safeIndex = clampIndex(selectedIndex, filtered.length);
  const selected: PromptHistoryEntry | null = filtered[safeIndex] ?? null;

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!selected) {
      setFeedback("No prompt selected.");
      return;
    }
    const target = selected;
    setFeedback(`Copying ${target.id} …`);
    try {
      const result = await copyPrompt(target.id);
      if (result.copied) {
        setFeedback(`Copied prompt ${target.id} to clipboard.`);
      } else {
        setFeedback(
          result.reason ??
            "Clipboard unavailable. Install `clipboardy` to enable copy.",
        );
      }
    } catch (err) {
      setFeedback(
        `Copy failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [selected]);

  const handleClear = useCallback(async (): Promise<void> => {
    setMode("browse");
    setState({ kind: "working", message: "Clearing prompt history …" });
    setFeedback(null);
    try {
      await clearHistory();
      setFeedback("Cleared all saved prompts.");
      await reload();
    } catch (err) {
      setFeedback(
        `Clear failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      await reload();
    }
  }, [reload]);

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

    if (mode === "confirm-clear") {
      if (input === "y") {
        void handleClear();
      } else if (input === "n" || key.escape) {
        setMode("browse");
        setFeedback(null);
      }
      return;
    }

    if (key.escape) {
      if (search.length > 0 || typeFilter !== null) {
        setSearch("");
        setTypeFilter(null);
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
    if (input === "t") {
      setTypeFilter((current) => cycleTypeFilter(current));
      setSelectedIndex(0);
      return;
    }
    if (input === "y") {
      void handleCopy();
      return;
    }
    if (input === "c") {
      if (prompts.length === 0) {
        setFeedback("History is already empty.");
        return;
      }
      setMode("confirm-clear");
      return;
    }
    if (key.return) {
      // detail is always shown; no-op to keep the user oriented
      setFeedback(selected ? `Viewing prompt ${selected.id}.` : null);
    }
  });

  if (state.kind === "loading") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Prompts" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}>
              {" "}
              loading prompt history …
            </Text>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (state.kind === "working") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Prompts" focused flexGrow={1}>
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
        <Pane title="Prompts" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="column">
            <Text color={theme.danger} bold>
              {glyph("warn")} Could not load prompt history
            </Text>
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>{state.message}</Text>
            </Box>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (prompts.length === 0) {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Prompts" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="column">
            <Text color={theme.text} bold>
              {glyph("terminal")} No prompts yet
            </Text>
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>
                Generate your first prompt with:
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color={theme.text} backgroundColor={theme.elevated}>
                {' forge prompt feature "add Supabase auth" '}
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color={theme.textMuted}>
                Prompts you generate are saved to ~/.forge/prompts/history.json.
              </Text>
            </Box>
          </Box>
        </Pane>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <TypeChipBar typeFilter={typeFilter} />
      <Box flexDirection="row" gap={1} flexGrow={1}>
        <PromptListPane
          prompts={filtered}
          totalPrompts={prompts.length}
          selectedIndex={safeIndex}
          search={search}
          mode={mode}
        />
        <PromptDetailPane entry={selected} />
      </Box>
      <ActionFooter
        mode={mode}
        feedback={feedback}
        totalShown={filtered.length}
        totalAll={prompts.length}
        typeFilter={typeFilter}
        selectedId={selected?.id ?? null}
      />
    </Box>
  );
}

function TypeChipBar({
  typeFilter,
}: {
  typeFilter: PromptType | null;
}): React.ReactElement {
  return (
    <Box flexDirection="row" marginBottom={1} flexWrap="wrap">
      <ChipItem label="all" active={typeFilter === null} color={theme.primary} />
      {PROMPT_TYPE_LIST.map((t) => (
        <ChipItem
          key={t}
          label={t}
          active={typeFilter === t}
          color={TYPE_COLORS[t]}
        />
      ))}
      <Box flexGrow={1} />
      <Text color={theme.textMuted}>press t to cycle</Text>
    </Box>
  );
}

function ChipItem({
  label,
  active,
  color,
}: {
  label: string;
  active: boolean;
  color: string;
}): React.ReactElement {
  if (active) {
    return (
      <Box marginRight={1}>
        <Text color={theme.bg} backgroundColor={color} bold>
          {` ${label} `}
        </Text>
      </Box>
    );
  }
  return (
    <Box marginRight={1}>
      <Text color={theme.textSecondary}>{`[${label}]`}</Text>
    </Box>
  );
}

function PromptListPane({
  prompts,
  totalPrompts,
  selectedIndex,
  search,
  mode,
}: {
  prompts: PromptHistoryEntry[];
  totalPrompts: number;
  selectedIndex: number;
  search: string;
  mode: Mode;
}): React.ReactElement {
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE / 2)),
      Math.max(0, prompts.length - WINDOW_SIZE),
    ),
  );
  const end = Math.min(prompts.length, start + WINDOW_SIZE);
  const window = prompts.slice(start, end);

  const headerRight = (
    <Text color={theme.textMuted}>
      {prompts.length === totalPrompts
        ? `${totalPrompts} total`
        : `${prompts.length} shown · ${totalPrompts} total`}
    </Text>
  );

  return (
    <Pane title="History" focused flexGrow={1} right={headerRight}>
      <Box flexDirection="column">
        {(search.length > 0 || mode === "search") && (
          <Box marginBottom={1}>
            <Text color={theme.textMuted}>search</Text>
            <Text color={theme.text}> /{search}</Text>
            {mode === "search" && <Text color={theme.primary}>▎</Text>}
          </Box>
        )}
        {prompts.length === 0 ? (
          <Text color={theme.textMuted}>
            no prompts match the current filter
          </Text>
        ) : (
          window.map((entry, i) => {
            const flatIdx = start + i;
            const sel = flatIdx === selectedIndex;
            return (
              <ListRow
                key={entry.id}
                selected={sel}
                prefix={
                  <Tag color={TYPE_COLORS[entry.type]}>{entry.type}</Tag>
                }
                right={
                  <Text color={theme.textMuted}>
                    {formatTimestamp(entry.timestamp)}
                  </Text>
                }
              >
                <Text color={sel ? theme.text : theme.textSecondary}>
                  {truncate(entry.task, 48)}
                </Text>
              </ListRow>
            );
          })
        )}
        {prompts.length > WINDOW_SIZE && (
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              showing {start + 1}–{end} of {prompts.length} (j/k to scroll)
            </Text>
          </Box>
        )}
      </Box>
    </Pane>
  );
}

function PromptDetailPane({
  entry,
}: {
  entry: PromptHistoryEntry | null;
}): React.ReactElement {
  if (!entry) {
    return (
      <Pane title="Prompt" flexGrow={1}>
        <Text color={theme.textMuted}>Select a prompt to see its body.</Text>
      </Pane>
    );
  }

  const lines = entry.prompt.split("\n");
  const visible = lines.slice(0, BODY_LINE_LIMIT);
  const overflow = lines.length - visible.length;

  return (
    <Pane
      title={`Prompt · ${entry.id}`}
      flexGrow={1}
      right={
        <Box flexDirection="row" gap={1}>
          <Tag color={TYPE_COLORS[entry.type]} tone="solid">
            {entry.type}
          </Tag>
          <Tag color={theme.secondary}>{`mode ${entry.mode}`}</Tag>
        </Box>
      }
    >
      <Box flexDirection="column">
        <Text color={theme.text} bold>
          {entry.task}
        </Text>
        <Box marginTop={1} flexDirection="column">
          <KeyValue
            label="generated"
            value={formatTimestamp(entry.timestamp)}
          />
          <KeyValue
            label="project"
            value={
              <Text color={theme.textSecondary}>
                {truncate(entry.projectRoot, 48)}
              </Text>
            }
          />
          <KeyValue label="type" value={entry.type} />
          <KeyValue label="mode" value={entry.mode} />
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text color={theme.textMuted} bold>
            BODY
          </Text>
          <Box
            marginTop={0}
            paddingX={1}
            borderStyle="single"
            borderColor={theme.borderSoft}
            flexDirection="column"
          >
            {visible.map((line, i) => (
              <Text
                key={i}
                color={
                  line.startsWith("# ")
                    ? theme.primary
                    : line.startsWith("## ")
                      ? theme.secondary
                      : theme.text
                }
              >
                {line.length > 0 ? line : " "}
              </Text>
            ))}
            {overflow > 0 && (
              <Text color={theme.textMuted}>
                … {overflow} more line(s). Press y to copy the full prompt.
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    </Pane>
  );
}

function ActionFooter({
  mode,
  feedback,
  totalShown,
  totalAll,
  typeFilter,
  selectedId,
}: {
  mode: Mode;
  feedback: string | null;
  totalShown: number;
  totalAll: number;
  typeFilter: PromptType | null;
  selectedId: string | null;
}): React.ReactElement {
  let hint: string;
  if (mode === "search") {
    hint = "search · type to filter · enter to commit · esc to clear";
  } else if (mode === "confirm-clear") {
    hint = "clear ALL saved prompts? press y to confirm · n to cancel";
  } else {
    hint =
      "j/k navigate · / search · t cycle type · y copy · enter view · c clear · esc back";
  }

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
          {typeFilter ? `type: ${typeFilter} · ` : ""}
          {totalShown} shown · {totalAll} total
          {selectedId ? ` · selected ${selectedId}` : ""}
        </Text>
      </Box>
      {feedback && (
        <Box marginTop={0}>
          <Text color={theme.text}>{feedback}</Text>
        </Box>
      )}
    </Box>
  );
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}
