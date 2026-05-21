import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { Pane } from "../components/Pane.js";
import { KeyValue } from "../components/KeyValue.js";
import { Tag } from "../components/Tag.js";
import { ListRow } from "../components/ListRow.js";
import { theme } from "../theme/tokens.js";
import { glyph } from "../theme/glyphs.js";
import { getProjectDashboard } from "../../modules/devdash/index.js";
import type { DashboardResult } from "../../modules/devdash/index.js";
import { listRecipes } from "../../modules/stackpack/recipe-store.js";
import { loadHistory } from "../../modules/promptkit/history.js";

type DashboardData = {
  dashboard: DashboardResult;
  recipeCount: number;
  promptCount: number;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: DashboardData }
  | { kind: "error"; message: string };

export function DashboardScreen(): React.ReactElement {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const [dashboard, recipes, prompts] = await Promise.all([
          getProjectDashboard({
            cwd: process.cwd(),
            withLaunch: true,
            withBuild: false,
          }),
          safeListRecipes(),
          safeLoadHistoryCount(),
        ]);

        if (!cancelled) {
          setState({
            kind: "ready",
            data: {
              dashboard,
              recipeCount: recipes,
              promptCount: prompts,
            },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    };

    void load();

    return (): void => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return <DashboardLoading />;
  }

  if (state.kind === "error") {
    return <DashboardError message={state.message} />;
  }

  return <DashboardReady data={state.data} />;
}

async function safeListRecipes(): Promise<number> {
  try {
    const recipes = await listRecipes();
    return recipes.length;
  } catch {
    return 0;
  }
}

async function safeLoadHistoryCount(): Promise<number> {
  try {
    const history = await loadHistory();
    return history.length;
  } catch {
    return 0;
  }
}

function DashboardLoading(): React.ReactElement {
  return (
    <Box flexGrow={1} flexDirection="row" paddingX={1}>
      <Pane title="Dashboard" focused flexGrow={1}>
        <Box paddingY={1} flexDirection="row">
          <Text color={theme.primary}>
            <Spinner type="dots" />
          </Text>
          <Text color={theme.textSecondary}>
            {" "}
            loading project context, doctor scan, and launch score …
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={theme.textMuted}>
            (build is skipped — launch check uses cached artifacts only)
          </Text>
        </Box>
      </Pane>
    </Box>
  );
}

function DashboardError({ message }: { message: string }): React.ReactElement {
  return (
    <Box flexGrow={1} flexDirection="row" paddingX={1}>
      <Pane title="Dashboard" focused flexGrow={1}>
        <Box paddingY={1} flexDirection="column">
          <Text color={theme.danger} bold>
            {glyph("warn")} Could not load dashboard
          </Text>
          <Box marginTop={1}>
            <Text color={theme.textSecondary}>{message}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              Press q to quit, or 1 to retry by re-entering the dashboard.
            </Text>
          </Box>
        </Box>
      </Pane>
    </Box>
  );
}

function DashboardReady({
  data,
}: {
  data: DashboardData;
}): React.ReactElement {
  const { dashboard, recipeCount, promptCount } = data;
  const row = (label: string): string =>
    dashboard.rows.find((r) => r.label === label)?.value ?? "—";

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Box flexDirection="row" gap={1}>
        <ProjectPane
          name={row("Project")}
          path={dashboard.projectRoot}
          framework={row("Framework")}
          language={row("Language")}
          packageManager={row("Package manager")}
          git={row("Git")}
        />
        <DoctorPane dashboard={dashboard} />
        <LaunchPane dashboard={dashboard} />
        <EnvironmentPane
          envFiles={row("Env files")}
          scripts={row("Scripts")}
          tailwind={row("Tailwind")}
          reactRouter={row("React Router")}
        />
      </Box>

      <Box flexDirection="row" gap={1} marginTop={1} flexGrow={1}>
        <RecentActivityPane dashboard={dashboard} />
        <ShortcutsPane />
        <SystemInfoPane
          recipeCount={recipeCount}
          promptCount={promptCount}
          projectRoot={dashboard.projectRoot}
        />
      </Box>
    </Box>
  );
}

