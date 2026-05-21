import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { Pane } from "../components/Pane.js";
import { Tag } from "../components/Tag.js";
import { ListRow } from "../components/ListRow.js";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";
import type { AppState } from "../state.js";
import { runDoctor } from "../../modules/repo-doctor/index.js";
import type {
  DoctorCategory,
  DoctorIssue,
  DoctorResult,
  DoctorSeverity,
} from "../../modules/repo-doctor/index.js";
import {
  applyAllFixes,
  applyFix,
  getFixableRuleIds,
  previewFix,
} from "../../modules/repo-doctor/fix-helpers.js";
import {
  clampIndex,
  filterIssues,
  flattenGroups,
  groupIssuesByCategory,
} from "./doctor-helpers.js";

type Mode = "browse" | "filter" | "confirm-all";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; result: DoctorResult }
  | { kind: "applying"; message: string }
  | { kind: "error"; message: string };

type DoctorScreenProps = {
  appState: AppState;
};

const WINDOW_SIZE = 14;

const SEVERITY_COLOR: Record<DoctorSeverity, string> = {
  high: theme.danger,
  medium: theme.warning,
  low: theme.textSecondary,
};

const CATEGORY_COLOR: Record<DoctorCategory, string> = {
  security: theme.danger,
  deployment: theme.primary,
  env: theme.warning,
  react: theme.secondary,
  express: theme.primary,
  project: theme.textSecondary,
};

