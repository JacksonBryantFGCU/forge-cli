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
import { runLaunchCheck } from "../../modules/launchcheck/index.js";
import type {
  LaunchCheckResult,
  LaunchCheckStatus,
  SavedReport,
} from "../../modules/launchcheck/index.js";
import {
  listReports,
  resolveProjectName,
  saveReport,
} from "../../modules/launchcheck/reports.js";
import {
  buildCheckRows,
  type ChangeKind,
  type CheckGroup,
  type CheckRow,
  clampIndex,
  countChanges,
  groupChecks,
  sortReportsNewestFirst,
} from "./launch-helpers.js";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; reports: SavedReport[] }
  | { kind: "running"; message: string }
  | { kind: "error"; message: string };

type LaunchScreenProps = {
  appState: AppState;
};

const STATUS_COLOR: Record<LaunchCheckStatus, string> = {
  pass: theme.success,
  warn: theme.warning,
  fail: theme.danger,
};

const CHANGE_LABEL: Record<ChangeKind, string> = {
  fixed: "FIXED",
  regressed: "REGRESS",
  new: "NEW",
  removed: "GONE",
  unchanged: "—",
};

const CHANGE_COLOR: Record<ChangeKind, string> = {
  fixed: theme.success,
  regressed: theme.danger,
  new: theme.primary,
  removed: theme.textMuted,
  unchanged: theme.textMuted,
};