type ProjectPaneProps = {
  name: string;
  path: string;
  framework: string;
  language: string;
  packageManager: string;
  git: string;
};

function ProjectPane({
  name,
  path,
  framework,
  language,
  packageManager,
  git,
}: ProjectPaneProps): React.ReactElement {
  return (
    <Pane title="Project" focused flexGrow={1}>
      <Box flexDirection="column">
        <Text color={theme.text} bold>
          {name}
        </Text>
        <Text color={theme.textMuted}>{truncatePath(path, 36)}</Text>
        <Box marginTop={1} flexDirection="column">
          <KeyValue label="framework" value={framework} />
          <KeyValue label="language" value={language} />
          <KeyValue label="package" value={packageManager} />
          <KeyValue
            label="git"
            value={
              <Text color={theme.text}>
                {glyph("branch")} {git}
              </Text>
            }
          />
        </Box>
      </Box>
    </Pane>
  );
}

function DoctorPane({
  dashboard,
}: {
  dashboard: DashboardResult;
}): React.ReactElement {
  const doctor = dashboard.doctor;

  return (
    <Pane
      title="Doctor"
      flexGrow={1}
      right={
        doctor && doctor.total > 0 ? (
          <Tag color={theme.warning}>{`${doctor.total} open`}</Tag>
        ) : doctor ? (
          <Tag color={theme.success}>clean</Tag>
        ) : undefined
      }
    >
      {doctor ? (
        <Box flexDirection="column">
          <SeverityRow
            label="high"
            count={doctor.bySeverity.high}
            color={theme.danger}
          />
          <SeverityRow
            label="medium"
            count={doctor.bySeverity.medium}
            color={theme.warning}
          />
          <SeverityRow
            label="low"
            count={doctor.bySeverity.low}
            color={theme.textSecondary}
          />
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              {glyph("arrow")} press 2 to triage
            </Text>
          </Box>
        </Box>
      ) : (
        <Text color={theme.textMuted}>doctor unavailable</Text>
      )}
    </Pane>
  );
}

function SeverityRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Box flexGrow={1}>
        <Text color={color}>
          {glyph("bullet")} {label}
        </Text>
      </Box>
      <Text color={theme.text}>{count}</Text>
    </Box>
  );
}

function LaunchPane({
  dashboard,
}: {
  dashboard: DashboardResult;
}): React.ReactElement {
  const launch = dashboard.launch;
  const statusColor =
    launch?.status === "pass"
      ? theme.success
      : launch?.status === "warn"
        ? theme.warning
        : launch?.status === "fail"
          ? theme.danger
          : theme.textSecondary;

  return (
    <Pane
      title="Launch"
      flexGrow={1}
      right={
        launch ? (
          <Tag color={statusColor} tone="solid">
            {launch.status.toUpperCase()}
          </Tag>
        ) : undefined
      }
    >
      {launch ? (
        <Box flexDirection="column">
          <Box flexDirection="row">
            <Text color={theme.text} bold>
              {launch.score}
            </Text>
            <Text color={theme.textMuted}> / 100</Text>
            <Box flexGrow={1} />
            <Text color={theme.textMuted}>
              {launch.ranBuild ? "with build" : "no build"}
            </Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Box flexDirection="row">
              <Box flexGrow={1}>
                <Text color={theme.success}>{glyph("check")} passing</Text>
              </Box>
              <Text color={theme.text}>{launch.pass}</Text>
            </Box>
            <Box flexDirection="row">
              <Box flexGrow={1}>
                <Text color={theme.warning}>{glyph("warn")} warnings</Text>
              </Box>
              <Text color={theme.text}>{launch.warn}</Text>
            </Box>
            <Box flexDirection="row">
              <Box flexGrow={1}>
                <Text color={theme.danger}>{glyph("cross")} failing</Text>
              </Box>
              <Text color={theme.text}>{launch.fail}</Text>
            </Box>
          </Box>
          <Box marginTop={1}>
            <Text color={theme.textMuted}>
              {glyph("arrow")} press 5 to diff runs
            </Text>
          </Box>
        </Box>
      ) : (
        <Text color={theme.textMuted}>launch unavailable</Text>
      )}
    </Pane>
  );
}