export function DoctorScreen({
  appState,
}: DoctorScreenProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [filter, setFilter] = useState<string>("");
  const [mode, setMode] = useState<Mode>("browse");
  const [feedback, setFeedback] = useState<string | null>(null);
  const fixableIds = useMemo<Set<string>>(() => getFixableRuleIds(), []);

  const reload = useCallback(async (): Promise<void> => {
    setState({ kind: "loading" });
    try {
      const result = await runDoctor({ cwd: process.cwd(), fix: false });
      setState({ kind: "ready", result });
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
    appState.setInputCaptured(mode === "filter");
    return (): void => {
      appState.setInputCaptured(false);
    };
  }, [mode, appState]);

  const issues = state.kind === "ready" ? state.result.issues : [];
  const visibleIssues = useMemo(
    () => filterIssues(issues, filter),
    [issues, filter],
  );
  const groups = useMemo(
    () => groupIssuesByCategory(visibleIssues),
    [visibleIssues],
  );
  const flat = useMemo(() => flattenGroups(groups), [groups]);
  const safeIndex = clampIndex(selectedIndex, flat.length);
  const selected: DoctorIssue | null = flat[safeIndex] ?? null;
  const fixableCount = flat.filter((i) => fixableIds.has(i.id)).length;

  const handleApplyOne = useCallback(async (): Promise<void> => {
    if (!selected || !fixableIds.has(selected.id)) {
      setFeedback("No fix available for this issue.");
      return;
    }
    const target = selected;
    setState({
      kind: "applying",
      message: `Applying fix for ${target.title} …`,
    });
    setFeedback(null);
    try {
      const applied = await applyFix(process.cwd(), target.id);
      setFeedback(
        applied?.fixed
          ? `Applied: ${target.title}`
          : applied?.fixSkipped
            ? `Fix skipped: ${target.title}`
            : `Fix completed: ${target.title}`,
      );
      await reload();
    } catch (err) {
      setFeedback(
        `Apply failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      await reload();
    }
  }, [selected, fixableIds, reload]);

  const handleApplyAll = useCallback(async (): Promise<void> => {
    setMode("browse");
    setState({ kind: "applying", message: "Applying all available fixes …" });
    setFeedback(null);
    try {
      const result = await applyAllFixes(process.cwd());
      const fixed = result.issues.filter((i) => i.fixed).length;
      setFeedback(`Applied ${fixed} fix${fixed === 1 ? "" : "es"}.`);
      await reload();
    } catch (err) {
      setFeedback(
        `Apply-all failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      await reload();
    }
  }, [reload]);

  const handlePreview = useCallback(async (): Promise<void> => {
    if (!selected || !fixableIds.has(selected.id)) {
      setFeedback("No fix preview available for this issue.");
      return;
    }
    setFeedback(`Previewing: ${selected.title} …`);
    try {
      const previewed = await previewFix(process.cwd(), selected.id);
      if (!previewed) {
        setFeedback("Preview returned no result.");
        return;
      }
      const tag = previewed.fixPreview
        ? "would apply"
        : previewed.fixSkipped
          ? "would skip"
          : "no change";
      setFeedback(`Preview (${tag}): ${previewed.message}`);
    } catch (err) {
      setFeedback(
        `Preview failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [selected, fixableIds]);

  useInput((input, key) => {
    if (state.kind !== "ready") return;

    if (mode === "filter") {
      if (key.escape) {
        setFilter("");
        setMode("browse");
        return;
      }
      if (key.return) {
        setMode("browse");
        return;
      }
      if (key.backspace || key.delete) {
        setFilter((f) => f.slice(0, -1));
        return;
      }
      if (input && input.length > 0 && !key.ctrl && !key.meta) {
        setFilter((f) => f + input);
      }
      return;
    }

    if (mode === "confirm-all") {
      if (input === "y") {
        void handleApplyAll();
      } else if (input === "n" || key.escape) {
        setMode("browse");
        setFeedback(null);
      }
      return;
    }

    if (key.escape) {
      if (filter.length > 0) {
        setFilter("");
      } else {
        appState.setRoute("dashboard");
      }
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => clampIndex(i + 1, flat.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => clampIndex(i - 1, flat.length));
      return;
    }
    if (input === "/") {
      setMode("filter");
      setFeedback(null);
      return;
    }
    if (input === "f") {
      void handleApplyOne();
      return;
    }
    if (input === "d") {
      void handlePreview();
      return;
    }
    if (input === "a") {
      if (fixableCount === 0) {
        setFeedback("No fixable issues to apply.");
        return;
      }
      setMode("confirm-all");
    }
  });

  if (state.kind === "loading") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Doctor" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}> scanning rules …</Text>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (state.kind === "applying") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Doctor" focused flexGrow={1}>
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
        <Pane title="Doctor" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="column">
            <Text color={theme.danger} bold>
              {glyph("warn")} Doctor failed to run
            </Text>
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>{state.message}</Text>
            </Box>
          </Box>
        </Pane>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Box flexDirection="row" gap={1} flexGrow={1}>
        <IssueListPane
          groups={groups}
          flatIssues={flat}
          selectedIndex={safeIndex}
          totalIssues={issues.length}
          fixableIds={fixableIds}
          filter={filter}
          mode={mode}
        />
        <IssueDetailPane
          issue={selected}
          fixable={selected ? fixableIds.has(selected.id) : false}
        />
      </Box>
      <ActionFooter
        mode={mode}
        feedback={feedback}
        fixableCount={fixableCount}
        totalShown={flat.length}
        totalAll={issues.length}
      />
    </Box>
  );
}

function IssueListPane({
  groups,
  flatIssues,
  selectedIndex,
  totalIssues,
  fixableIds,
  filter,
  mode,
}: {
  groups: ReturnType<typeof groupIssuesByCategory>;
  flatIssues: DoctorIssue[];
  selectedIndex: number;
  totalIssues: number;
  fixableIds: Set<string>;
  filter: string;
  mode: Mode;
}): React.ReactElement {
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE / 2)),
      Math.max(0, flatIssues.length - WINDOW_SIZE),
    ),
  );
  const end = Math.min(flatIssues.length, start + WINDOW_SIZE);
  const visibleIdSet = new Set(flatIssues.slice(start, end).map((i) => i.id));

  const headerRight = (
    <Text color={theme.textMuted}>
      {flatIssues.length === totalIssues
        ? `${totalIssues} total`
        : `${flatIssues.length} shown · ${totalIssues} total`}
    </Text>
  );

  return (
    <Pane title="Issues" focused flexGrow={1} right={headerRight}>
      <Box flexDirection="column">
        {(filter.length > 0 || mode === "filter") && (
          <Box marginBottom={1}>
            <Text color={theme.textMuted}>filter</Text>
            <Text color={theme.text}> /{filter}</Text>
            {mode === "filter" && <Text color={theme.primary}>▎</Text>}
          </Box>
        )}
        {flatIssues.length === 0 ? (
          <Text color={theme.textMuted}>
            {totalIssues === 0
              ? "no issues — repo looks clean"
              : "no matches for current filter"}
          </Text>
        ) : (
          groups.map((g) => {
            const itemsInWindow = g.items.filter((it) =>
              visibleIdSet.has(it.id),
            );
            if (itemsInWindow.length === 0) return null;
            return (
              <Box key={g.category} flexDirection="column" marginBottom={1}>
                <Box flexDirection="row">
                  <Text color={CATEGORY_COLOR[g.category]} bold>
                    {g.category.toUpperCase()}
                  </Text>
                  <Box flexGrow={1} />
                  <Text color={theme.textMuted}>{g.items.length}</Text>
                </Box>
                {itemsInWindow.map((issue) => {
                  const indexInFlat = flatIssues.findIndex(
                    (it) => it.id === issue.id,
                  );
                  const sel = indexInFlat === selectedIndex;
                  return (
                    <ListRow
                      key={issue.id}
                      selected={sel}
                      prefix={
                        <Text color={SEVERITY_COLOR[issue.severity]}>
                          {glyph("bullet")}
                        </Text>
                      }
                      right={
                        fixableIds.has(issue.id) ? (
                          <Tag color={theme.success}>fix</Tag>
                        ) : (
                          <Text color={theme.textMuted}>manual</Text>
                        )
                      }
                    >
                      <Text color={sel ? theme.text : theme.textSecondary}>
                        {truncate(issue.title, 44)}
                      </Text>
                    </ListRow>
                  );
                })}
              </Box>
            );
          })
        )}
        {flatIssues.length > WINDOW_SIZE && (
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              showing {start + 1}–{end} of {flatIssues.length} (j/k to scroll)
            </Text>
          </Box>
        )}
      </Box>
    </Pane>
  );
}

function IssueDetailPane({
  issue,
  fixable,
}: {
  issue: DoctorIssue | null;
  fixable: boolean;
}): React.ReactElement {
  if (!issue) {
    return (
      <Pane title="Preview" flexGrow={1}>
        <Text color={theme.textMuted}>Select an issue to see details.</Text>
      </Pane>
    );
  }

  return (
    <Pane
      title={`Preview · ${issue.id}`}
      flexGrow={1}
      right={
        <Box flexDirection="row" gap={1}>
          <Tag color={SEVERITY_COLOR[issue.severity]} tone="solid">
            {issue.severity.toUpperCase()}
          </Tag>
          <Tag color={CATEGORY_COLOR[issue.category]}>{issue.category}</Tag>
        </Box>
      }
    >
      <Box flexDirection="column">
        <Text color={theme.text} bold>
          {issue.title}
        </Text>
        <Box marginTop={1}>
          <Text color={theme.textSecondary}>{issue.message}</Text>
        </Box>

        <Box marginTop={1} flexDirection="row">
          <Text color={theme.textMuted}>fix </Text>
          {fixable ? (
            <Tag color={theme.success}>available</Tag>
          ) : (
            <Tag color={theme.textSecondary}>manual only</Tag>
          )}
          {issue.fixed && (
            <Box marginLeft={1}>
              <Tag color={theme.success} tone="solid">
                FIXED
              </Tag>
            </Box>
          )}
          {issue.fixSkipped && (
            <Box marginLeft={1}>
              <Tag color={theme.warning}>skipped</Tag>
            </Box>
          )}
        </Box>

        <Box marginTop={1}>
          <Text color={theme.textMuted}>
            {glyph("info")} TODO: render inline diff once the doctor engine
            exposes affected file paths.
          </Text>
        </Box>
      </Box>
    </Pane>
  );
}

function ActionFooter({
  mode,
  feedback,
  fixableCount,
  totalShown,
  totalAll,
}: {
  mode: Mode;
  feedback: string | null;
  fixableCount: number;
  totalShown: number;
  totalAll: number;
}): React.ReactElement {
  let hint: string;
  if (mode === "filter") {
    hint = "filter · type to search · enter to commit · esc to cancel";
  } else if (mode === "confirm-all") {
    hint = `apply all ${fixableCount} fix${fixableCount === 1 ? "" : "es"}? press y to confirm · n to cancel`;
  } else {
    hint = `j/k navigate · / filter · f apply · d preview · a apply all · esc back`;
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
          {totalShown} shown · {totalAll} total · {fixableCount} fixable
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