export function LaunchScreen({
  appState,
}: LaunchScreenProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [pendingResult, setPendingResult] =
    useState<LaunchCheckResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");

  const reload = useCallback(async (): Promise<void> => {
    setState({ kind: "loading" });
    setFeedback(null);
    try {
      const name = await resolveProjectName(process.cwd());
      const raw = await listReports(name);
      const reports = sortReportsNewestFirst(raw);
      setProjectName(name);
      setState({ kind: "ready", reports });
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

  const reports = state.kind === "ready" ? state.reports : [];
  const safeIndex = clampIndex(selectedIndex, reports.length);
  const selectedReport: SavedReport | null = reports[safeIndex] ?? null;
  const previousReport: SavedReport | null = reports[safeIndex + 1] ?? null;

  const rows = useMemo<CheckRow[]>(
    () => buildCheckRows(previousReport, selectedReport),
    [previousReport, selectedReport],
  );
  const groups = useMemo<CheckGroup[]>(() => groupChecks(rows), [rows]);
  const changeCounts = useMemo(() => countChanges(rows), [rows]);

  const handleRun = useCallback(async (): Promise<void> => {
    setState({
      kind: "running",
      message: "Running launch check (build skipped) …",
    });
    setFeedback(null);
    try {
      const result = await runLaunchCheck({
        cwd: process.cwd(),
        skipBuild: true,
        strict: false,
      });
      setPendingResult(result);
      setFeedback(
        `Fresh run: ${result.score}/100 ${result.status.toUpperCase()} — press s to save.`,
      );
      // Return to ready state without reloading reports (no save yet).
      setState({ kind: "ready", reports });
    } catch (err) {
      setFeedback(
        `Run failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      setState({ kind: "ready", reports });
    }
  }, [reports]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!pendingResult) {
      setFeedback("No fresh run to save. Press r to run a launch check first.");
      return;
    }
    const result = pendingResult;
    setState({ kind: "running", message: "Saving report …" });
    setFeedback(null);
    try {
      const target = projectName.length > 0
        ? projectName
        : await resolveProjectName(process.cwd());
      const path = await saveReport(result, { project: target });
      setPendingResult(null);
      setFeedback(`Saved report → ${path}`);
      await reload();
    } catch (err) {
      setFeedback(
        `Save failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      setState({ kind: "ready", reports });
    }
  }, [pendingResult, projectName, reports, reload]);

  const handleCompare = useCallback((): void => {
    if (!selectedReport) {
      setFeedback("No report selected.");
      return;
    }
    if (!previousReport) {
      setFeedback("No previous report to compare against.");
      return;
    }
    setFeedback(
      `Comparing ${selectedReport.timestamp} vs ${previousReport.timestamp}.`,
    );
  }, [selectedReport, previousReport]);

  useInput((input, key) => {
    if (state.kind !== "ready") return;

    if (key.escape) {
      appState.setRoute("dashboard");
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => clampIndex(i + 1, reports.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => clampIndex(i - 1, reports.length));
      return;
    }
    if (input === "d") {
      handleCompare();
      return;
    }
    if (input === "r") {
      void handleRun();
      return;
    }
    if (input === "s") {
      void handleSave();
      return;
    }
    if (key.return) {
      // Detail is always rendered; soft acknowledgement.
      if (selectedReport) {
        setFeedback(`Viewing report ${selectedReport.timestamp}.`);
      }
    }
  });

  if (state.kind === "loading") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Launch" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="row">
            <Text color={theme.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={theme.textSecondary}>
              {" "}
              loading saved launch reports …
            </Text>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (state.kind === "running") {
    return (
      <Box flexGrow={1} flexDirection="row" paddingX={1}>
        <Pane title="Launch" focused flexGrow={1}>
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
        <Pane title="Launch" focused flexGrow={1}>
          <Box paddingY={1} flexDirection="column">
            <Text color={theme.danger} bold>
              {glyph("warn")} Could not load reports
            </Text>
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>{state.message}</Text>
            </Box>
          </Box>
        </Pane>
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        pendingResult={pendingResult}
        feedback={feedback}
        projectName={projectName}
      />
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <SummaryBanner
        current={selectedReport}
        previous={previousReport}
        pendingResult={pendingResult}
        changeCounts={changeCounts}
      />
      <Box flexDirection="row" gap={1} flexGrow={1}>
        <ReportListPane
          reports={reports}
          selectedIndex={safeIndex}
          projectName={projectName}
        />
        <ChecksPane groups={groups} hasPrevious={previousReport !== null} />
      </Box>
      <ActionFooter
        feedback={feedback}
        pendingResult={pendingResult}
        selected={selectedReport}
        previous={previousReport}
      />
    </Box>
  );
}

function SummaryBanner({
  current,
  previous,
  pendingResult,
  changeCounts,
}: {
  current: SavedReport | null;
  previous: SavedReport | null;
  pendingResult: LaunchCheckResult | null;
  changeCounts: Record<ChangeKind, number>;
}): React.ReactElement {
  if (!current) {
    return <Box />;
  }

  const delta = previous ? current.score - previous.score : 0;
  const deltaColor =
    delta > 0
      ? theme.success
      : delta < 0
        ? theme.danger
        : theme.textMuted;
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <Box
      flexDirection="row"
      marginBottom={1}
      paddingX={1}
      borderStyle="round"
      borderColor={theme.borderSoft}
      gap={2}
    >
      <Box flexDirection="column">
        <Text color={theme.textMuted}>previous</Text>
        {previous ? (
          <>
            <Text color={theme.textSecondary} bold>
              {previous.score}
            </Text>
            <Text color={theme.textMuted}>{previous.timestamp}</Text>
          </>
        ) : (
          <Text color={theme.textMuted}>—</Text>
        )}
      </Box>
      <Box flexDirection="column" justifyContent="center">
        <Text color={deltaColor} bold>
          {previous ? `${glyph("arrow")} ${deltaText}` : glyph("arrow")}
        </Text>
      </Box>
      <Box flexDirection="column">
        <Text color={theme.textMuted}>current</Text>
        <Box flexDirection="row">
          <Text color={theme.text} bold>
            {current.score}
          </Text>
          <Text color={theme.textMuted}> / 100</Text>
        </Box>
        <Box flexDirection="row">
          <Tag color={STATUS_COLOR[current.status]} tone="solid">
            {current.status.toUpperCase()}
          </Tag>
          <Text color={theme.textMuted}> {current.timestamp}</Text>
        </Box>
      </Box>
      <Box flexGrow={1} />
      <Box flexDirection="column">
        <Text color={theme.textMuted}>changes</Text>
        <Box flexDirection="row" gap={1}>
          <Tag color={theme.success}>{`${changeCounts.fixed} fixed`}</Tag>
          <Tag color={theme.danger}>
            {`${changeCounts.regressed} regressed`}
          </Tag>
          <Tag color={theme.primary}>{`${changeCounts.new} new`}</Tag>
        </Box>
      </Box>
      {pendingResult && (
        <Box flexDirection="column" marginLeft={2}>
          <Text color={theme.textMuted}>pending</Text>
          <Box flexDirection="row">
            <Text color={theme.text}>{pendingResult.score}</Text>
            <Text color={theme.textMuted}>/100</Text>
          </Box>
          <Tag color={theme.warning}>unsaved</Tag>
        </Box>
      )}
    </Box>
  );
}

function ReportListPane({
  reports,
  selectedIndex,
  projectName,
}: {
  reports: SavedReport[];
  selectedIndex: number;
  projectName: string;
}): React.ReactElement {
  const WINDOW = 14;
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW / 2)),
      Math.max(0, reports.length - WINDOW),
    ),
  );
  const end = Math.min(reports.length, start + WINDOW);
  const window = reports.slice(start, end);

  return (
    <Pane
      title="Reports"
      focused
      flexGrow={1}
      right={
        <Text color={theme.textMuted}>{projectName || "project"}</Text>
      }
    >
      <Box flexDirection="column">
        {window.map((report, i) => {
          const flatIdx = start + i;
          const sel = flatIdx === selectedIndex;
          return (
            <ListRow
              key={report.timestamp}
              selected={sel}
              prefix={
                <Tag color={STATUS_COLOR[report.status]}>
                  {report.status}
                </Tag>
              }
              right={
                <Text color={theme.textMuted}>{`${report.score}/100`}</Text>
              }
            >
              <Text color={sel ? theme.text : theme.textSecondary}>
                {truncate(report.timestamp, 28)}
              </Text>
            </ListRow>
          );
        })}
        {reports.length > WINDOW && (
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              showing {start + 1}–{end} of {reports.length} (j/k to scroll)
            </Text>
          </Box>
        )}
      </Box>
    </Pane>
  );
}

function ChecksPane({
  groups,
  hasPrevious,
}: {
  groups: CheckGroup[];
  hasPrevious: boolean;
}): React.ReactElement {
  if (groups.length === 0) {
    return (
      <Pane title="Checks" flexGrow={2}>
        <Text color={theme.textMuted}>No checks recorded in this report.</Text>
      </Pane>
    );
  }

  return (
    <Pane
      title="Checks"
      flexGrow={2}
      right={
        <Text color={theme.textMuted}>
          {hasPrevious ? "diff vs previous" : "no previous report"}
        </Text>
      }
    >
      <Box flexDirection="column">
        {groups.map((g) => (
          <Box key={g.group} flexDirection="column" marginBottom={1}>
            <Box flexDirection="row">
              <Text color={theme.textMuted} bold>
                {g.group.toUpperCase()}
              </Text>
              <Box flexGrow={1} />
              <Text color={theme.textMuted}>
                {g.items.length} check{g.items.length === 1 ? "" : "s"}
              </Text>
            </Box>
            {g.items.map((row) => (
              <CheckRowView key={row.id} row={row} />
            ))}
          </Box>
        ))}
      </Box>
    </Pane>
  );
}

function CheckRowView({ row }: { row: CheckRow }): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Box width={3}>
        <Text color={row.prevStatus ? STATUS_COLOR[row.prevStatus] : theme.textMuted}>
          {row.prevStatus ? statusGlyph(row.prevStatus) : "·"}
        </Text>
      </Box>
      <Text color={theme.textMuted}>{glyph("arrow")} </Text>
      <Box width={3}>
        <Text color={row.curStatus ? STATUS_COLOR[row.curStatus] : theme.textMuted}>
          {row.curStatus ? statusGlyph(row.curStatus) : "·"}
        </Text>
      </Box>
      <Box flexGrow={1}>
        <Text color={theme.text}>{truncate(row.title, 60)}</Text>
      </Box>
      {row.change !== "unchanged" && (
        <Tag color={CHANGE_COLOR[row.change]} tone="solid">
          {CHANGE_LABEL[row.change]}
        </Tag>
      )}
    </Box>
  );
}