function EnvironmentPane({
  envFiles,
  scripts,
  tailwind,
  reactRouter,
}: {
  envFiles: string;
  scripts: string;
  tailwind: string;
  reactRouter: string;
}): React.ReactElement {
  return (
    <Pane title="Environment" flexGrow={1}>
      <Box flexDirection="column">
        <KeyValue label="env files" value={truncate(envFiles, 24)} />
        <KeyValue label="scripts" value={truncate(scripts, 24)} />
        <KeyValue label="tailwind" value={tailwind} />
        <KeyValue label="router" value={reactRouter} />
        <Box marginTop={1}>
          <Text color={theme.textMuted}>
            {glyph("check")} ~/.forge initialized
          </Text>
        </Box>
      </Box>
    </Pane>
  );
}

function RecentActivityPane({
  dashboard,
}: {
  dashboard: DashboardResult;
}): React.ReactElement {
  const visible = dashboard.rows.slice(0, 8);

  return (
    <Pane
      title="Recent activity"
      flexGrow={2}
      right={
        <Text color={theme.textMuted}>{`${dashboard.rows.length} entries`}</Text>
      }
    >
      <Box flexDirection="column">
        {visible.map((row, i) => (
          <ListRow
            key={`${i}-${row.label}`}
            selected={i === 0}
            prefix={
              <Text color={theme.textMuted}>
                {row.label.padEnd(16).slice(0, 16)}
              </Text>
            }
          >
            <Text color={theme.text}>{truncate(row.value, 40)}</Text>
          </ListRow>
        ))}
      </Box>
    </Pane>
  );
}

function ShortcutsPane(): React.ReactElement {
  const shortcuts: Array<[string, string, string]> = [
    ["1", "dashboard", theme.primary],
    ["2", "doctor", theme.warning],
    ["3", "recipes", theme.secondary],
    ["4", "prompts", theme.secondary],
    ["5", "launch", theme.success],
    ["6", "config", theme.textSecondary],
    ["?", "help overlay", theme.textSecondary],
    ["ctrl+k", "command palette", theme.textSecondary],
    ["q", "quit", theme.danger],
  ];

  return (
    <Pane title="Shortcuts" flexGrow={1}>
      <Box flexDirection="column">
        {shortcuts.map(([key, label, color]) => (
          <Box key={key} flexDirection="row">
            <Box width={10}>
              <Text color={theme.text} backgroundColor={theme.elevated}>
                {` ${key} `}
              </Text>
            </Box>
            <Text color={color}> {label}</Text>
          </Box>
        ))}
      </Box>
    </Pane>
  );
}

function SystemInfoPane({
  recipeCount,
  promptCount,
  projectRoot,
}: {
  recipeCount: number;
  promptCount: number;
  projectRoot: string;
}): React.ReactElement {
  return (
    <Pane title="System" flexGrow={1}>
      <Box flexDirection="column">
        <KeyValue
          label="recipes"
          value={
            <Text color={theme.text}>
              {glyph("pkg")} {recipeCount} installed
            </Text>
          }
        />
        <KeyValue
          label="prompts"
          value={
            <Text color={theme.text}>
              {glyph("terminal")} {promptCount} saved
            </Text>
          }
        />
        <KeyValue label="node" value={process.version} />
        <KeyValue label="platform" value={process.platform} />
        <Box marginTop={1}>
          <Text color={theme.textMuted}>cwd</Text>
        </Box>
        <Text color={theme.textSecondary}>{truncatePath(projectRoot, 32)}</Text>
      </Box>
    </Pane>
  );
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function truncatePath(value: string, max: number): string {
  if (value.length <= max) return value;
  const tail = value.slice(value.length - (max - 1));
  return `…${tail}`;
}