function statusGlyph(status: LaunchCheckStatus): string {
  if (status === "pass") return glyph("check");
  if (status === "warn") return glyph("warn");
  return glyph("cross");
}

function EmptyState({
  pendingResult,
  feedback,
  projectName,
}: {
  pendingResult: LaunchCheckResult | null;
  feedback: string | null;
  projectName: string;
}): React.ReactElement {
  return (
    <Box flexGrow={1} flexDirection="row" paddingX={1}>
      <Pane title="Launch" focused flexGrow={1}>
        <Box paddingY={1} flexDirection="column">
          <Text color={theme.text} bold>
            {glyph("info")} No saved launch reports for{" "}
            {projectName || "this project"}
          </Text>
          <Box marginTop={1}>
            <Text color={theme.textSecondary}>
              Save a report from the CLI:
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.text} backgroundColor={theme.elevated}>
              {" forge launch --skip-build --save "}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              Or press r to run a check here (build skipped), then s to save.
            </Text>
          </Box>
          {pendingResult && (
            <Box marginTop={1} flexDirection="row">
              <Tag color={STATUS_COLOR[pendingResult.status]} tone="solid">
                {pendingResult.status.toUpperCase()}
              </Tag>
              <Text color={theme.text}>
                {" "}
                {pendingResult.score}/100 — press s to save
              </Text>
            </Box>
          )}
          {feedback && (
            <Box marginTop={1}>
              <Text color={theme.textSecondary}>{feedback}</Text>
            </Box>
          )}
        </Box>
      </Pane>
    </Box>
  );
}

function ActionFooter({
  feedback,
  pendingResult,
  selected,
  previous,
}: {
  feedback: string | null;
  pendingResult: LaunchCheckResult | null;
  selected: SavedReport | null;
  previous: SavedReport | null;
}): React.ReactElement {
  const hint = "j/k navigate · d compare · r run (no build) · s save · enter view · esc back";

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
        {pendingResult && (
          <Text color={theme.warning}>
            pending unsaved run — press s
          </Text>
        )}
        {!pendingResult && selected && (
          <Text color={theme.textMuted}>
            {previous ? "diff vs previous" : "no previous report"}
          </Text>
        )}
      </Box>
      {feedback && (
        <Box marginTop={0}>
          <Text color={theme.text}>{feedback}</Text>
        </Box>
      )}
      {selected && selected.url && (
        <Box marginTop={0}>
          <KeyValue
            label="url"
            value={
              <Text color={theme.textSecondary}>
                {truncate(selected.url, 64)}
              </Text>
            }
          />
        </Box>
      )}
    </Box>
  );
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}
