// src/commands/tui/index.ts
import React11 from "react";
import { Command } from "@oclif/core";
import { render } from "ink";

// src/tui/App.tsx
import { useEffect as useEffect8, useMemo as useMemo7, useRef, useState as useState10 } from "react";
import { Box as Box17, Text as Text17, useApp, useInput as useInput7, useStdout } from "ink";

// src/tui/components/AppFrame.tsx
import { Box } from "ink";
import { jsx } from "react/jsx-runtime";
function AppFrame({ children }) {
  return /* @__PURE__ */ jsx(Box, { flexDirection: "column", width: "100%", children });
}

// src/tui/components/TopBar.tsx
import React from "react";
import { Box as Box2, Text } from "ink";

// src/tui/theme/tokens.ts
var midnight = {
  bg: "#0B1020",
  panel: "#111827",
  elevated: "#172033",
  border: "#263247",
  borderSoft: "#1B2536",
  primary: "#4F8CFF",
  secondary: "#3CCFCF",
  success: "#5BC680",
  warning: "#E6B450",
  danger: "#E06C75",
  text: "#E6EDF3",
  textSecondary: "#9FB0C0",
  textMuted: "#6B7A90",
  selection: "#1E2A44",
  selectionStrong: "#243454"
};
var theme = midnight;

// src/tui/theme/glyphs.ts
var glyphs = {
  bullet: "\u25CF",
  check: "\u2713",
  cross: "\u2715",
  arrow: "\u2192",
  chevron: "\u203A",
  branch: "\u2387",
  folder: "\u25BE",
  warn: "\u25B2",
  info: "\u24D8",
  forge: "\u25C6",
  wrench: "\u273A",
  pkg: "\u25EB",
  terminal: "\u25B6",
  spinner: "\u25D0",
  dot: "\xB7"
};
function glyph(name) {
  return glyphs[name];
}

// src/tui/components/TopBar.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function TopBar({ crumbs, right }) {
  return /* @__PURE__ */ jsxs(Box2, { paddingX: 1, paddingY: 0, flexDirection: "row", children: [
    /* @__PURE__ */ jsxs(Text, { color: theme.primary, bold: true, children: [
      glyph("forge"),
      " forge"
    ] }),
    /* @__PURE__ */ jsx2(Text, { color: theme.textMuted, children: " \xB7 " }),
    crumbs.map((crumb, i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
      /* @__PURE__ */ jsx2(Text, { color: i === crumbs.length - 1 ? theme.text : theme.textSecondary, children: crumb }),
      i < crumbs.length - 1 && /* @__PURE__ */ jsxs(Text, { color: theme.textMuted, children: [
        " ",
        glyph("chevron"),
        " "
      ] })
    ] }, `${i}-${crumb}`)),
    /* @__PURE__ */ jsx2(Box2, { flexGrow: 1 }),
    right
  ] });
}

// src/tui/components/StatusBar.tsx
import { Box as Box3, Text as Text2 } from "ink";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function StatusBar({
  mode,
  shortcuts,
  hint
}) {
  return /* @__PURE__ */ jsxs2(Box3, { flexDirection: "row", paddingX: 1, borderStyle: "single", borderColor: theme.borderSoft, borderTop: true, borderBottom: false, borderLeft: false, borderRight: false, children: [
    /* @__PURE__ */ jsx3(Text2, { color: theme.bg, backgroundColor: theme.primary, bold: true, children: ` ${mode} ` }),
    shortcuts.map((s, i) => /* @__PURE__ */ jsxs2(Box3, { marginLeft: 2, flexDirection: "row", children: [
      /* @__PURE__ */ jsx3(Text2, { color: theme.text, backgroundColor: theme.elevated, children: ` ${s.key} ` }),
      /* @__PURE__ */ jsxs2(Text2, { color: theme.textMuted, children: [
        " ",
        s.label
      ] })
    ] }, `${i}-${s.key}`)),
    /* @__PURE__ */ jsx3(Box3, { flexGrow: 1 }),
    hint && /* @__PURE__ */ jsx3(Text2, { color: theme.textMuted, children: hint })
  ] });
}

// src/tui/components/HelpOverlay.tsx
import { Box as Box4, Text as Text3 } from "ink";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var GLOBAL_GROUP = {
  title: "Global",
  items: [
    ["?", "toggle this help"],
    ["ctrl+k", "open command palette"],
    [":", "open command palette (vim-style)"],
    ["esc", "close overlay / back"],
    ["q", "quit"]
  ]
};
var NAV_GROUP = {
  title: "Navigation",
  items: [
    ["1", "dashboard"],
    ["2", "doctor"],
    ["3", "recipes"],
    ["4", "prompts"],
    ["5", "launch"],
    ["6", "config"],
    ["tab", "cycle pane focus"]
  ]
};
var SCREEN_KEYS = {
  dashboard: {
    title: "Dashboard",
    items: [["?", "show this help"]]
  },
  doctor: {
    title: "Doctor",
    items: [
      ["j/k or \u2191\u2193", "navigate issues"],
      ["/", "filter"],
      ["f", "apply selected fix"],
      ["d", "preview selected fix"],
      ["a", "apply all auto-fixable"],
      ["esc", "clear filter or back"]
    ]
  },
  recipes: {
    title: "Recipes",
    items: [
      ["j/k or \u2191\u2193", "navigate recipes"],
      ["/", "search"],
      ["enter or p", "preview (dry run)"],
      ["a", "apply selected recipe"],
      ["r", "refresh list"],
      ["esc", "clear search or back"]
    ]
  },
  prompts: {
    title: "Prompts",
    items: [
      ["j/k or \u2191\u2193", "navigate history"],
      ["/", "search"],
      ["t", "cycle type filter"],
      ["y", "copy prompt"],
      ["c", "clear history"],
      ["esc", "clear filters or back"]
    ]
  },
  launch: {
    title: "Launch",
    items: [
      ["j/k or \u2191\u2193", "navigate reports"],
      ["d", "compare with previous"],
      ["r", "run check (no build)"],
      ["s", "save current run"],
      ["esc", "back"]
    ]
  },
  config: {
    title: "Config",
    items: [
      ["j/k or \u2191\u2193", "navigate settings"],
      ["enter", "edit selected setting"],
      ["r", "reset to defaults"],
      ["p", "show config path"],
      ["esc", "back"]
    ]
  },
  onboarding: {
    title: "Welcome",
    items: [
      ["1-6", "enter a screen"],
      ["ctrl+k / :", "open command palette"],
      ["?", "toggle this help"],
      ["q", "quit"]
    ]
  }
};
function HelpOverlay({
  currentRoute
}) {
  const screenGroup = SCREEN_KEYS[currentRoute];
  return /* @__PURE__ */ jsx4(Box4, { flexDirection: "column", padding: 1, children: /* @__PURE__ */ jsxs3(
    Box4,
    {
      flexDirection: "column",
      borderStyle: "double",
      borderColor: theme.primary,
      paddingX: 2,
      paddingY: 1,
      children: [
        /* @__PURE__ */ jsxs3(Box4, { marginBottom: 1, flexDirection: "row", children: [
          /* @__PURE__ */ jsx4(Text3, { color: theme.primary, bold: true, children: "keyboard reference" }),
          /* @__PURE__ */ jsx4(Text3, { color: theme.textMuted, children: " \xB7 press ? to toggle \xB7 esc to close" }),
          /* @__PURE__ */ jsx4(Box4, { flexGrow: 1 }),
          /* @__PURE__ */ jsxs3(Text3, { color: theme.textMuted, children: [
            "current screen \xB7 ",
            currentRoute
          ] })
        ] }),
        /* @__PURE__ */ jsx4(HelpGroupBlock, { group: GLOBAL_GROUP }),
        /* @__PURE__ */ jsx4(HelpGroupBlock, { group: NAV_GROUP }),
        /* @__PURE__ */ jsx4(HelpGroupBlock, { group: screenGroup })
      ]
    }
  ) });
}
function HelpGroupBlock({ group }) {
  return /* @__PURE__ */ jsxs3(Box4, { flexDirection: "column", marginBottom: 1, children: [
    /* @__PURE__ */ jsx4(Text3, { color: theme.textMuted, bold: true, children: group.title.toUpperCase() }),
    group.items.map(([key, label]) => /* @__PURE__ */ jsxs3(Box4, { flexDirection: "row", children: [
      /* @__PURE__ */ jsx4(Box4, { width: 14, children: /* @__PURE__ */ jsx4(Text3, { color: theme.text, backgroundColor: theme.elevated, children: ` ${key} ` }) }),
      /* @__PURE__ */ jsxs3(Text3, { color: theme.textSecondary, children: [
        " ",
        label
      ] })
    ] }, key))
  ] });
}

// src/tui/components/CommandPalette.tsx
import { useMemo, useState } from "react";
import { Box as Box5, Text as Text4, useInput } from "ink";
import Spinner from "ink-spinner";

// src/tui/components/palette-helpers.ts
function filterActions(actions, query) {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return actions;
  return actions.filter(
    (a) => a.id.toLowerCase().includes(q) || a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q)
  );
}
function groupActions(actions) {
  const map = /* @__PURE__ */ new Map();
  for (const action of actions) {
    const bucket = map.get(action.group) ?? [];
    bucket.push(action);
    map.set(action.group, bucket);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}
function clampIndex(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

// src/tui/components/CommandPalette.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function CommandPalette({
  actions,
  onClose
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [busy, setBusy] = useState(null);
  const filtered = useMemo(
    () => filterActions(actions, query),
    [actions, query]
  );
  const safeIndex = clampIndex(selectedIndex, filtered.length);
  const grouped = useMemo(() => groupActions(filtered), [filtered]);
  const runAction = async (action) => {
    setBusy(action.label);
    try {
      await action.run();
    } finally {
      setBusy(null);
      onClose();
    }
  };
  useInput((input, key) => {
    if (busy) return;
    if (key.return) {
      const action = filtered[safeIndex];
      if (action) {
        void runAction(action);
      }
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => clampIndex(i + 1, filtered.length));
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => clampIndex(i - 1, filtered.length));
      return;
    }
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setSelectedIndex(0);
      return;
    }
    if (input && input.length > 0 && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setSelectedIndex(0);
    }
  });
  return /* @__PURE__ */ jsx5(Box5, { flexDirection: "column", padding: 1, children: /* @__PURE__ */ jsxs4(
    Box5,
    {
      flexDirection: "column",
      borderStyle: "double",
      borderColor: theme.primary,
      paddingX: 1,
      paddingY: 1,
      children: [
        /* @__PURE__ */ jsxs4(Box5, { marginBottom: 1, flexDirection: "row", children: [
          /* @__PURE__ */ jsx5(Text4, { color: theme.primary, bold: true, children: ">" }),
          /* @__PURE__ */ jsxs4(Text4, { color: theme.text, children: [
            " ",
            query
          ] }),
          /* @__PURE__ */ jsx5(Text4, { color: theme.primary, children: "\u258E" }),
          /* @__PURE__ */ jsx5(Box5, { flexGrow: 1 }),
          /* @__PURE__ */ jsx5(Text4, { color: theme.textMuted, children: busy ? `running \xB7 ${busy}` : `${filtered.length} of ${actions.length}` })
        ] }),
        busy ? /* @__PURE__ */ jsxs4(Box5, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx5(Text4, { color: theme.primary, children: /* @__PURE__ */ jsx5(Spinner, { type: "dots" }) }),
          /* @__PURE__ */ jsxs4(Text4, { color: theme.textSecondary, children: [
            " ",
            busy,
            " \u2026"
          ] })
        ] }) : filtered.length === 0 ? /* @__PURE__ */ jsx5(Text4, { color: theme.textMuted, children: "no commands match. press esc to close." }) : /* @__PURE__ */ jsx5(Box5, { flexDirection: "column", children: grouped.map((g) => /* @__PURE__ */ jsxs4(Box5, { flexDirection: "column", marginBottom: 1, children: [
          /* @__PURE__ */ jsx5(Text4, { color: theme.textMuted, bold: true, children: g.group.toUpperCase() }),
          g.items.map((action) => {
            const flatIdx = filtered.indexOf(action);
            const sel = flatIdx === safeIndex;
            return /* @__PURE__ */ jsxs4(Box5, { flexDirection: "row", children: [
              /* @__PURE__ */ jsx5(Text4, { color: sel ? theme.primary : theme.borderSoft, children: sel ? "\u258E" : " " }),
              /* @__PURE__ */ jsxs4(Text4, { color: theme.secondary, children: [
                " ",
                glyph("terminal"),
                " "
              ] }),
              /* @__PURE__ */ jsx5(Box5, { flexGrow: 1, children: /* @__PURE__ */ jsx5(Text4, { color: sel ? theme.text : theme.textSecondary, children: action.label }) }),
              /* @__PURE__ */ jsx5(Text4, { color: theme.textMuted, children: action.hint }),
              action.shortcut && /* @__PURE__ */ jsx5(Box5, { marginLeft: 1, children: /* @__PURE__ */ jsx5(
                Text4,
                {
                  color: theme.text,
                  backgroundColor: theme.elevated,
                  children: ` ${action.shortcut} `
                }
              ) })
            ] }, action.id);
          })
        ] }, g.group)) }),
        /* @__PURE__ */ jsx5(Box5, { marginTop: 1, flexDirection: "row", children: /* @__PURE__ */ jsx5(Text4, { color: theme.textMuted, children: "type to filter \xB7 up/down move \xB7 enter run \xB7 esc close" }) })
      ]
    }
  ) });
}

// src/tui/components/SmallScreenWarning.tsx
import { Box as Box6, Text as Text5 } from "ink";
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
function SmallScreenWarning({
  cols,
  rows
}) {
  return /* @__PURE__ */ jsxs5(Box6, { paddingX: 1, children: [
    /* @__PURE__ */ jsx6(Text5, { color: theme.bg, backgroundColor: theme.warning, bold: true, children: ` ${glyph("warn")} ` }),
    /* @__PURE__ */ jsx6(Text5, { color: theme.warning, children: ` terminal is ${cols}\xD7${rows} \u2014 TUI recommends \u2265100\xD730. Panes may truncate.` })
  ] });
}

// src/tui/screens/DashboardScreen.tsx
import { useEffect, useState as useState2 } from "react";
import { Box as Box10, Text as Text10 } from "ink";
import Spinner2 from "ink-spinner";

// src/tui/components/Pane.tsx
import { Box as Box7, Text as Text6 } from "ink";
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
function Pane({
  title,
  focused = false,
  flexGrow,
  flexBasis,
  width,
  right,
  children
}) {
  return /* @__PURE__ */ jsxs6(
    Box7,
    {
      flexDirection: "column",
      borderStyle: "round",
      borderColor: focused ? theme.primary : theme.borderSoft,
      paddingX: 1,
      flexGrow,
      flexBasis,
      width,
      minHeight: 3,
      children: [
        (title || right) && /* @__PURE__ */ jsxs6(Box7, { flexDirection: "row", marginBottom: 1, children: [
          title && /* @__PURE__ */ jsx7(
            Text6,
            {
              color: focused ? theme.text : theme.textSecondary,
              bold: true,
              children: title.toUpperCase()
            }
          ),
          /* @__PURE__ */ jsx7(Box7, { flexGrow: 1 }),
          right
        ] }),
        /* @__PURE__ */ jsx7(Box7, { flexDirection: "column", flexGrow: 1, children })
      ]
    }
  );
}

// src/tui/components/KeyValue.tsx
import { Box as Box8, Text as Text7 } from "ink";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
function KeyValue({
  label,
  value,
  labelWidth = 16
}) {
  return /* @__PURE__ */ jsxs7(Box8, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx8(Box8, { width: labelWidth, children: /* @__PURE__ */ jsx8(Text7, { color: theme.textMuted, children: label }) }),
    typeof value === "string" || typeof value === "number" ? /* @__PURE__ */ jsx8(Text7, { color: theme.text, children: value }) : value
  ] });
}

// src/tui/components/Tag.tsx
import { Text as Text8 } from "ink";
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function Tag({
  children,
  color,
  tone = "subtle"
}) {
  const fg = color ?? theme.textSecondary;
  if (tone === "solid") {
    return /* @__PURE__ */ jsx9(Text8, { color: theme.bg, backgroundColor: fg, bold: true, children: ` ${children} ` });
  }
  return /* @__PURE__ */ jsxs8(Text8, { color: fg, children: [
    "[",
    children,
    "]"
  ] });
}

// src/tui/components/ListRow.tsx
import { Box as Box9, Text as Text9 } from "ink";
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
function ListRow({
  selected = false,
  prefix,
  right,
  dim = false,
  children
}) {
  const indicatorColor = selected ? theme.primary : theme.borderSoft;
  const textColor = dim ? theme.textMuted : theme.text;
  return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx10(Text9, { color: indicatorColor, children: selected ? "\u258E" : " " }),
    prefix !== void 0 && /* @__PURE__ */ jsx10(Box9, { marginRight: 1, marginLeft: 0, children: typeof prefix === "string" ? /* @__PURE__ */ jsx10(Text9, { children: prefix }) : prefix }),
    /* @__PURE__ */ jsx10(Box9, { flexGrow: 1, children: typeof children === "string" ? /* @__PURE__ */ jsx10(Text9, { color: textColor, children }) : children }),
    right !== void 0 && /* @__PURE__ */ jsx10(Box9, { marginLeft: 1, children: typeof right === "string" ? /* @__PURE__ */ jsx10(Text9, { color: theme.textMuted, children: right }) : right })
  ] });
}

// src/modules/devdash/index.ts
import { execa as execa2 } from "execa";

// src/core/project-detector.ts
import path3 from "path";

// src/core/fs.ts
import fs from "fs/promises";
import path from "path";
async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}
async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}
async function readTextFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
async function writeTextFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}
async function readJsonFile(filePath) {
  const raw = await readTextFile(filePath);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function writeJsonFile(filePath, data) {
  await writeTextFile(filePath, `${JSON.stringify(data, null, 2)}
`);
}

// src/core/package-manager.ts
import path2 from "path";
async function detectPackageManager(rootDir) {
  if (await fileExists(path2.join(rootDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (await fileExists(path2.join(rootDir, "yarn.lock"))) {
    return "yarn";
  }
  if (await fileExists(path2.join(rootDir, "bun.lockb"))) {
    return "bun";
  }
  if (await fileExists(path2.join(rootDir, "bun.lock"))) {
    return "bun";
  }
  if (await fileExists(path2.join(rootDir, "package-lock.json"))) {
    return "npm";
  }
  return "unknown";
}

// src/core/project-detector.ts
async function detectProjectContext(cwd) {
  const rootDir = cwd;
  const packageJsonPath = path3.join(rootDir, "package.json");
  const packageJson = await readJsonFile(packageJsonPath);
  const dependencies = packageJson?.dependencies ?? {};
  const devDependencies = packageJson?.devDependencies ?? {};
  const scripts = packageJson?.scripts ?? {};
  const packageManager = await detectPackageManager(rootDir);
  const envFiles = await detectEnvFiles(rootDir);
  return {
    rootDir,
    packageJson,
    packageManager,
    framework: await detectFramework(rootDir, dependencies, devDependencies),
    language: await detectLanguage(rootDir, dependencies, devDependencies),
    hasGit: await directoryExists(path3.join(rootDir, ".git")),
    hasTailwind: await detectTailwind(rootDir, dependencies, devDependencies),
    hasReactRouter: hasDependency(
      dependencies,
      devDependencies,
      "react-router-dom"
    ),
    envFiles,
    scripts,
    dependencies,
    devDependencies
  };
}
async function detectFramework(rootDir, dependencies, devDependencies) {
  if (hasDependency(dependencies, devDependencies, "next")) {
    return "next";
  }
  if (hasDependency(dependencies, devDependencies, "vite") && hasDependency(dependencies, devDependencies, "react")) {
    return "react-vite";
  }
  if (hasDependency(dependencies, devDependencies, "express")) {
    return "express";
  }
  if (await fileExists(path3.join(rootDir, "package.json"))) {
    return "node";
  }
  return "unknown";
}
async function detectLanguage(rootDir, dependencies, devDependencies) {
  if (await fileExists(path3.join(rootDir, "tsconfig.json")) || hasDependency(dependencies, devDependencies, "typescript")) {
    return "typescript";
  }
  if (await fileExists(path3.join(rootDir, "package.json"))) {
    return "javascript";
  }
  return "unknown";
}
async function detectTailwind(rootDir, dependencies, devDependencies) {
  return hasDependency(dependencies, devDependencies, "tailwindcss") || await fileExists(path3.join(rootDir, "tailwind.config.js")) || await fileExists(path3.join(rootDir, "tailwind.config.ts")) || await fileExists(path3.join(rootDir, "tailwind.config.cjs")) || await fileExists(path3.join(rootDir, "tailwind.config.mjs"));
}
async function detectEnvFiles(rootDir) {
  const candidates = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.example"
  ];
  const existing = [];
  for (const candidate of candidates) {
    if (await fileExists(path3.join(rootDir, candidate))) {
      existing.push(candidate);
    }
  }
  return existing;
}
function hasDependency(dependencies, devDependencies, name) {
  return Boolean(dependencies[name] || devDependencies[name]);
}

// src/modules/repo-doctor/rules/express-security.ts
import path5 from "path";

// src/modules/repo-doctor/fixes/express.ts
import path4 from "path";

// src/modules/repo-doctor/utils/safe-text-replace.ts
function replaceLiteralOnce(input, find, replace) {
  const idx = input.indexOf(find);
  if (idx === -1) return null;
  return input.slice(0, idx) + replace + input.slice(idx + find.length);
}
function insertAfter(input, anchor, insertion) {
  const idx = input.indexOf(anchor);
  if (idx === -1) return null;
  const cut = idx + anchor.length;
  return input.slice(0, cut) + insertion + input.slice(cut);
}

// src/modules/repo-doctor/fixes/express.ts
var CANDIDATES = [
  path4.join("src", "index.ts"),
  path4.join("src", "server.ts"),
  "index.ts",
  "server.ts",
  path4.join("src", "index.js"),
  path4.join("src", "server.js"),
  "index.js",
  "server.js"
];
async function findPrimaryServerFile(rootDir) {
  const matches = [];
  for (const candidate of CANDIDATES) {
    const filePath = path4.join(rootDir, candidate);
    if (!await fileExists(filePath)) continue;
    const contents = await readTextFile(filePath);
    if (contents && /express\s*\(/.test(contents)) {
      matches.push({ filePath, contents });
    }
  }
  if (matches.length !== 1) return null;
  return matches[0];
}
function findLastImportEnd(source) {
  const lines = source.split("\n");
  let lastIdx = -1;
  let charCount = 0;
  for (const line of lines) {
    const lineLength = line.length + 1;
    if (/^\s*import\b/.test(line) || /^\s*const\s+\w+\s*=\s*require\(/.test(line)) {
      lastIdx = charCount + line.length;
    }
    charCount += lineLength;
  }
  return lastIdx;
}
async function fixExpressMissingHelmet(ctx, options) {
  const found = await findPrimaryServerFile(ctx.rootDir);
  if (!found) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not identify a single Express entrypoint to modify safely."
    };
  }
  const { filePath, contents } = found;
  if (contents.includes("helmet(")) {
    return {
      fixed: false,
      skipped: true,
      message: "helmet() is already used \u2014 nothing to do."
    };
  }
  const importEnd = findLastImportEnd(contents);
  if (importEnd === -1) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not find a safe place to insert the helmet import \u2014 leaving the file alone."
    };
  }
  const withImport = contents.slice(0, importEnd) + `
import helmet from "helmet";` + contents.slice(importEnd);
  const expressDecl = /const\s+app\s*=\s*express\s*\([^)]*\)\s*;?/;
  const declMatch = withImport.match(expressDecl);
  if (!declMatch) {
    return {
      fixed: false,
      skipped: true,
      message: "Found `helmet` import target but no `const app = express(...)` declaration \u2014 leaving the file alone."
    };
  }
  const next = insertAfter(withImport, declMatch[0], "\n\napp.use(helmet());");
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not insert app.use(helmet()) safely."
    };
  }
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would add helmet import and app.use(helmet()) to ${path4.relative(ctx.rootDir, filePath)}.`
    };
  }
  await writeTextFile(filePath, next);
  return {
    fixed: true,
    message: `Added helmet to ${path4.relative(ctx.rootDir, filePath)}.`
  };
}
async function fixExpressMissingJsonLimit(ctx, options) {
  const found = await findPrimaryServerFile(ctx.rootDir);
  if (!found) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not identify a single Express entrypoint to modify safely."
    };
  }
  const { filePath, contents } = found;
  if (contents.includes("express.json({ limit:")) {
    return {
      fixed: false,
      skipped: true,
      message: "express.json already has a limit configured."
    };
  }
  if (!contents.includes("express.json()")) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not find a literal `express.json()` call to upgrade \u2014 leaving the file alone."
    };
  }
  const next = replaceLiteralOnce(
    contents,
    "express.json()",
    `express.json({ limit: "1mb" })`
  );
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "Could not replace express.json() safely."
    };
  }
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would set express.json({ limit: "1mb" }) in ${path4.relative(ctx.rootDir, filePath)}.`
    };
  }
  await writeTextFile(filePath, next);
  return {
    fixed: true,
    message: `Set express.json({ limit: "1mb" }) in ${path4.relative(ctx.rootDir, filePath)}.`
  };
}

// src/modules/repo-doctor/rules/express-security.ts
async function readExpressServerSources(rootDir) {
  const candidates = [
    path5.join(rootDir, "src", "index.ts"),
    path5.join(rootDir, "src", "server.ts"),
    path5.join(rootDir, "index.ts"),
    path5.join(rootDir, "server.ts"),
    path5.join(rootDir, "src", "index.js"),
    path5.join(rootDir, "src", "server.js"),
    path5.join(rootDir, "index.js"),
    path5.join(rootDir, "server.js")
  ];
  const contents = [];
  for (const candidate of candidates) {
    const raw = await readTextFile(candidate);
    if (raw) {
      contents.push(raw);
    }
  }
  return contents.join("\n");
}
async function getServerSourceIfExpress(ctx) {
  if (ctx.framework !== "express") {
    return null;
  }
  const combined = await readExpressServerSources(ctx.rootDir);
  return combined || null;
}
var expressMissingHelmetRule = {
  id: "express-missing-helmet",
  title: "Express app may be missing helmet",
  category: "express",
  severity: "medium",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);
    if (!source || source.includes("helmet(")) {
      return null;
    }
    return {
      id: "express-missing-helmet",
      title: "Express app may be missing helmet",
      category: "express",
      severity: "medium",
      message: "Use helmet() to add common security headers."
    };
  },
  fix: fixExpressMissingHelmet
};
var expressMissingJsonLimitRule = {
  id: "express-missing-json-limit",
  title: "Express JSON body limit may be missing",
  category: "express",
  severity: "medium",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);
    if (!source || source.includes("express.json({ limit:")) {
      return null;
    }
    return {
      id: "express-missing-json-limit",
      title: "Express JSON body limit may be missing",
      category: "express",
      severity: "medium",
      message: "Use express.json({ limit: '1mb' }) or similar to avoid accepting huge request bodies."
    };
  },
  fix: fixExpressMissingJsonLimit
};
var expressWildcardCorsRule = {
  id: "express-wildcard-cors",
  title: "Express CORS may allow all origins",
  category: "security",
  severity: "high",
  async check(ctx) {
    const source = await getServerSourceIfExpress(ctx);
    if (!source || !source.includes('origin: "*"') && !source.includes("origin: '*'")) {
      return null;
    }
    return {
      id: "express-wildcard-cors",
      title: "Express CORS may allow all origins",
      category: "security",
      severity: "high",
      message: "Avoid wildcard CORS in production. Use an explicit allowed origin list."
    };
  }
};
var expressSecurityRules = [
  expressMissingHelmetRule,
  expressMissingJsonLimitRule,
  expressWildcardCorsRule
];

// src/modules/repo-doctor/rules/frontend-env-secrets.ts
import fs2 from "fs/promises";
import path6 from "path";
var SUSPICIOUS_PATTERNS = [
  "SERVICE_ROLE",
  "SECRET",
  "PRIVATE_KEY",
  "ACCESS_TOKEN"
];
var SCANNABLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts"
]);
var IGNORED_DIRECTORIES = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".vercel",
  "coverage"
]);
async function collectSourceFiles(dir) {
  const files = [];
  const entries = await fs2.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") {
      continue;
    }
    const fullPath = path6.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      files.push(...await collectSourceFiles(fullPath));
      continue;
    }
    if (entry.isFile() && SCANNABLE_EXTENSIONS.has(path6.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}
async function scanForSuspiciousEnvUsage(srcDir) {
  const files = await collectSourceFiles(srcDir);
  const matches = [];
  for (const file of files) {
    const content = await readTextFile(file);
    if (!content) {
      continue;
    }
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (content.includes(pattern)) {
        matches.push({ file, pattern });
      }
    }
  }
  return matches;
}
var frontendEnvSecretsRule = {
  id: "frontend-env-secrets",
  title: "Frontend may reference secret env variables",
  category: "security",
  severity: "high",
  async check(ctx) {
    if (ctx.framework !== "react-vite") {
      return null;
    }
    const srcDir = path6.join(ctx.rootDir, "src");
    if (!await directoryExists(srcDir)) {
      return null;
    }
    const matches = await scanForSuspiciousEnvUsage(srcDir);
    if (matches.length === 0) {
      return null;
    }
    const unique = Array.from(new Set(matches.map((m) => m.pattern))).join(
      ", "
    );
    return {
      id: "frontend-env-secrets",
      title: "Frontend may reference secret env variables",
      category: "security",
      severity: "high",
      message: `Found references to suspicious names (${unique}) in src/. Vite only exposes variables prefixed with VITE_ to the browser, and any such value is publicly readable. Keep secrets on the server.`
    };
  }
};

// src/modules/repo-doctor/rules/index-html-metadata.ts
import path8 from "path";

// src/modules/repo-doctor/fixes/metadata.ts
import path7 from "path";

// src/modules/repo-doctor/utils/insert-into-html.ts
function insertIntoHead(html, tag) {
  const match = html.match(/^([ \t]*)<\/head>/m);
  if (!match) return null;
  const indent = match[1] ?? "";
  const insertAt = html.indexOf(match[0]);
  const lineIndent = `${indent}  `;
  return html.slice(0, insertAt) + lineIndent + tag + "\n" + html.slice(insertAt);
}
function htmlHasMeta(html, name) {
  const pattern = new RegExp(`<meta[^>]+name=["']${name}["']`, "i");
  return pattern.test(html);
}
function htmlHasOgTags(html) {
  return /<meta[^>]+property=["']og:(title|description)["']/i.test(html);
}

// src/modules/repo-doctor/fixes/metadata.ts
var VIEWPORT_TAG = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';
function describeProject(ctx) {
  return ctx.packageJson?.name ?? "this project";
}
async function applyHtmlInsertion(input) {
  const indexPath = path7.join(input.ctx.rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html not found \u2014 nothing to update."
    };
  }
  const raw = await readTextFile(indexPath);
  if (raw === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html could not be read."
    };
  }
  if (input.alreadyPresent(raw)) {
    return {
      fixed: false,
      skipped: true,
      message: "Tag already present \u2014 nothing to do."
    };
  }
  const next = insertIntoHead(raw, input.buildTag(input.ctx));
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html has no </head> closing tag \u2014 refusing to edit blindly."
    };
  }
  if (input.options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would update index.html: ${input.successMessage}`
    };
  }
  await writeTextFile(indexPath, next);
  return { fixed: true, message: input.successMessage };
}
function fixMissingViewportMeta(ctx, options) {
  return applyHtmlInsertion({
    ctx,
    options,
    alreadyPresent: (html) => htmlHasMeta(html, "viewport"),
    buildTag: () => VIEWPORT_TAG,
    successMessage: "Added viewport meta tag to index.html."
  });
}
function fixMissingMetaDescription(ctx, options) {
  return applyHtmlInsertion({
    ctx,
    options,
    alreadyPresent: (html) => htmlHasMeta(html, "description"),
    buildTag: (c) => `<meta name="description" content="${describeProject(c)}" />`,
    successMessage: "Added meta description to index.html."
  });
}
async function fixMissingOpenGraphTags(ctx, options) {
  const indexPath = path7.join(ctx.rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html not found \u2014 nothing to update."
    };
  }
  const raw = await readTextFile(indexPath);
  if (raw === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html could not be read."
    };
  }
  if (htmlHasOgTags(raw)) {
    return {
      fixed: false,
      skipped: true,
      message: "Open Graph tags already present."
    };
  }
  const name = describeProject(ctx);
  const ogTitle = `<meta property="og:title" content="${name}" />`;
  const ogDescription = `<meta property="og:description" content="${name}" />`;
  const afterTitle = insertIntoHead(raw, ogTitle);
  if (afterTitle === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html has no </head> closing tag \u2014 refusing to edit blindly."
    };
  }
  const next = insertIntoHead(afterTitle, ogDescription);
  if (next === null) {
    return {
      fixed: false,
      skipped: true,
      message: "index.html has no </head> closing tag \u2014 refusing to edit blindly."
    };
  }
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: "Would add og:title and og:description meta tags to index.html."
    };
  }
  await writeTextFile(indexPath, next);
  return {
    fixed: true,
    message: "Added og:title and og:description meta tags to index.html."
  };
}

// src/modules/repo-doctor/rules/index-html-metadata.ts
async function readIndexHtml(rootDir) {
  const indexPath = path8.join(rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return null;
  }
  return readTextFile(indexPath);
}
var missingViewportMetaRule = {
  id: "missing-viewport-meta",
  title: "Missing viewport meta tag",
  category: "react",
  severity: "medium",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);
    if (!raw || raw.includes('name="viewport"')) {
      return null;
    }
    return {
      id: "missing-viewport-meta",
      title: "Missing viewport meta tag",
      category: "react",
      severity: "medium",
      message: "Add a viewport meta tag to index.html for proper responsive behavior."
    };
  },
  fix: fixMissingViewportMeta
};
var missingMetaDescriptionRule = {
  id: "missing-meta-description",
  title: "Missing meta description",
  category: "react",
  severity: "low",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);
    if (!raw || raw.includes('name="description"')) {
      return null;
    }
    return {
      id: "missing-meta-description",
      title: "Missing meta description",
      category: "react",
      severity: "low",
      message: "Add a meta description to improve search and link previews."
    };
  },
  fix: fixMissingMetaDescription
};
var missingOpenGraphTagsRule = {
  id: "missing-open-graph-tags",
  title: "Missing Open Graph metadata",
  category: "react",
  severity: "low",
  async check(ctx) {
    const raw = await readIndexHtml(ctx.rootDir);
    if (!raw || htmlHasOgTags(raw)) {
      return null;
    }
    return {
      id: "missing-open-graph-tags",
      title: "Missing Open Graph metadata",
      category: "react",
      severity: "low",
      message: "Add og:title and og:description meta tags before sharing the site publicly."
    };
  },
  fix: fixMissingOpenGraphTags
};
var indexHtmlMetadataRules = [
  missingViewportMetaRule,
  missingMetaDescriptionRule,
  missingOpenGraphTagsRule
];

// src/modules/repo-doctor/rules/missing-env-example.ts
import path9 from "path";
var missingEnvExampleRule = {
  id: "missing-env-example",
  title: "Missing .env.example",
  category: "env",
  severity: "medium",
  async check(ctx) {
    if (!ctx.packageJson || ctx.envFiles.includes(".env.example")) {
      return null;
    }
    return {
      id: "missing-env-example",
      title: "Missing .env.example",
      category: "env",
      severity: "medium",
      message: "Add .env.example so required environment variables are documented."
    };
  },
  async fix(ctx, options) {
    if (options.dryRun) {
      return {
        fixed: false,
        preview: true,
        message: "Would create .env.example."
      };
    }
    await writeTextFile(
      path9.join(ctx.rootDir, ".env.example"),
      "# Add required environment variables here.\n"
    );
    return {
      fixed: true,
      message: "Created .env.example."
    };
  }
};

// src/modules/repo-doctor/rules/missing-package-json.ts
var missingPackageJsonRule = {
  id: "missing-package-json",
  title: "Missing package.json",
  category: "project",
  severity: "high",
  async check(ctx) {
    if (ctx.packageJson) {
      return null;
    }
    return {
      id: "missing-package-json",
      title: "Missing package.json",
      category: "project",
      severity: "high",
      message: "This directory does not look like a Node/TypeScript project."
    };
  }
};

// src/modules/repo-doctor/fixes/scripts.ts
import path10 from "path";

// src/modules/repo-doctor/utils/update-package-json.ts
function addScript(pkg, name, command) {
  const existing = pkg.scripts ?? {};
  if (existing[name]) {
    return { next: pkg, added: false };
  }
  return {
    next: {
      ...pkg,
      scripts: { ...existing, [name]: command }
    },
    added: true
  };
}
function serializePackageJson(pkg) {
  return `${JSON.stringify(pkg, null, 2)}
`;
}

// src/modules/repo-doctor/fixes/scripts.ts
function suggestedBuildCommand(ctx) {
  switch (ctx.framework) {
    case "react-vite":
      return "tsc -b && vite build";
    case "next":
      return "next build";
    case "express":
      return ctx.language === "typescript" ? "tsc" : null;
    case "node":
    case "unknown":
      return null;
  }
}
function hasEslint(ctx) {
  return Boolean(
    ctx.dependencies["eslint"] || ctx.devDependencies["eslint"]
  );
}
async function applyScriptFix(input) {
  if (input.command === null) {
    return {
      fixed: false,
      skipped: true,
      message: input.reasonWhenSkipped
    };
  }
  const pkgPath = path10.join(input.ctx.rootDir, "package.json");
  const raw = await readJsonFile(pkgPath);
  if (!raw) {
    return {
      fixed: false,
      skipped: true,
      message: "package.json could not be read."
    };
  }
  const { next, added } = addScript(raw, input.scriptName, input.command);
  if (!added) {
    return {
      fixed: false,
      skipped: true,
      message: `Script "${input.scriptName}" already exists \u2014 preserving it.`
    };
  }
  if (input.options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: `Would add "${input.scriptName}": "${input.command}" to package.json.`
    };
  }
  await writeTextFile(pkgPath, serializePackageJson(next));
  return {
    fixed: true,
    message: `Added "${input.scriptName}": "${input.command}" to package.json.`
  };
}
function fixMissingBuildScript(ctx, options) {
  return applyScriptFix({
    ctx,
    options,
    scriptName: "build",
    command: suggestedBuildCommand(ctx),
    reasonWhenSkipped: "Cannot auto-fix a build script: framework is not a known type with a default build command."
  });
}
function fixMissingLintScript(ctx, options) {
  return applyScriptFix({
    ctx,
    options,
    scriptName: "lint",
    command: hasEslint(ctx) ? "eslint ." : null,
    reasonWhenSkipped: "Cannot auto-fix a lint script: ESLint is not installed. Add `eslint` first."
  });
}

// src/modules/repo-doctor/rules/missing-scripts.ts
var missingBuildScriptRule = {
  id: "missing-build-script",
  title: "Missing build script",
  category: "project",
  severity: "medium",
  async check(ctx) {
    if (!ctx.packageJson || ctx.scripts.build) {
      return null;
    }
    return {
      id: "missing-build-script",
      title: "Missing build script",
      category: "project",
      severity: "medium",
      message: "Add a build script so deployment tools can build the project consistently."
    };
  },
  fix: fixMissingBuildScript
};
var missingLintScriptRule = {
  id: "missing-lint-script",
  title: "Missing lint script",
  category: "project",
  severity: "low",
  async check(ctx) {
    if (!ctx.packageJson || ctx.scripts.lint) {
      return null;
    }
    return {
      id: "missing-lint-script",
      title: "Missing lint script",
      category: "project",
      severity: "low",
      message: "Add a lint script so code quality checks are easy to run."
    };
  },
  fix: fixMissingLintScript
};
var missingScriptsRules = [
  missingBuildScriptRule,
  missingLintScriptRule
];

// src/modules/repo-doctor/rules/vercel-spa-rewrite.ts
import path12 from "path";

// src/modules/repo-doctor/fixes/vercel.ts
import path11 from "path";
var VERCEL_SPA_CONFIG = {
  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ]
};
async function fixVercelSpaRewrite(ctx, options) {
  const vercelPath = path11.join(ctx.rootDir, "vercel.json");
  if (await fileExists(vercelPath)) {
    return {
      fixed: false,
      skipped: true,
      message: "vercel.json already exists. Refusing to overwrite \u2014 edit it manually to add the SPA rewrite."
    };
  }
  const content = `${JSON.stringify(VERCEL_SPA_CONFIG, null, 2)}
`;
  if (options.dryRun) {
    return {
      fixed: false,
      preview: true,
      message: "Would create vercel.json with SPA fallback rewrite."
    };
  }
  await writeTextFile(vercelPath, content);
  return {
    fixed: true,
    message: "Created vercel.json with SPA fallback rewrite."
  };
}

// src/modules/repo-doctor/rules/vercel-spa-rewrite.ts
var vercelSpaRewriteRule = {
  id: "vercel-spa-rewrite",
  title: "Vercel SPA rewrite",
  category: "deployment",
  severity: "high",
  async check(ctx) {
    if (ctx.framework !== "react-vite" || !ctx.hasReactRouter) {
      return null;
    }
    const vercelPath = path12.join(ctx.rootDir, "vercel.json");
    if (!await fileExists(vercelPath)) {
      return {
        id: "vercel-spa-rewrite",
        title: "Missing vercel.json for React Router app",
        category: "deployment",
        severity: "high",
        message: "Create vercel.json with a fallback rewrite to /index.html to avoid 404s on refresh."
      };
    }
    const raw = await readTextFile(vercelPath);
    if (!raw?.includes("index.html")) {
      return {
        id: "vercel-spa-rewrite",
        title: "Vercel SPA rewrite may be missing",
        category: "deployment",
        severity: "high",
        message: "vercel.json exists, but it does not appear to rewrite unmatched routes to /index.html."
      };
    }
    return null;
  },
  fix: fixVercelSpaRewrite
};

// src/modules/repo-doctor/rules/index.ts
var allRules = [
  missingPackageJsonRule,
  ...missingScriptsRules,
  missingEnvExampleRule,
  vercelSpaRewriteRule,
  ...indexHtmlMetadataRules,
  ...expressSecurityRules,
  frontendEnvSecretsRule
];

// src/modules/repo-doctor/index.ts
async function runDoctor(options) {
  const ctx = await detectProjectContext(options.cwd);
  const selectedRules = allRules.filter(
    (rule) => matchesSelection(rule, options)
  );
  const issues = [];
  for (const rule of selectedRules) {
    const issue = await rule.check(ctx);
    if (!issue) {
      continue;
    }
    if (options.fix && rule.fix) {
      const fixResult = await rule.fix(ctx, {
        dryRun: Boolean(options.dryRun)
      });
      if (fixResult.fixed) {
        issue.fixed = true;
      }
      if (fixResult.preview) {
        issue.fixPreview = true;
      }
      if (fixResult.skipped) {
        issue.fixSkipped = true;
      }
      if (fixResult.message) {
        issue.message = fixResult.message;
      }
    }
    issues.push(issue);
  }
  return {
    projectRoot: ctx.rootDir,
    issues
  };
}
function matchesSelection(rule, options) {
  if (options.rule && rule.id !== options.rule) {
    return false;
  }
  if (options.category && rule.category !== options.category) {
    return false;
  }
  return true;
}

// src/core/shell.ts
import { execa } from "execa";
async function runCommand(command, args, options) {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd,
      stdout: options.inherit ? "inherit" : "pipe",
      stderr: options.inherit ? "inherit" : "pipe"
    });
    return {
      success: true,
      stdout: typeof result.stdout === "string" ? result.stdout : "",
      stderr: typeof result.stderr === "string" ? result.stderr : ""
    };
  } catch (error) {
    if (error instanceof Error && "stdout" in error && "stderr" in error) {
      const commandError = error;
      return {
        success: false,
        stdout: commandError.stdout ?? "",
        stderr: commandError.stderr ?? error.message
      };
    }
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown command error"
    };
  }
}

// src/modules/launchcheck/checks/build.ts
var buildChecks = async ({
  context,
  skipBuild
}) => {
  if (!context.packageJson || !context.scripts.build) {
    return [];
  }
  if (skipBuild) {
    return [
      {
        id: "build-skipped",
        title: "Production build skipped",
        status: "warn",
        message: "Re-run without --skip-build before launching for real."
      }
    ];
  }
  const { command, args } = getBuildCommand(context.packageManager);
  const result = await runCommand(command, args, { cwd: context.rootDir });
  const check = result.success ? {
    id: "build-passes",
    title: "Production build passes",
    status: "pass"
  } : {
    id: "build-fails",
    title: "Production build passes",
    status: "fail",
    message: "Build failed. Run your build command manually to inspect the full error."
  };
  return [check];
};
function getBuildCommand(packageManager) {
  switch (packageManager) {
    case "pnpm":
      return { command: "pnpm", args: ["build"] };
    case "yarn":
      return { command: "yarn", args: ["build"] };
    case "bun":
      return { command: "bun", args: ["run", "build"] };
    case "npm":
    case "unknown":
      return { command: "npm", args: ["run", "build"] };
  }
}

// src/modules/launchcheck/checks/env.ts
import path13 from "path";
var TEST_MODE_HINTS = [
  { key: "STRIPE_SECRET_KEY", marker: "sk_test_", provider: "Stripe" },
  { key: "STRIPE_PUBLISHABLE_KEY", marker: "pk_test_", provider: "Stripe" },
  { key: "VITE_STRIPE_PUBLISHABLE_KEY", marker: "pk_test_", provider: "Stripe" },
  { key: "SQUARE_ENVIRONMENT", marker: "sandbox", provider: "Square" },
  { key: "SQUARE_ACCESS_TOKEN", marker: "EAAAEa", provider: "Square sandbox" }
];
var envChecks = async ({ context }) => {
  if (!context.packageJson) {
    return [];
  }
  const checks = [];
  checks.push({
    id: "env-example",
    title: ".env.example exists",
    status: context.envFiles.includes(".env.example") ? "pass" : "warn",
    message: context.envFiles.includes(".env.example") ? void 0 : "Document required environment variables in .env.example."
  });
  const testModeFindings = await detectTestModeKeys(context.rootDir);
  if (testModeFindings.length > 0) {
    const providers = Array.from(new Set(testModeFindings.map((f) => f.provider)));
    checks.push({
      id: "payment-test-mode",
      title: "Payment env variables look like test/sandbox keys",
      status: "warn",
      message: `Found ${providers.join(", ")} test/sandbox values in local env files (${testModeFindings.map((f) => f.key).join(", ")}). Switch to live keys before launch.`
    });
  }
  return checks;
};
async function detectTestModeKeys(rootDir) {
  const candidates = [".env", ".env.local", ".env.production"];
  const findings = [];
  for (const candidate of candidates) {
    const raw = await readTextFile(path13.join(rootDir, candidate));
    if (!raw) continue;
    for (const hint of TEST_MODE_HINTS) {
      const line = raw.split("\n").find((l) => l.trim().startsWith(`${hint.key}=`));
      if (line && line.includes(hint.marker)) {
        findings.push({ key: hint.key, provider: hint.provider });
      }
    }
  }
  return findings;
}

// src/modules/launchcheck/checks/images.ts
import fs3 from "fs/promises";
import path14 from "path";
var MAX_BYTES = 1e6;
var imageChecks = async ({ context }) => {
  const publicDir = path14.join(context.rootDir, "public");
  if (!await directoryExists(publicDir)) {
    return [];
  }
  const largeFiles = await findLargeFiles(publicDir, MAX_BYTES);
  const check = largeFiles.length === 0 ? {
    id: "large-images",
    title: "No oversized public assets",
    status: "pass"
  } : {
    id: "large-images",
    title: "No oversized public assets",
    status: "warn",
    message: `${largeFiles.length} file(s) over 1 MB in public/. Compress before launch (${largeFiles.slice(0, 3).map((f) => path14.relative(context.rootDir, f)).join(", ")}${largeFiles.length > 3 ? ", ..." : ""}).`
  };
  return [check];
};
async function findLargeFiles(dir, maxBytes) {
  const results = [];
  const entries = await fs3.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path14.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findLargeFiles(fullPath, maxBytes));
      continue;
    }
    if (!entry.isFile()) continue;
    const stat = await fs3.stat(fullPath);
    if (stat.size > maxBytes) {
      results.push(fullPath);
    }
  }
  return results;
}

// src/modules/launchcheck/checks/links.ts
import fs4 from "fs/promises";
import path15 from "path";
var SCANNABLE_EXTENSIONS2 = /* @__PURE__ */ new Set([".tsx", ".jsx", ".ts", ".js", ".html"]);
var IGNORED_DIRECTORIES2 = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".vercel",
  ".turbo",
  "coverage"
]);
var SUSPICIOUS_PATTERNS2 = [
  /href=["']\s*#\s*["']/g,
  /href=["']TODO["']/gi,
  /href=["']FIXME["']/gi,
  /to=["']TODO["']/gi,
  /to=["']FIXME["']/gi,
  /href=["']javascript:void\(0\)["']/gi
];
var linkChecks = async ({ context }) => {
  const targets = [];
  const srcDir = path15.join(context.rootDir, "src");
  if (await directoryExists(srcDir)) {
    targets.push(...await collectFiles(srcDir));
  }
  const indexHtml = path15.join(context.rootDir, "index.html");
  if (await fileExists(indexHtml)) {
    targets.push(indexHtml);
  }
  if (targets.length === 0) {
    return [];
  }
  const findings = [];
  for (const file of targets) {
    const content = await readTextFile(file);
    if (!content) continue;
    for (const pattern of SUSPICIOUS_PATTERNS2) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);
      if (match) {
        findings.push({ file, snippet: match[0] });
        break;
      }
    }
  }
  const check = findings.length === 0 ? {
    id: "broken-links",
    title: "No obvious broken/placeholder links",
    status: "pass"
  } : {
    id: "broken-links",
    title: "Obvious placeholder or broken links found",
    status: "warn",
    message: `${findings.length} suspicious link(s) found, including: ${findings.slice(0, 3).map(
      (f) => `${path15.relative(context.rootDir, f.file)} (${f.snippet})`
    ).join("; ")}${findings.length > 3 ? "; ..." : ""}.`
  };
  return [check];
};
async function collectFiles(dir) {
  const results = [];
  const entries = await fs4.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path15.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES2.has(entry.name)) continue;
      results.push(...await collectFiles(fullPath));
      continue;
    }
    if (entry.isFile() && SCANNABLE_EXTENSIONS2.has(path15.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

// src/modules/launchcheck/live/analyze-html.ts
var LOCALHOST_PATTERNS = [
  /localhost(?::\d+)?/gi,
  /127\.0\.0\.1(?::\d+)?/g
];
var TEST_ENV_PATTERNS = [
  { label: "Stripe test key (pk_test_)", pattern: /pk_test_[A-Za-z0-9]{4,}/g },
  { label: "Stripe test key (sk_test_)", pattern: /sk_test_[A-Za-z0-9]{4,}/g },
  { label: "Square sandbox", pattern: /squareupsandbox\.com/gi },
  { label: "Square sandbox env", pattern: /SQUARE_ENVIRONMENT["']?:\s*["']sandbox/gi },
  { label: "Supabase local URL", pattern: /supabase\.co.*?test/gi }
];
function uniqueMatches(input, patterns) {
  const found = /* @__PURE__ */ new Set();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(input)) !== null) {
      found.add(match[0]);
      if (found.size >= 8) break;
    }
  }
  return Array.from(found);
}
function matchAttribute(html, regex) {
  const match = html.match(regex);
  if (!match) return null;
  const value = match[1];
  return value && value.trim().length > 0 ? value.trim() : null;
}
function analyzeHtml(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasDescription = /<meta[^>]+name=["']description["']/i.test(html);
  const hasOpenGraph = /<meta[^>]+property=["']og:(title|description)["']/i.test(html);
  const canonical = matchAttribute(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
  );
  const localhost = uniqueMatches(html, LOCALHOST_PATTERNS);
  const testEnv = TEST_ENV_PATTERNS.flatMap((entry) => {
    entry.pattern.lastIndex = 0;
    return entry.pattern.test(html) ? [entry.label] : [];
  });
  return {
    title: title && title.length > 0 ? title : null,
    hasViewport,
    hasDescription,
    hasOpenGraph,
    canonical,
    bodyBytes: Buffer.byteLength(html, "utf8"),
    localhostReferences: localhost,
    testEnvReferences: Array.from(new Set(testEnv))
  };
}

// src/modules/launchcheck/live/headers.ts
var COMPRESSION_VALUES = /* @__PURE__ */ new Set(["gzip", "br", "deflate", "zstd"]);
function analyzeHeaders(headers) {
  const contentType = headers.get("content-type") ?? null;
  const cacheControl = headers.get("cache-control") ?? null;
  const contentEncoding = headers.get("content-encoding") ?? null;
  const rawLength = headers.get("content-length");
  const contentLength = rawLength ? Number(rawLength) : null;
  const isHtml = contentType ? contentType.toLowerCase().startsWith("text/html") : false;
  const hasCompression = contentEncoding ? contentEncoding.toLowerCase().split(/,\s*/).some((value) => COMPRESSION_VALUES.has(value)) : false;
  const hasCacheControl = Boolean(
    cacheControl && cacheControl.trim().length > 0
  );
  return {
    contentType,
    cacheControl,
    contentEncoding,
    contentLength: Number.isFinite(contentLength) ? contentLength : null,
    isHtml,
    hasCompression,
    hasCacheControl
  };
}

// src/modules/launchcheck/live/fetch-url.ts
var DEFAULT_TIMEOUT_MS = 1e4;
async function fetchUrl(url, options = {}) {
  const fetcher = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== "function") {
    return {
      kind: "error",
      error: "fetch is not available in this Node runtime."
    };
  }
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetcher(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "forge-launch/0.1" }
    });
    const headersArrived = Date.now();
    const body = await response.text();
    const finished = Date.now();
    const headers = /* @__PURE__ */ new Map();
    response.headers.forEach((value, name) => {
      headers.set(name.toLowerCase(), value);
    });
    return {
      kind: "ok",
      status: response.status,
      headers,
      body,
      ttfbMs: headersArrived - started,
      totalMs: finished - started
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      kind: "error",
      error: controller.signal.aborted ? `Request timed out after ${timeoutMs}ms` : message
    };
  } finally {
    clearTimeout(timeout);
  }
}

// src/modules/launchcheck/live/lighthouse-lite.ts
var MAX_HTML_BYTES = 1e6;
var SLOW_TTFB_MS = 800;
async function runLiveChecks(options) {
  const checks = [];
  const result = await fetchUrl(options.url, {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs
  });
  if (result.kind === "error") {
    checks.push({
      id: "live-reachable",
      title: "Deployment URL is reachable",
      status: "fail",
      message: `Could not fetch ${options.url}: ${result.error}`
    });
    return checks;
  }
  checks.push({
    id: "live-reachable",
    title: "Deployment URL is reachable",
    status: "pass",
    message: `Fetched ${options.url} in ${result.totalMs}ms (TTFB ${result.ttfbMs}ms).`
  });
  checks.push({
    id: "live-status",
    title: "HTTP status is 200",
    status: result.status === 200 ? "pass" : "fail",
    message: result.status === 200 ? void 0 : `Got HTTP ${result.status}.`
  });
  const headers = analyzeHeaders(result.headers);
  checks.push({
    id: "live-content-type",
    title: "Content-Type is text/html",
    status: headers.isHtml ? "pass" : "fail",
    message: headers.isHtml ? void 0 : `Got Content-Type "${headers.contentType ?? "(none)"}".`
  });
  if (headers.isHtml) {
    const html = analyzeHtml(result.body);
    checks.push({
      id: "live-title",
      title: "HTML <title> is present",
      status: html.title ? "pass" : "fail",
      message: html.title ? `Title: "${html.title}"` : "Page has no non-empty <title>."
    });
    checks.push({
      id: "live-meta-description",
      title: "Meta description present",
      status: html.hasDescription ? "pass" : "warn",
      message: html.hasDescription ? void 0 : "Add a meta description for better search previews."
    });
    checks.push({
      id: "live-viewport",
      title: "Viewport meta tag present",
      status: html.hasViewport ? "pass" : "warn",
      message: html.hasViewport ? void 0 : "Add a viewport meta tag for responsive behavior."
    });
    checks.push({
      id: "live-open-graph",
      title: "Open Graph metadata present",
      status: html.hasOpenGraph ? "pass" : "warn",
      message: html.hasOpenGraph ? void 0 : "Add og:title and og:description for shareable previews."
    });
    checks.push({
      id: "live-canonical",
      title: "Canonical URL present",
      status: html.canonical ? "pass" : "warn",
      message: html.canonical ? `Canonical: ${html.canonical}` : 'Add a <link rel="canonical"> to disambiguate URLs for search engines.'
    });
    checks.push({
      id: "live-payload-size",
      title: "HTML payload under 1 MB",
      status: html.bodyBytes <= MAX_HTML_BYTES ? "pass" : "warn",
      message: html.bodyBytes <= MAX_HTML_BYTES ? `HTML is ${formatBytes(html.bodyBytes)}.` : `HTML is ${formatBytes(html.bodyBytes)} \u2014 consider trimming inline assets.`
    });
    checks.push({
      id: "live-no-localhost",
      title: "No localhost references in HTML",
      status: html.localhostReferences.length === 0 ? "pass" : "fail",
      message: html.localhostReferences.length === 0 ? void 0 : `Found ${html.localhostReferences.length} localhost reference(s): ${html.localhostReferences.slice(0, 3).join(", ")}`
    });
    checks.push({
      id: "live-no-test-env",
      title: "No obvious test/sandbox env references",
      status: html.testEnvReferences.length === 0 ? "pass" : "warn",
      message: html.testEnvReferences.length === 0 ? void 0 : `Found test/sandbox markers: ${html.testEnvReferences.join(", ")}`
    });
  }
  checks.push({
    id: "live-cache-control",
    title: "Cache-Control header present",
    status: headers.hasCacheControl ? "pass" : "warn",
    message: headers.hasCacheControl ? `Cache-Control: ${headers.cacheControl}` : "No Cache-Control header. Set explicit caching at the edge."
  });
  checks.push({
    id: "live-compression",
    title: "Response is compressed",
    status: headers.hasCompression ? "pass" : "warn",
    message: headers.hasCompression ? `Content-Encoding: ${headers.contentEncoding}` : "No gzip/br compression detected. Enable compression at the edge."
  });
  checks.push({
    id: "live-ttfb",
    title: "Time to first byte under 800ms",
    status: result.ttfbMs <= SLOW_TTFB_MS ? "pass" : "warn",
    message: result.ttfbMs <= SLOW_TTFB_MS ? `TTFB: ${result.ttfbMs}ms` : `TTFB is ${result.ttfbMs}ms \u2014 slower than ${SLOW_TTFB_MS}ms. Investigate caching or cold starts.`
  });
  return checks;
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

// src/modules/launchcheck/checks/live.ts
var liveChecks = async ({ url }) => {
  if (!url) {
    return [];
  }
  return runLiveChecks({ url });
};

// src/modules/launchcheck/checks/metadata.ts
import path16 from "path";
var metadataChecks = async ({ context }) => {
  if (context.framework !== "react-vite" && context.framework !== "next") {
    return [];
  }
  const indexPath = path16.join(context.rootDir, "index.html");
  if (!await fileExists(indexPath)) {
    return [];
  }
  const raw = await readTextFile(indexPath);
  if (!raw) {
    return [];
  }
  const checks = [];
  const hasTitle = /<title>[^<\s][^<]*<\/title>/i.test(raw);
  checks.push({
    id: "html-title",
    title: "index.html has a non-empty <title>",
    status: hasTitle ? "pass" : "fail",
    message: hasTitle ? void 0 : "Set a real <title> in index.html before launch."
  });
  const hasViewport = raw.includes('name="viewport"');
  checks.push({
    id: "viewport",
    title: "Viewport meta tag exists",
    status: hasViewport ? "pass" : "warn",
    message: hasViewport ? void 0 : "Add a viewport tag for responsive behavior."
  });
  const hasDescription = raw.includes('name="description"');
  checks.push({
    id: "meta-description",
    title: "Meta description exists",
    status: hasDescription ? "pass" : "warn",
    message: hasDescription ? void 0 : "Add a meta description for better search previews."
  });
  const hasOpenGraph = raw.includes("og:title") || raw.includes("og:description");
  checks.push({
    id: "open-graph",
    title: "Open Graph metadata exists",
    status: hasOpenGraph ? "pass" : "warn",
    message: hasOpenGraph ? void 0 : "Add og:title and og:description before sharing the site publicly."
  });
  return checks;
};

// src/modules/launchcheck/checks/package.ts
var packageChecks = async ({ context }) => {
  const checks = [];
  checks.push({
    id: "package-json",
    title: "package.json exists",
    status: context.packageJson ? "pass" : "fail",
    message: context.packageJson ? void 0 : "This does not look like a Node project."
  });
  if (!context.packageJson) {
    return checks;
  }
  checks.push({
    id: "build-script",
    title: "Build script exists",
    status: context.scripts.build ? "pass" : "fail",
    message: context.scripts.build ? void 0 : "Add a build script before deploying."
  });
  return checks;
};

// src/modules/launchcheck/checks/vercel.ts
import path17 from "path";
var vercelChecks = async ({ context }) => {
  if (context.framework !== "react-vite" || !context.hasReactRouter) {
    return [];
  }
  const vercelPath = path17.join(context.rootDir, "vercel.json");
  if (!await fileExists(vercelPath)) {
    return [
      {
        id: "vercel-json",
        title: "Vercel SPA rewrite exists",
        status: "fail",
        message: "React Router apps on Vercel need a fallback rewrite to /index.html."
      }
    ];
  }
  const raw = await readTextFile(vercelPath);
  const hasRewrite = Boolean(raw?.includes("index.html"));
  return [
    {
      id: "vercel-spa-rewrite",
      title: "Vercel SPA rewrite exists",
      status: hasRewrite ? "pass" : "fail",
      message: hasRewrite ? void 0 : "vercel.json exists, but it does not appear to rewrite to /index.html."
    }
  ];
};

// src/modules/launchcheck/checks/index.ts
var LOCAL_CHECKS = [
  packageChecks,
  envChecks,
  vercelChecks,
  metadataChecks,
  imageChecks,
  linkChecks,
  buildChecks
];
var LIVE_CHECKS = [liveChecks];
var ALL_CHECKS = [
  ...LOCAL_CHECKS,
  ...LIVE_CHECKS
];

// src/modules/launchcheck/index.ts
async function runLaunchCheck(options) {
  const context = await detectProjectContext(options.cwd);
  if (options.liveOnly && !options.url) {
    throw new Error("--live-only requires --url <url>.");
  }
  const runners = options.liveOnly ? LIVE_CHECKS : options.url ? [...LOCAL_CHECKS, ...LIVE_CHECKS] : LOCAL_CHECKS;
  const checks = [];
  for (const runner of runners) {
    const result = await runner({
      context,
      url: options.url,
      skipBuild: options.skipBuild
    });
    checks.push(...result);
  }
  return {
    projectRoot: context.rootDir,
    score: calculateScore(checks, options.strict),
    status: aggregateStatus(checks, options.strict),
    strict: options.strict,
    checks
  };
}
function calculateScore(checks, strict) {
  if (checks.length === 0) return 0;
  const weights = { pass: 10, warn: strict ? 0 : 5, fail: 0 };
  const earned = checks.reduce((sum, check) => sum + weights[check.status], 0);
  const total = checks.length * 10;
  return Math.round(earned / total * 100);
}
function aggregateStatus(checks, strict) {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return strict ? "fail" : "warn";
  return "pass";
}

// src/modules/devdash/index.ts
async function getProjectDashboard(options) {
  const context = await detectProjectContext(options.cwd);
  if (!context.packageJson) {
    return {
      projectRoot: context.rootDir,
      rows: [
        { label: "Project", value: "Unknown" },
        { label: "Status", value: "No package.json found" }
      ],
      doctor: null,
      launch: null
    };
  }
  const doctor = await summarizeDoctor(context.rootDir);
  const launch = options.withLaunch ? await summarizeLaunch(context.rootDir, !options.withBuild) : null;
  const rows = [
    { label: "Project", value: context.packageJson.name ?? "Unnamed project" },
    { label: "Framework", value: formatFramework(context.framework) },
    { label: "Language", value: formatLanguage(context.language) },
    { label: "Package manager", value: context.packageManager },
    { label: "TypeScript", value: context.language === "typescript" ? "yes" : "no" },
    { label: "Tailwind", value: context.hasTailwind ? "yes" : "no" },
    { label: "React Router", value: context.hasReactRouter ? "yes" : "no" },
    { label: "Git", value: await getGitStatus(context.rootDir) },
    {
      label: "Env files",
      value: context.envFiles.length > 0 ? context.envFiles.join(", ") : "none"
    },
    {
      label: "Scripts",
      value: Object.keys(context.scripts).length > 0 ? Object.keys(context.scripts).join(", ") : "none"
    },
    { label: "Doctor", value: formatDoctorSummary(doctor) }
  ];
  if (launch) {
    rows.push({ label: "Launch", value: formatLaunchSummary(launch) });
  }
  return {
    projectRoot: context.rootDir,
    rows,
    doctor,
    launch
  };
}
async function summarizeDoctor(cwd) {
  const result = await runDoctor({ cwd, fix: false });
  return summarizeDoctorIssues(result.issues);
}
function summarizeDoctorIssues(issues) {
  const bySeverity = {
    low: 0,
    medium: 0,
    high: 0
  };
  for (const issue of issues) {
    bySeverity[issue.severity]++;
  }
  return {
    total: issues.length,
    bySeverity
  };
}
async function summarizeLaunch(cwd, skipBuild) {
  const result = await runLaunchCheck({
    cwd,
    skipBuild,
    strict: false
  });
  return summarizeLaunchResult(result, !skipBuild);
}
function summarizeLaunchResult(result, ranBuild) {
  return {
    score: result.score,
    status: result.status,
    pass: result.checks.filter((c) => c.status === "pass").length,
    warn: result.checks.filter((c) => c.status === "warn").length,
    fail: result.checks.filter((c) => c.status === "fail").length,
    ranBuild
  };
}
function formatDoctorSummary(summary) {
  if (summary.total === 0) return "clean";
  const parts = [`${summary.total} issue(s)`];
  if (summary.bySeverity.high > 0) parts.push(`${summary.bySeverity.high} high`);
  if (summary.bySeverity.medium > 0)
    parts.push(`${summary.bySeverity.medium} medium`);
  if (summary.bySeverity.low > 0) parts.push(`${summary.bySeverity.low} low`);
  return parts.join(", ");
}
function formatLaunchSummary(summary) {
  const buildNote = summary.ranBuild ? "with build" : "no build";
  return `${summary.score}/100 \u2014 ${summary.status.toUpperCase()} (${summary.pass} pass / ${summary.warn} warn / ${summary.fail} fail, ${buildNote})`;
}
function formatFramework(framework) {
  switch (framework) {
    case "react-vite":
      return "React + Vite";
    case "next":
      return "Next.js";
    case "express":
      return "Express";
    case "node":
      return "Node";
    default:
      return "Unknown";
  }
}
function formatLanguage(language) {
  switch (language) {
    case "typescript":
      return "TypeScript";
    case "javascript":
      return "JavaScript";
    default:
      return "Unknown";
  }
}
async function getGitStatus(cwd) {
  try {
    const result = await execa2("git", ["status", "--short"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe"
    });
    const changedFiles = result.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
    return changedFiles.length === 0 ? "clean" : `${changedFiles.length} changed file(s)`;
  } catch {
    return "not a git repo";
  }
}

// src/modules/stackpack/recipe-store.ts
import fs6 from "fs/promises";
import path20 from "path";

// src/core/config.ts
import os from "os";
import path18 from "path";

// src/schemas/forge-config.schema.ts
import { z } from "zod";
var ForgeConfigSchema = z.object({
  version: z.string().default("0.1.0"),
  preferredPackageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).default("npm"),
  defaultPromptMode: z.enum(["plan", "implement", "review"]).default("plan"),
  componentStyle: z.enum(["named-export", "default-export"]).default("named-export"),
  testFramework: z.enum(["vitest", "jest", "none"]).default("vitest")
});

// src/core/config.ts
function getForgeHomeDir() {
  return path18.join(os.homedir(), ".forge");
}
function getForgeConfigPath() {
  return path18.join(getForgeHomeDir(), "config.json");
}
async function ensureForgeHome() {
  await ensureDir(getForgeHomeDir());
  await ensureDir(path18.join(getForgeHomeDir(), "recipes"));
  await ensureDir(path18.join(getForgeHomeDir(), "prompts"));
  await ensureDir(path18.join(getForgeHomeDir(), "templates"));
}
async function readForgeConfig() {
  await ensureForgeHome();
  const configPath = getForgeConfigPath();
  const rawConfig = await readJsonFile(configPath);
  if (!rawConfig) {
    const defaultConfig = ForgeConfigSchema.parse({});
    await writeForgeConfig(defaultConfig);
    return defaultConfig;
  }
  const parsed = ForgeConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    const defaultConfig = ForgeConfigSchema.parse({});
    await writeForgeConfig(defaultConfig);
    return defaultConfig;
  }
  return parsed.data;
}
async function writeForgeConfig(config) {
  await ensureForgeHome();
  await writeJsonFile(getForgeConfigPath(), ForgeConfigSchema.parse(config));
}

// src/core/template-loader.ts
import fs5 from "fs/promises";
import os2 from "os";
import path19 from "path";
import { fileURLToPath } from "url";
import { Eta } from "eta";
var eta = new Eta({
  useWith: true,
  autoEscape: false,
  autoTrim: false
});
var moduleDir = path19.dirname(fileURLToPath(import.meta.url));
var cachedBundledRoot = null;
async function findUpwards(startDir, relativeTarget) {
  let current = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path19.join(current, relativeTarget);
    if (await directoryExists(candidate)) {
      return candidate;
    }
    const parent = path19.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
async function resolveBundledTemplatesRoot() {
  if (cachedBundledRoot) return cachedBundledRoot;
  const distRoot = await findUpwards(moduleDir, path19.join("dist", "templates"));
  if (distRoot) {
    cachedBundledRoot = distRoot;
    return cachedBundledRoot;
  }
  const srcRoot = await findUpwards(moduleDir, path19.join("src", "templates"));
  if (srcRoot) {
    cachedBundledRoot = srcRoot;
    return cachedBundledRoot;
  }
  throw new Error(
    "Could not locate a bundled templates directory (looked for dist/templates and src/templates)."
  );
}
function getUserTemplatesRoot() {
  return path19.join(os2.homedir(), ".forge", "templates");
}
function resolveUserTemplatePath(...segments) {
  return path19.join(getUserTemplatesRoot(), ...segments);
}
async function resolveBundledTemplatePath(...segments) {
  const root = await resolveBundledTemplatesRoot();
  return path19.join(root, ...segments);
}
async function resolveTemplatePath(...segments) {
  const userPath = resolveUserTemplatePath(...segments);
  if (await fileExists(userPath)) {
    return userPath;
  }
  return resolveBundledTemplatePath(...segments);
}

// src/schemas/recipe.schema.ts
import { z as z2 } from "zod";
var RecipeFileOperationSchema = z2.enum([
  "create",
  "overwrite",
  "append"
]);
var RecipeFileSchema = z2.object({
  path: z2.string().min(1),
  operation: RecipeFileOperationSchema,
  content: z2.string()
});
var RecipeSchema = z2.object({
  id: z2.string().min(1).regex(/^[a-z0-9][a-z0-9-_]*$/, "id must be a lowercase slug"),
  name: z2.string().min(1),
  description: z2.string().default(""),
  tags: z2.array(z2.string()).default([]),
  files: z2.array(RecipeFileSchema).default([]),
  notes: z2.string().optional()
});

// src/modules/stackpack/types.ts
var PACK_ACTIONS = [
  "list",
  "search",
  "show",
  "save",
  "use",
  "init-defaults",
  "delete"
];

// src/modules/stackpack/default-recipes.ts
var DEFAULT_RECIPE_IDS = [
  "vite-vercel-spa-rewrite",
  "vite-vercel-client-routing",
  "express-secure-baseline",
  "express-security-baseline",
  "supabase-client-react",
  "supabase-auth-react",
  "square-checkout-express",
  "github-actions-vite",
  "github-actions-vite-deploy-check",
  "playwright-basic-config",
  "env-example-baseline",
  "react-router-baseline",
  "tailwind-ui-baseline",
  "client-contact-form"
];
async function loadDefaultRecipes() {
  const recipes = [];
  for (const id of DEFAULT_RECIPE_IDS) {
    const filePath = await resolveTemplatePath("recipes", `${id}.json`);
    const raw = await readJsonFile(filePath);
    if (!raw) {
      throw new Error(`Default recipe template not found: ${filePath}`);
    }
    recipes.push(RecipeSchema.parse(raw));
  }
  return recipes;
}

// src/modules/stackpack/recipe-store.ts
function getRecipeDirectory() {
  return path20.join(getForgeHomeDir(), "recipes");
}
function getRecipePath(id) {
  return path20.join(getRecipeDirectory(), `${id}.json`);
}
async function ensureRecipeStore() {
  await ensureForgeHome();
  await ensureDir(getRecipeDirectory());
}
async function listRecipes() {
  await ensureRecipeStore();
  const dir = getRecipeDirectory();
  const entries = await fs6.readdir(dir);
  const recipes = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const raw = await readJsonFile(path20.join(dir, entry));
    if (!raw) continue;
    const parsed = RecipeSchema.safeParse(raw);
    if (parsed.success) {
      recipes.push(parsed.data);
    }
  }
  recipes.sort((a, b) => a.id.localeCompare(b.id));
  return recipes;
}
async function getRecipe(id) {
  await ensureRecipeStore();
  const raw = await readJsonFile(getRecipePath(id));
  if (!raw) return null;
  const parsed = RecipeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
async function saveRecipe(recipe) {
  await ensureRecipeStore();
  const validated = RecipeSchema.parse(recipe);
  await writeJsonFile(getRecipePath(validated.id), validated);
}
async function deleteRecipe(id) {
  await ensureRecipeStore();
  const filePath = getRecipePath(id);
  if (!await fileExists(filePath)) {
    return false;
  }
  await fs6.unlink(filePath);
  return true;
}
async function recipeExists(id) {
  return fileExists(getRecipePath(id));
}
async function installDefaultRecipes(options) {
  const defaults = await loadDefaultRecipes();
  const result = {
    created: [],
    overwritten: [],
    skipped: []
  };
  for (const recipe of defaults) {
    const exists = await recipeExists(recipe.id);
    if (exists && !options.force) {
      result.skipped.push(recipe.id);
      continue;
    }
    await saveRecipe(recipe);
    if (exists) {
      result.overwritten.push(recipe.id);
    } else {
      result.created.push(recipe.id);
    }
  }
  return result;
}
var readAllRecipes = listRecipes;
var readRecipe = getRecipe;
var writeRecipe = saveRecipe;

// src/modules/promptkit/history.ts
import crypto from "crypto";
import os3 from "os";
import path21 from "path";

// src/modules/promptkit/clipboard.ts
async function writeToClipboard(text) {
  try {
    const moduleName = "clipboardy";
    const mod = await import(moduleName);
    const write = mod.default?.write ?? mod.write;
    if (!write) return false;
    await write(text);
    return true;
  } catch {
    return false;
  }
}

// src/modules/promptkit/history.ts
function getHistoryPath() {
  return path21.join(os3.homedir(), ".forge", "prompts", "history.json");
}
async function loadHistory() {
  const data = await readJsonFile(getHistoryPath());
  return Array.isArray(data) ? data : [];
}
async function clearHistory() {
  await ensureDir(path21.dirname(getHistoryPath()));
  await writeJsonFile(getHistoryPath(), []);
}
function findById(history, id) {
  return history.find((e) => e.id === id);
}
async function copyPrompt(id) {
  const history = await loadHistory();
  const entry = findById(history, id);
  if (!entry) {
    return { copied: false, reason: `Prompt not found: ${id}` };
  }
  const ok = await writeToClipboard(entry.prompt);
  if (ok) {
    return { copied: true };
  }
  return {
    copied: false,
    reason: "Clipboard unavailable. Install `clipboardy` to enable copy."
  };
}

// src/tui/screens/DashboardScreen.tsx
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
function DashboardScreen() {
  const [state, setState] = useState2({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [dashboard, recipes, prompts] = await Promise.all([
          getProjectDashboard({
            cwd: process.cwd(),
            withLaunch: true,
            withBuild: false
          }),
          safeListRecipes(),
          safeLoadHistoryCount()
        ]);
        if (!cancelled) {
          setState({
            kind: "ready",
            data: {
              dashboard,
              recipeCount: recipes,
              promptCount: prompts
            }
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : String(err)
          });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  if (state.kind === "loading") {
    return /* @__PURE__ */ jsx11(DashboardLoading, {});
  }
  if (state.kind === "error") {
    return /* @__PURE__ */ jsx11(DashboardError, { message: state.message });
  }
  return /* @__PURE__ */ jsx11(DashboardReady, { data: state.data });
}
async function safeListRecipes() {
  try {
    const recipes = await listRecipes();
    return recipes.length;
  } catch {
    return 0;
  }
}
async function safeLoadHistoryCount() {
  try {
    const history = await loadHistory();
    return history.length;
  } catch {
    return 0;
  }
}
function DashboardLoading() {
  return /* @__PURE__ */ jsx11(Box10, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsxs10(Pane, { title: "Dashboard", focused: true, flexGrow: 1, children: [
    /* @__PURE__ */ jsxs10(Box10, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx11(Text10, { color: theme.primary, children: /* @__PURE__ */ jsx11(Spinner2, { type: "dots" }) }),
      /* @__PURE__ */ jsxs10(Text10, { color: theme.textSecondary, children: [
        " ",
        "loading project context, doctor scan, and launch score \u2026"
      ] })
    ] }),
    /* @__PURE__ */ jsx11(Box10, { marginTop: 1, children: /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: "(build is skipped \u2014 launch check uses cached artifacts only)" }) })
  ] }) });
}
function DashboardError({ message }) {
  return /* @__PURE__ */ jsx11(Box10, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx11(Pane, { title: "Dashboard", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs10(Box10, { paddingY: 1, flexDirection: "column", children: [
    /* @__PURE__ */ jsxs10(Text10, { color: theme.danger, bold: true, children: [
      glyph("warn"),
      " Could not load dashboard"
    ] }),
    /* @__PURE__ */ jsx11(Box10, { marginTop: 1, children: /* @__PURE__ */ jsx11(Text10, { color: theme.textSecondary, children: message }) }),
    /* @__PURE__ */ jsx11(Box10, { marginTop: 1, children: /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: "Press q to quit, or 1 to retry by re-entering the dashboard." }) })
  ] }) }) });
}
function DashboardReady({
  data
}) {
  const { dashboard, recipeCount, promptCount } = data;
  const row = (label) => dashboard.rows.find((r) => r.label === label)?.value ?? "\u2014";
  return /* @__PURE__ */ jsxs10(Box10, { flexDirection: "column", flexGrow: 1, paddingX: 1, children: [
    /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", gap: 1, children: [
      /* @__PURE__ */ jsx11(
        ProjectPane,
        {
          name: row("Project"),
          path: dashboard.projectRoot,
          framework: row("Framework"),
          language: row("Language"),
          packageManager: row("Package manager"),
          git: row("Git")
        }
      ),
      /* @__PURE__ */ jsx11(DoctorPane, { dashboard }),
      /* @__PURE__ */ jsx11(LaunchPane, { dashboard }),
      /* @__PURE__ */ jsx11(
        EnvironmentPane,
        {
          envFiles: row("Env files"),
          scripts: row("Scripts"),
          tailwind: row("Tailwind"),
          reactRouter: row("React Router")
        }
      )
    ] }),
    /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", gap: 1, marginTop: 1, flexGrow: 1, children: [
      /* @__PURE__ */ jsx11(RecentActivityPane, { dashboard }),
      /* @__PURE__ */ jsx11(ShortcutsPane, {}),
      /* @__PURE__ */ jsx11(
        SystemInfoPane,
        {
          recipeCount,
          promptCount,
          projectRoot: dashboard.projectRoot
        }
      )
    ] })
  ] });
}
function ProjectPane({
  name,
  path: path26,
  framework,
  language,
  packageManager,
  git
}) {
  return /* @__PURE__ */ jsx11(Pane, { title: "Project", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs10(Box10, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx11(Text10, { color: theme.text, bold: true, children: name }),
    /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: truncatePath(path26, 36) }),
    /* @__PURE__ */ jsxs10(Box10, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx11(KeyValue, { label: "framework", value: framework }),
      /* @__PURE__ */ jsx11(KeyValue, { label: "language", value: language }),
      /* @__PURE__ */ jsx11(KeyValue, { label: "package", value: packageManager }),
      /* @__PURE__ */ jsx11(
        KeyValue,
        {
          label: "git",
          value: /* @__PURE__ */ jsxs10(Text10, { color: theme.text, children: [
            glyph("branch"),
            " ",
            git
          ] })
        }
      )
    ] })
  ] }) });
}
function DoctorPane({
  dashboard
}) {
  const doctor = dashboard.doctor;
  return /* @__PURE__ */ jsx11(
    Pane,
    {
      title: "Doctor",
      flexGrow: 1,
      right: doctor && doctor.total > 0 ? /* @__PURE__ */ jsx11(Tag, { color: theme.warning, children: `${doctor.total} open` }) : doctor ? /* @__PURE__ */ jsx11(Tag, { color: theme.success, children: "clean" }) : void 0,
      children: doctor ? /* @__PURE__ */ jsxs10(Box10, { flexDirection: "column", children: [
        /* @__PURE__ */ jsx11(
          SeverityRow,
          {
            label: "high",
            count: doctor.bySeverity.high,
            color: theme.danger
          }
        ),
        /* @__PURE__ */ jsx11(
          SeverityRow,
          {
            label: "medium",
            count: doctor.bySeverity.medium,
            color: theme.warning
          }
        ),
        /* @__PURE__ */ jsx11(
          SeverityRow,
          {
            label: "low",
            count: doctor.bySeverity.low,
            color: theme.textSecondary
          }
        ),
        /* @__PURE__ */ jsx11(Box10, { marginTop: 1, children: /* @__PURE__ */ jsxs10(Text10, { color: theme.textMuted, children: [
          glyph("arrow"),
          " press 2 to triage"
        ] }) })
      ] }) : /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: "doctor unavailable" })
    }
  );
}
function SeverityRow({
  label,
  count,
  color
}) {
  return /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx11(Box10, { flexGrow: 1, children: /* @__PURE__ */ jsxs10(Text10, { color, children: [
      glyph("bullet"),
      " ",
      label
    ] }) }),
    /* @__PURE__ */ jsx11(Text10, { color: theme.text, children: count })
  ] });
}
function LaunchPane({
  dashboard
}) {
  const launch = dashboard.launch;
  const statusColor = launch?.status === "pass" ? theme.success : launch?.status === "warn" ? theme.warning : launch?.status === "fail" ? theme.danger : theme.textSecondary;
  return /* @__PURE__ */ jsx11(
    Pane,
    {
      title: "Launch",
      flexGrow: 1,
      right: launch ? /* @__PURE__ */ jsx11(Tag, { color: statusColor, tone: "solid", children: launch.status.toUpperCase() }) : void 0,
      children: launch ? /* @__PURE__ */ jsxs10(Box10, { flexDirection: "column", children: [
        /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx11(Text10, { color: theme.text, bold: true, children: launch.score }),
          /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: " / 100" }),
          /* @__PURE__ */ jsx11(Box10, { flexGrow: 1 }),
          /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: launch.ranBuild ? "with build" : "no build" })
        ] }),
        /* @__PURE__ */ jsxs10(Box10, { marginTop: 1, flexDirection: "column", children: [
          /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", children: [
            /* @__PURE__ */ jsx11(Box10, { flexGrow: 1, children: /* @__PURE__ */ jsxs10(Text10, { color: theme.success, children: [
              glyph("check"),
              " passing"
            ] }) }),
            /* @__PURE__ */ jsx11(Text10, { color: theme.text, children: launch.pass })
          ] }),
          /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", children: [
            /* @__PURE__ */ jsx11(Box10, { flexGrow: 1, children: /* @__PURE__ */ jsxs10(Text10, { color: theme.warning, children: [
              glyph("warn"),
              " warnings"
            ] }) }),
            /* @__PURE__ */ jsx11(Text10, { color: theme.text, children: launch.warn })
          ] }),
          /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", children: [
            /* @__PURE__ */ jsx11(Box10, { flexGrow: 1, children: /* @__PURE__ */ jsxs10(Text10, { color: theme.danger, children: [
              glyph("cross"),
              " failing"
            ] }) }),
            /* @__PURE__ */ jsx11(Text10, { color: theme.text, children: launch.fail })
          ] })
        ] }),
        /* @__PURE__ */ jsx11(Box10, { marginTop: 1, children: /* @__PURE__ */ jsxs10(Text10, { color: theme.textMuted, children: [
          glyph("arrow"),
          " press 5 to diff runs"
        ] }) })
      ] }) : /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: "launch unavailable" })
    }
  );
}
function EnvironmentPane({
  envFiles,
  scripts,
  tailwind,
  reactRouter
}) {
  return /* @__PURE__ */ jsx11(Pane, { title: "Environment", flexGrow: 1, children: /* @__PURE__ */ jsxs10(Box10, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx11(KeyValue, { label: "env files", value: truncate(envFiles, 24) }),
    /* @__PURE__ */ jsx11(KeyValue, { label: "scripts", value: truncate(scripts, 24) }),
    /* @__PURE__ */ jsx11(KeyValue, { label: "tailwind", value: tailwind }),
    /* @__PURE__ */ jsx11(KeyValue, { label: "router", value: reactRouter }),
    /* @__PURE__ */ jsx11(Box10, { marginTop: 1, children: /* @__PURE__ */ jsxs10(Text10, { color: theme.textMuted, children: [
      glyph("check"),
      " ~/.forge initialized"
    ] }) })
  ] }) });
}
function RecentActivityPane({
  dashboard
}) {
  const visible = dashboard.rows.slice(0, 8);
  return /* @__PURE__ */ jsx11(
    Pane,
    {
      title: "Recent activity",
      flexGrow: 2,
      right: /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: `${dashboard.rows.length} entries` }),
      children: /* @__PURE__ */ jsx11(Box10, { flexDirection: "column", children: visible.map((row, i) => /* @__PURE__ */ jsx11(
        ListRow,
        {
          selected: i === 0,
          prefix: /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: row.label.padEnd(16).slice(0, 16) }),
          children: /* @__PURE__ */ jsx11(Text10, { color: theme.text, children: truncate(row.value, 40) })
        },
        `${i}-${row.label}`
      )) })
    }
  );
}
function ShortcutsPane() {
  const shortcuts = [
    ["1", "dashboard", theme.primary],
    ["2", "doctor", theme.warning],
    ["3", "recipes", theme.secondary],
    ["4", "prompts", theme.secondary],
    ["5", "launch", theme.success],
    ["6", "config", theme.textSecondary],
    ["?", "help overlay", theme.textSecondary],
    ["ctrl+k", "command palette", theme.textSecondary],
    ["q", "quit", theme.danger]
  ];
  return /* @__PURE__ */ jsx11(Pane, { title: "Shortcuts", flexGrow: 1, children: /* @__PURE__ */ jsx11(Box10, { flexDirection: "column", children: shortcuts.map(([key, label, color]) => /* @__PURE__ */ jsxs10(Box10, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx11(Box10, { width: 10, children: /* @__PURE__ */ jsx11(Text10, { color: theme.text, backgroundColor: theme.elevated, children: ` ${key} ` }) }),
    /* @__PURE__ */ jsxs10(Text10, { color, children: [
      " ",
      label
    ] })
  ] }, key)) }) });
}
function SystemInfoPane({
  recipeCount,
  promptCount,
  projectRoot
}) {
  return /* @__PURE__ */ jsx11(Pane, { title: "System", flexGrow: 1, children: /* @__PURE__ */ jsxs10(Box10, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx11(
      KeyValue,
      {
        label: "recipes",
        value: /* @__PURE__ */ jsxs10(Text10, { color: theme.text, children: [
          glyph("pkg"),
          " ",
          recipeCount,
          " installed"
        ] })
      }
    ),
    /* @__PURE__ */ jsx11(
      KeyValue,
      {
        label: "prompts",
        value: /* @__PURE__ */ jsxs10(Text10, { color: theme.text, children: [
          glyph("terminal"),
          " ",
          promptCount,
          " saved"
        ] })
      }
    ),
    /* @__PURE__ */ jsx11(KeyValue, { label: "node", value: process.version }),
    /* @__PURE__ */ jsx11(KeyValue, { label: "platform", value: process.platform }),
    /* @__PURE__ */ jsx11(Box10, { marginTop: 1, children: /* @__PURE__ */ jsx11(Text10, { color: theme.textMuted, children: "cwd" }) }),
    /* @__PURE__ */ jsx11(Text10, { color: theme.textSecondary, children: truncatePath(projectRoot, 32) })
  ] }) });
}
function truncate(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}\u2026`;
}
function truncatePath(value, max) {
  if (value.length <= max) return value;
  const tail = value.slice(value.length - (max - 1));
  return `\u2026${tail}`;
}

// src/tui/screens/DoctorScreen.tsx
import { useCallback, useEffect as useEffect2, useMemo as useMemo2, useState as useState3 } from "react";
import { Box as Box11, Text as Text11, useInput as useInput2 } from "ink";
import Spinner3 from "ink-spinner";

// src/modules/repo-doctor/fix-helpers.ts
function getFixableRuleIds() {
  return new Set(
    allRules.filter((r) => typeof r.fix === "function").map((r) => r.id)
  );
}
async function previewFix(cwd, ruleId) {
  const result = await runDoctor({ cwd, fix: true, dryRun: true, rule: ruleId });
  return result.issues[0] ?? null;
}
async function applyFix(cwd, ruleId) {
  const result = await runDoctor({ cwd, fix: true, rule: ruleId });
  return result.issues[0] ?? null;
}
async function applyAllFixes(cwd) {
  return runDoctor({ cwd, fix: true });
}

// src/tui/screens/doctor-helpers.ts
var CATEGORY_ORDER = [
  "security",
  "deployment",
  "env",
  "react",
  "express",
  "project"
];
var SEVERITY_RANK = {
  high: 0,
  medium: 1,
  low: 2
};
function groupIssuesByCategory(issues) {
  const byCategory = /* @__PURE__ */ new Map();
  for (const issue of issues) {
    const bucket = byCategory.get(issue.category) ?? [];
    bucket.push(issue);
    byCategory.set(issue.category, bucket);
  }
  const groups = [];
  for (const category of CATEGORY_ORDER) {
    const items = byCategory.get(category);
    if (items && items.length > 0) {
      groups.push({
        category,
        items: [...items].sort(
          (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
        )
      });
    }
  }
  for (const [category, items] of byCategory) {
    if (!CATEGORY_ORDER.includes(category)) {
      groups.push({
        category,
        items: [...items].sort(
          (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
        )
      });
    }
  }
  return groups;
}
function filterIssues(issues, query) {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return issues;
  return issues.filter((issue) => {
    return issue.id.toLowerCase().includes(trimmed) || issue.title.toLowerCase().includes(trimmed) || issue.message.toLowerCase().includes(trimmed) || issue.category.toLowerCase().includes(trimmed) || issue.severity.toLowerCase().includes(trimmed);
  });
}
function flattenGroups(groups) {
  return groups.flatMap((g) => g.items);
}
function clampIndex2(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

// src/tui/screens/DoctorScreen.tsx
import { jsx as jsx12, jsxs as jsxs11 } from "react/jsx-runtime";
var WINDOW_SIZE = 14;
var SEVERITY_COLOR = {
  high: theme.danger,
  medium: theme.warning,
  low: theme.textSecondary
};
var CATEGORY_COLOR = {
  security: theme.danger,
  deployment: theme.primary,
  env: theme.warning,
  react: theme.secondary,
  express: theme.primary,
  project: theme.textSecondary
};
function DoctorScreen({
  appState
}) {
  const [state, setState] = useState3({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState3(0);
  const [filter, setFilter] = useState3("");
  const [mode, setMode] = useState3("browse");
  const [feedback, setFeedback] = useState3(null);
  const fixableIds = useMemo2(() => getFixableRuleIds(), []);
  const reload = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const result = await runDoctor({ cwd: process.cwd(), fix: false });
      setState({ kind: "ready", result });
      setSelectedIndex(0);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);
  useEffect2(() => {
    void reload();
  }, [reload]);
  useEffect2(() => {
    appState.setInputCaptured(mode === "filter");
    return () => {
      appState.setInputCaptured(false);
    };
  }, [mode, appState]);
  const issues = state.kind === "ready" ? state.result.issues : [];
  const visibleIssues = useMemo2(
    () => filterIssues(issues, filter),
    [issues, filter]
  );
  const groups = useMemo2(
    () => groupIssuesByCategory(visibleIssues),
    [visibleIssues]
  );
  const flat = useMemo2(() => flattenGroups(groups), [groups]);
  const safeIndex = clampIndex2(selectedIndex, flat.length);
  const selected = flat[safeIndex] ?? null;
  const fixableCount = flat.filter((i) => fixableIds.has(i.id)).length;
  const handleApplyOne = useCallback(async () => {
    if (!selected || !fixableIds.has(selected.id)) {
      setFeedback("No fix available for this issue.");
      return;
    }
    const target = selected;
    setState({
      kind: "applying",
      message: `Applying fix for ${target.title} \u2026`
    });
    setFeedback(null);
    try {
      const applied = await applyFix(process.cwd(), target.id);
      setFeedback(
        applied?.fixed ? `Applied: ${target.title}` : applied?.fixSkipped ? `Fix skipped: ${target.title}` : `Fix completed: ${target.title}`
      );
      await reload();
    } catch (err) {
      setFeedback(
        `Apply failed: ${err instanceof Error ? err.message : String(err)}`
      );
      await reload();
    }
  }, [selected, fixableIds, reload]);
  const handleApplyAll = useCallback(async () => {
    setMode("browse");
    setState({ kind: "applying", message: "Applying all available fixes \u2026" });
    setFeedback(null);
    try {
      const result = await applyAllFixes(process.cwd());
      const fixed = result.issues.filter((i) => i.fixed).length;
      setFeedback(`Applied ${fixed} fix${fixed === 1 ? "" : "es"}.`);
      await reload();
    } catch (err) {
      setFeedback(
        `Apply-all failed: ${err instanceof Error ? err.message : String(err)}`
      );
      await reload();
    }
  }, [reload]);
  const handlePreview = useCallback(async () => {
    if (!selected || !fixableIds.has(selected.id)) {
      setFeedback("No fix preview available for this issue.");
      return;
    }
    setFeedback(`Previewing: ${selected.title} \u2026`);
    try {
      const previewed = await previewFix(process.cwd(), selected.id);
      if (!previewed) {
        setFeedback("Preview returned no result.");
        return;
      }
      const tag = previewed.fixPreview ? "would apply" : previewed.fixSkipped ? "would skip" : "no change";
      setFeedback(`Preview (${tag}): ${previewed.message}`);
    } catch (err) {
      setFeedback(
        `Preview failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }, [selected, fixableIds]);
  useInput2((input, key) => {
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
      setSelectedIndex((i) => clampIndex2(i + 1, flat.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => clampIndex2(i - 1, flat.length));
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
    return /* @__PURE__ */ jsx12(Box11, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx12(Pane, { title: "Doctor", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs11(Box11, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx12(Text11, { color: theme.primary, children: /* @__PURE__ */ jsx12(Spinner3, { type: "dots" }) }),
      /* @__PURE__ */ jsx12(Text11, { color: theme.textSecondary, children: " scanning rules \u2026" })
    ] }) }) });
  }
  if (state.kind === "applying") {
    return /* @__PURE__ */ jsx12(Box11, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx12(Pane, { title: "Doctor", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs11(Box11, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx12(Text11, { color: theme.primary, children: /* @__PURE__ */ jsx12(Spinner3, { type: "dots" }) }),
      /* @__PURE__ */ jsxs11(Text11, { color: theme.textSecondary, children: [
        " ",
        state.message
      ] })
    ] }) }) });
  }
  if (state.kind === "error") {
    return /* @__PURE__ */ jsx12(Box11, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx12(Pane, { title: "Doctor", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs11(Box11, { paddingY: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs11(Text11, { color: theme.danger, bold: true, children: [
        glyph("warn"),
        " Doctor failed to run"
      ] }),
      /* @__PURE__ */ jsx12(Box11, { marginTop: 1, children: /* @__PURE__ */ jsx12(Text11, { color: theme.textSecondary, children: state.message }) })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs11(Box11, { flexDirection: "column", flexGrow: 1, paddingX: 1, children: [
    /* @__PURE__ */ jsxs11(Box11, { flexDirection: "row", gap: 1, flexGrow: 1, children: [
      /* @__PURE__ */ jsx12(
        IssueListPane,
        {
          groups,
          flatIssues: flat,
          selectedIndex: safeIndex,
          totalIssues: issues.length,
          fixableIds,
          filter,
          mode
        }
      ),
      /* @__PURE__ */ jsx12(
        IssueDetailPane,
        {
          issue: selected,
          fixable: selected ? fixableIds.has(selected.id) : false
        }
      )
    ] }),
    /* @__PURE__ */ jsx12(
      ActionFooter,
      {
        mode,
        feedback,
        fixableCount,
        totalShown: flat.length,
        totalAll: issues.length
      }
    )
  ] });
}
function IssueListPane({
  groups,
  flatIssues,
  selectedIndex,
  totalIssues,
  fixableIds,
  filter,
  mode
}) {
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE / 2)),
      Math.max(0, flatIssues.length - WINDOW_SIZE)
    )
  );
  const end = Math.min(flatIssues.length, start + WINDOW_SIZE);
  const visibleIdSet = new Set(flatIssues.slice(start, end).map((i) => i.id));
  const headerRight = /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: flatIssues.length === totalIssues ? `${totalIssues} total` : `${flatIssues.length} shown \xB7 ${totalIssues} total` });
  return /* @__PURE__ */ jsx12(Pane, { title: "Issues", focused: true, flexGrow: 1, right: headerRight, children: /* @__PURE__ */ jsxs11(Box11, { flexDirection: "column", children: [
    (filter.length > 0 || mode === "filter") && /* @__PURE__ */ jsxs11(Box11, { marginBottom: 1, children: [
      /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: "filter" }),
      /* @__PURE__ */ jsxs11(Text11, { color: theme.text, children: [
        " /",
        filter
      ] }),
      mode === "filter" && /* @__PURE__ */ jsx12(Text11, { color: theme.primary, children: "\u258E" })
    ] }),
    flatIssues.length === 0 ? /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: totalIssues === 0 ? "no issues \u2014 repo looks clean" : "no matches for current filter" }) : groups.map((g) => {
      const itemsInWindow = g.items.filter(
        (it) => visibleIdSet.has(it.id)
      );
      if (itemsInWindow.length === 0) return null;
      return /* @__PURE__ */ jsxs11(Box11, { flexDirection: "column", marginBottom: 1, children: [
        /* @__PURE__ */ jsxs11(Box11, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx12(Text11, { color: CATEGORY_COLOR[g.category], bold: true, children: g.category.toUpperCase() }),
          /* @__PURE__ */ jsx12(Box11, { flexGrow: 1 }),
          /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: g.items.length })
        ] }),
        itemsInWindow.map((issue) => {
          const indexInFlat = flatIssues.findIndex(
            (it) => it.id === issue.id
          );
          const sel = indexInFlat === selectedIndex;
          return /* @__PURE__ */ jsx12(
            ListRow,
            {
              selected: sel,
              prefix: /* @__PURE__ */ jsx12(Text11, { color: SEVERITY_COLOR[issue.severity], children: glyph("bullet") }),
              right: fixableIds.has(issue.id) ? /* @__PURE__ */ jsx12(Tag, { color: theme.success, children: "fix" }) : /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: "manual" }),
              children: /* @__PURE__ */ jsx12(Text11, { color: sel ? theme.text : theme.textSecondary, children: truncate2(issue.title, 44) })
            },
            issue.id
          );
        })
      ] }, g.category);
    }),
    flatIssues.length > WINDOW_SIZE && /* @__PURE__ */ jsx12(Box11, { marginTop: 1, children: /* @__PURE__ */ jsxs11(Text11, { color: theme.textMuted, children: [
      "showing ",
      start + 1,
      "\u2013",
      end,
      " of ",
      flatIssues.length,
      " (j/k to scroll)"
    ] }) })
  ] }) });
}
function IssueDetailPane({
  issue,
  fixable
}) {
  if (!issue) {
    return /* @__PURE__ */ jsx12(Pane, { title: "Preview", flexGrow: 1, children: /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: "Select an issue to see details." }) });
  }
  return /* @__PURE__ */ jsx12(
    Pane,
    {
      title: `Preview \xB7 ${issue.id}`,
      flexGrow: 1,
      right: /* @__PURE__ */ jsxs11(Box11, { flexDirection: "row", gap: 1, children: [
        /* @__PURE__ */ jsx12(Tag, { color: SEVERITY_COLOR[issue.severity], tone: "solid", children: issue.severity.toUpperCase() }),
        /* @__PURE__ */ jsx12(Tag, { color: CATEGORY_COLOR[issue.category], children: issue.category })
      ] }),
      children: /* @__PURE__ */ jsxs11(Box11, { flexDirection: "column", children: [
        /* @__PURE__ */ jsx12(Text11, { color: theme.text, bold: true, children: issue.title }),
        /* @__PURE__ */ jsx12(Box11, { marginTop: 1, children: /* @__PURE__ */ jsx12(Text11, { color: theme.textSecondary, children: issue.message }) }),
        /* @__PURE__ */ jsxs11(Box11, { marginTop: 1, flexDirection: "row", children: [
          /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: "fix " }),
          fixable ? /* @__PURE__ */ jsx12(Tag, { color: theme.success, children: "available" }) : /* @__PURE__ */ jsx12(Tag, { color: theme.textSecondary, children: "manual only" }),
          issue.fixed && /* @__PURE__ */ jsx12(Box11, { marginLeft: 1, children: /* @__PURE__ */ jsx12(Tag, { color: theme.success, tone: "solid", children: "FIXED" }) }),
          issue.fixSkipped && /* @__PURE__ */ jsx12(Box11, { marginLeft: 1, children: /* @__PURE__ */ jsx12(Tag, { color: theme.warning, children: "skipped" }) })
        ] }),
        /* @__PURE__ */ jsx12(Box11, { marginTop: 1, children: /* @__PURE__ */ jsxs11(Text11, { color: theme.textMuted, children: [
          glyph("info"),
          " TODO: render inline diff once the doctor engine exposes affected file paths."
        ] }) })
      ] })
    }
  );
}
function ActionFooter({
  mode,
  feedback,
  fixableCount,
  totalShown,
  totalAll
}) {
  let hint;
  if (mode === "filter") {
    hint = "filter \xB7 type to search \xB7 enter to commit \xB7 esc to cancel";
  } else if (mode === "confirm-all") {
    hint = `apply all ${fixableCount} fix${fixableCount === 1 ? "" : "es"}? press y to confirm \xB7 n to cancel`;
  } else {
    hint = `j/k navigate \xB7 / filter \xB7 f apply \xB7 d preview \xB7 a apply all \xB7 esc back`;
  }
  return /* @__PURE__ */ jsxs11(
    Box11,
    {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      borderStyle: "single",
      borderColor: theme.borderSoft,
      children: [
        /* @__PURE__ */ jsxs11(Box11, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx12(Text11, { color: theme.textMuted, children: hint }),
          /* @__PURE__ */ jsx12(Box11, { flexGrow: 1 }),
          /* @__PURE__ */ jsxs11(Text11, { color: theme.textMuted, children: [
            totalShown,
            " shown \xB7 ",
            totalAll,
            " total \xB7 ",
            fixableCount,
            " fixable"
          ] })
        ] }),
        feedback && /* @__PURE__ */ jsx12(Box11, { marginTop: 0, children: /* @__PURE__ */ jsx12(Text11, { color: theme.text, children: feedback }) })
      ]
    }
  );
}
function truncate2(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}\u2026`;
}

// src/tui/screens/RecipesScreen.tsx
import { useCallback as useCallback2, useEffect as useEffect3, useMemo as useMemo3, useState as useState4 } from "react";
import { Box as Box12, Text as Text12, useInput as useInput3 } from "ink";
import Spinner4 from "ink-spinner";

// src/modules/stackpack/index.ts
import path22 from "path";
async function runPackCommand(options) {
  await ensureRecipeStore();
  if (!isPackAction(options.action)) {
    return {
      message: `Unknown pack action: ${options.action}`,
      items: [`Use one of: ${PACK_ACTIONS.join(", ")}`]
    };
  }
  switch (options.action) {
    case "list":
      return listRecipes2();
    case "search":
      return searchRecipes(options);
    case "show":
      return showRecipe(options);
    case "save":
      return saveRecipe2(options);
    case "use":
      return useRecipe(options);
    case "init-defaults":
      return initDefaults(options);
    case "delete":
      return deleteRecipeAction(options);
  }
}
function isPackAction(action) {
  return PACK_ACTIONS.includes(action);
}
async function listRecipes2() {
  const recipes = await readAllRecipes();
  if (recipes.length === 0) {
    return {
      message: "No recipes saved yet. Run `forge pack init-defaults` to seed the built-in recipes.",
      items: []
    };
  }
  return {
    message: `Found ${recipes.length} recipe(s):`,
    items: recipes.map(formatRecipeSummary)
  };
}
async function searchRecipes(options) {
  const query = options.name?.toLowerCase();
  if (!query) {
    return {
      message: "Missing search query.",
      items: ["Example: forge pack search vercel"]
    };
  }
  const recipes = await readAllRecipes();
  const matches = recipes.filter((recipe) => {
    return recipe.id.toLowerCase().includes(query) || recipe.name.toLowerCase().includes(query) || recipe.description.toLowerCase().includes(query) || recipe.tags.some((tag) => tag.toLowerCase().includes(query));
  });
  return {
    message: `Found ${matches.length} matching recipe(s):`,
    items: matches.map(formatRecipeSummary)
  };
}
async function showRecipe(options) {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack show vite-vercel-spa-rewrite"]
    };
  }
  const id = slugify(options.name);
  const recipe = await readRecipe(id);
  if (!recipe) {
    return {
      message: `Recipe not found: ${id}`,
      items: []
    };
  }
  const items = [
    `Name: ${recipe.name}`,
    `Description: ${recipe.description}`,
    `Tags: ${recipe.tags.length > 0 ? recipe.tags.join(", ") : "(none)"}`
  ];
  if (recipe.notes) {
    items.push(`Notes: ${recipe.notes}`);
  }
  items.push("Files:");
  for (const file of recipe.files) {
    items.push(`  - [${file.operation}] ${file.path}`);
  }
  return {
    message: `Recipe: ${recipe.id}`,
    items
  };
}
async function saveRecipe2(options) {
  if (!options.name) {
    return {
      message: "Missing recipe name.",
      items: ["Example: forge pack save my-recipe --description '...'"]
    };
  }
  const id = slugify(options.name);
  if (await recipeExists(id) && !options.force) {
    return {
      message: `Recipe ${id} already exists. Pass --force to overwrite.`,
      items: [`File: ${getRecipePath(id)}`]
    };
  }
  const recipe = RecipeSchema.parse({
    id,
    name: options.name,
    description: options.description ?? "No description provided.",
    tags: parseTags(options.tags),
    files: [
      {
        path: "README_FOR_RECIPE.md",
        operation: "create",
        content: `# ${options.name}

Replace this placeholder with real recipe content.
`
      }
    ]
  });
  await writeRecipe(recipe);
  return {
    message: `Saved recipe: ${id}`,
    items: [`Edit it at: ${getRecipePath(id)}`]
  };
}
async function useRecipe(options) {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack use vite-vercel-spa-rewrite"]
    };
  }
  const id = slugify(options.name);
  const recipe = await readRecipe(id);
  if (!recipe) {
    return {
      message: `Recipe not found: ${id}`,
      items: []
    };
  }
  const items = [];
  for (const file of recipe.files) {
    const result = await applyRecipeFile({
      file,
      cwd: options.cwd,
      dryRun: options.dryRun,
      force: options.force
    });
    items.push(result);
  }
  return {
    message: `${options.dryRun ? "Previewed" : "Applied"} recipe: ${recipe.id}`,
    items
  };
}
async function initDefaults(options) {
  const items = [];
  let created = 0;
  let skipped = 0;
  let overwritten = 0;
  const defaults = await loadDefaultRecipes();
  for (const recipe of defaults) {
    const exists = await recipeExists(recipe.id);
    if (exists && !options.force) {
      skipped++;
      items.push(`Skipped existing recipe ${recipe.id} (pass --force to overwrite)`);
      continue;
    }
    if (options.dryRun) {
      items.push(`Would ${exists ? "overwrite" : "create"} ${recipe.id}`);
      continue;
    }
    await writeRecipe(recipe);
    if (exists) {
      overwritten++;
      items.push(`Overwrote recipe ${recipe.id}`);
    } else {
      created++;
      items.push(`Created recipe ${recipe.id}`);
    }
  }
  const summary = options.dryRun ? `Previewed init-defaults: ${DEFAULT_RECIPE_IDS.length} recipe(s).` : `Initialized defaults: ${created} created, ${overwritten} overwritten, ${skipped} skipped.`;
  return {
    message: summary,
    items
  };
}
async function deleteRecipeAction(options) {
  if (!options.name) {
    return {
      message: "Missing recipe id.",
      items: ["Example: forge pack delete my-recipe"]
    };
  }
  const id = slugify(options.name);
  if (options.dryRun) {
    const exists = await recipeExists(id);
    return {
      message: exists ? `Would delete recipe ${id}.` : `Recipe ${id} not found.`,
      items: []
    };
  }
  const removed = await deleteRecipe(id);
  return {
    message: removed ? `Deleted recipe ${id}.` : `Recipe ${id} not found.`,
    items: []
  };
}
async function applyRecipeFile(input) {
  const { file, cwd, dryRun, force } = input;
  const targetPath = path22.join(cwd, file.path);
  const exists = await fileExists(targetPath);
  if (file.operation === "create") {
    if (exists && !force) {
      return `Skipped existing ${file.path} (pass --force to overwrite)`;
    }
    if (dryRun) {
      return `Would ${exists ? "overwrite" : "create"} ${file.path}`;
    }
    await writeTextFile(targetPath, file.content);
    return `${exists ? "Overwrote" : "Created"} ${file.path}`;
  }
  if (file.operation === "overwrite") {
    if (exists && !force && !dryRun) {
      return `Refused to overwrite existing ${file.path} (pass --force)`;
    }
    if (dryRun) {
      return `Would overwrite ${file.path}`;
    }
    await writeTextFile(targetPath, file.content);
    return `Overwrote ${file.path}`;
  }
  if (file.operation === "append") {
    if (dryRun) {
      if (!exists) return `Would create ${file.path}`;
      const existing = await readTextFile(targetPath) ?? "";
      if (existing.includes(file.content.trim())) {
        return `Would skip ${file.path} (content already present)`;
      }
      return `Would append to ${file.path}`;
    }
    if (exists) {
      const existing = await readTextFile(targetPath) ?? "";
      if (existing.includes(file.content.trim())) {
        return `Skipped ${file.path} (content already present)`;
      }
      const separator = existing.endsWith("\n") || existing === "" ? "" : "\n";
      await writeTextFile(targetPath, `${existing}${separator}${file.content}`);
      return `Appended to ${file.path}`;
    }
    await writeTextFile(targetPath, file.content);
    return `Created ${file.path}`;
  }
  return `Unsupported operation on ${file.path}`;
}
function formatRecipeSummary(recipe) {
  const tags = recipe.tags.length > 0 ? ` [${recipe.tags.join(", ")}]` : "";
  return `${recipe.id} \u2014 ${recipe.description}${tags}`;
}
function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function parseTags(tags) {
  if (!tags) return [];
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

// src/modules/stackpack/apply-helpers.ts
async function previewRecipe(cwd, id) {
  return runPackCommand({
    cwd,
    action: "use",
    name: id,
    dryRun: true,
    force: false
  });
}
async function applyRecipe(cwd, id, options = { force: false }) {
  return runPackCommand({
    cwd,
    action: "use",
    name: id,
    dryRun: false,
    force: options.force
  });
}

// src/tui/screens/recipe-helpers.ts
function filterRecipes(recipes, query) {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return recipes;
  return recipes.filter((r) => {
    return r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some((tag) => tag.toLowerCase().includes(q));
  });
}
function summarizeOperations(recipe) {
  const counts = {
    create: 0,
    overwrite: 0,
    append: 0
  };
  for (const file of recipe.files) {
    counts[file.operation] += 1;
  }
  return counts;
}
function formatOperationCounts(counts) {
  const parts = [];
  if (counts.create > 0) parts.push(`${counts.create} create`);
  if (counts.overwrite > 0) parts.push(`${counts.overwrite} overwrite`);
  if (counts.append > 0) parts.push(`${counts.append} append`);
  return parts.length > 0 ? parts.join(" \xB7 ") : "no file operations";
}
function clampIndex3(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

// src/tui/screens/RecipesScreen.tsx
import { jsx as jsx13, jsxs as jsxs12 } from "react/jsx-runtime";
var WINDOW_SIZE2 = 14;
var OPERATION_COLOR = {
  create: theme.success,
  overwrite: theme.warning,
  append: theme.secondary
};
function RecipesScreen({
  appState
}) {
  const [state, setState] = useState4({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState4(0);
  const [search, setSearch] = useState4("");
  const [mode, setMode] = useState4("browse");
  const [feedback, setFeedback] = useState4(null);
  const [feedbackItems, setFeedbackItems] = useState4([]);
  const reload = useCallback2(async () => {
    setState({ kind: "loading" });
    setFeedback(null);
    setFeedbackItems([]);
    try {
      const recipes2 = await listRecipes();
      setState({ kind: "ready", recipes: recipes2 });
      setSelectedIndex(0);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);
  useEffect3(() => {
    void reload();
  }, [reload]);
  useEffect3(() => {
    appState.setInputCaptured(mode === "search");
    return () => {
      appState.setInputCaptured(false);
    };
  }, [mode, appState]);
  const recipes = state.kind === "ready" ? state.recipes : [];
  const filtered = useMemo3(
    () => filterRecipes(recipes, search),
    [recipes, search]
  );
  const safeIndex = clampIndex3(selectedIndex, filtered.length);
  const selected = filtered[safeIndex] ?? null;
  const handlePreview = useCallback2(async () => {
    if (!selected) {
      setFeedback("No recipe selected.");
      return;
    }
    const target = selected;
    setState({ kind: "running", message: `Previewing ${target.id} \u2026` });
    setFeedback(null);
    setFeedbackItems([]);
    try {
      const result = await previewRecipe(process.cwd(), target.id);
      setFeedback(result.message);
      setFeedbackItems(result.items);
    } catch (err) {
      setFeedback(
        `Preview failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setState({ kind: "ready", recipes });
    }
  }, [selected, recipes]);
  const handleApply = useCallback2(async () => {
    if (!selected) {
      setFeedback("No recipe selected.");
      setMode("browse");
      return;
    }
    const target = selected;
    setMode("browse");
    setState({ kind: "running", message: `Applying ${target.id} \u2026` });
    setFeedback(null);
    setFeedbackItems([]);
    try {
      const result = await applyRecipe(process.cwd(), target.id);
      setFeedback(result.message);
      setFeedbackItems(result.items);
    } catch (err) {
      setFeedback(
        `Apply failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setState({ kind: "ready", recipes });
    }
  }, [selected, recipes]);
  useInput3((input, key) => {
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
    if (key.escape) {
      if (search.length > 0) {
        setSearch("");
      } else {
        appState.setRoute("dashboard");
      }
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => clampIndex3(i + 1, filtered.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => clampIndex3(i - 1, filtered.length));
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
    return /* @__PURE__ */ jsx13(Box12, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx13(Pane, { title: "Recipes", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs12(Box12, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx13(Text12, { color: theme.primary, children: /* @__PURE__ */ jsx13(Spinner4, { type: "dots" }) }),
      /* @__PURE__ */ jsxs12(Text12, { color: theme.textSecondary, children: [
        " ",
        "loading recipes from ~/.forge/recipes \u2026"
      ] })
    ] }) }) });
  }
  if (state.kind === "running") {
    return /* @__PURE__ */ jsx13(Box12, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx13(Pane, { title: "Recipes", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs12(Box12, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx13(Text12, { color: theme.primary, children: /* @__PURE__ */ jsx13(Spinner4, { type: "dots" }) }),
      /* @__PURE__ */ jsxs12(Text12, { color: theme.textSecondary, children: [
        " ",
        state.message
      ] })
    ] }) }) });
  }
  if (state.kind === "error") {
    return /* @__PURE__ */ jsx13(Box12, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx13(Pane, { title: "Recipes", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs12(Box12, { paddingY: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs12(Text12, { color: theme.danger, bold: true, children: [
        glyph("warn"),
        " Could not load recipes"
      ] }),
      /* @__PURE__ */ jsx13(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx13(Text12, { color: theme.textSecondary, children: state.message }) })
    ] }) }) });
  }
  if (recipes.length === 0) {
    return /* @__PURE__ */ jsx13(Box12, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx13(Pane, { title: "Recipes", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs12(Box12, { paddingY: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs12(Text12, { color: theme.text, bold: true, children: [
        glyph("pkg"),
        " No recipes installed"
      ] }),
      /* @__PURE__ */ jsx13(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx13(Text12, { color: theme.textSecondary, children: "Initialize the default recipe library with:" }) }),
      /* @__PURE__ */ jsx13(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx13(Text12, { color: theme.text, backgroundColor: theme.elevated, children: " forge pack init-defaults " }) }),
      /* @__PURE__ */ jsx13(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: "Then press r to refresh, or 1 to return to the dashboard." }) })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs12(Box12, { flexDirection: "column", flexGrow: 1, paddingX: 1, children: [
    /* @__PURE__ */ jsxs12(Box12, { flexDirection: "row", gap: 1, flexGrow: 1, children: [
      /* @__PURE__ */ jsx13(
        RecipeListPane,
        {
          recipes: filtered,
          totalRecipes: recipes.length,
          selectedIndex: safeIndex,
          search,
          mode
        }
      ),
      /* @__PURE__ */ jsx13(RecipeDetailPane, { recipe: selected })
    ] }),
    /* @__PURE__ */ jsx13(
      ActionFooter2,
      {
        mode,
        feedback,
        feedbackItems,
        totalShown: filtered.length,
        totalAll: recipes.length,
        selectedId: selected?.id ?? null
      }
    )
  ] });
}
function RecipeListPane({
  recipes,
  totalRecipes,
  selectedIndex,
  search,
  mode
}) {
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE2 / 2)),
      Math.max(0, recipes.length - WINDOW_SIZE2)
    )
  );
  const end = Math.min(recipes.length, start + WINDOW_SIZE2);
  const window = recipes.slice(start, end);
  const headerRight = /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: recipes.length === totalRecipes ? `${totalRecipes} installed` : `${recipes.length} shown \xB7 ${totalRecipes} installed` });
  return /* @__PURE__ */ jsx13(Pane, { title: "Recipes", focused: true, flexGrow: 1, right: headerRight, children: /* @__PURE__ */ jsxs12(Box12, { flexDirection: "column", children: [
    (search.length > 0 || mode === "search") && /* @__PURE__ */ jsxs12(Box12, { marginBottom: 1, children: [
      /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: "search" }),
      /* @__PURE__ */ jsxs12(Text12, { color: theme.text, children: [
        " /",
        search
      ] }),
      mode === "search" && /* @__PURE__ */ jsx13(Text12, { color: theme.primary, children: "\u258E" })
    ] }),
    recipes.length === 0 ? /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: "no recipes match the current search" }) : window.map((recipe, i) => {
      const flatIdx = start + i;
      const sel = flatIdx === selectedIndex;
      const fileCount = recipe.files.length;
      return /* @__PURE__ */ jsx13(
        ListRow,
        {
          selected: sel,
          prefix: /* @__PURE__ */ jsx13(Text12, { color: theme.textSecondary, children: glyph("pkg") }),
          right: /* @__PURE__ */ jsxs12(Box12, { flexDirection: "row", gap: 1, children: [
            recipe.tags.slice(0, 2).map((tag) => /* @__PURE__ */ jsx13(Tag, { children: tag }, tag)),
            /* @__PURE__ */ jsxs12(Text12, { color: theme.textMuted, children: [
              fileCount,
              " file",
              fileCount === 1 ? "" : "s"
            ] })
          ] }),
          children: /* @__PURE__ */ jsx13(Text12, { color: sel ? theme.text : theme.textSecondary, children: truncate3(recipe.id, 36) })
        },
        recipe.id
      );
    }),
    recipes.length > WINDOW_SIZE2 && /* @__PURE__ */ jsx13(Box12, { marginTop: 1, children: /* @__PURE__ */ jsxs12(Text12, { color: theme.textMuted, children: [
      "showing ",
      start + 1,
      "\u2013",
      end,
      " of ",
      recipes.length,
      " (j/k to scroll)"
    ] }) })
  ] }) });
}
function RecipeDetailPane({
  recipe
}) {
  if (!recipe) {
    return /* @__PURE__ */ jsx13(Pane, { title: "Recipe", flexGrow: 1, children: /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: "Select a recipe to see details." }) });
  }
  const counts = summarizeOperations(recipe);
  const opSummary = formatOperationCounts(counts);
  return /* @__PURE__ */ jsx13(
    Pane,
    {
      title: `Recipe \xB7 ${recipe.id}`,
      flexGrow: 1,
      right: recipe.tags.length > 0 ? /* @__PURE__ */ jsx13(Box12, { flexDirection: "row", gap: 1, children: recipe.tags.slice(0, 4).map((tag) => /* @__PURE__ */ jsx13(Tag, { children: tag }, tag)) }) : void 0,
      children: /* @__PURE__ */ jsxs12(Box12, { flexDirection: "column", children: [
        /* @__PURE__ */ jsx13(Text12, { color: theme.text, bold: true, children: recipe.name }),
        /* @__PURE__ */ jsx13(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx13(Text12, { color: theme.textSecondary, children: recipe.description.length > 0 ? recipe.description : "(no description)" }) }),
        /* @__PURE__ */ jsxs12(Box12, { marginTop: 1, flexDirection: "row", children: [
          /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: "files " }),
          /* @__PURE__ */ jsxs12(Text12, { color: theme.text, children: [
            recipe.files.length,
            " \xB7 ",
            opSummary
          ] })
        ] }),
        /* @__PURE__ */ jsxs12(Box12, { marginTop: 1, flexDirection: "column", children: [
          /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, bold: true, children: "OPERATIONS" }),
          /* @__PURE__ */ jsx13(OperationList, { recipe })
        ] }),
        recipe.notes && recipe.notes.trim().length > 0 && /* @__PURE__ */ jsxs12(Box12, { marginTop: 1, flexDirection: "column", children: [
          /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, bold: true, children: "NOTES" }),
          /* @__PURE__ */ jsx13(Box12, { marginTop: 0, children: /* @__PURE__ */ jsx13(Text12, { color: theme.textSecondary, children: truncate3(recipe.notes.trim(), 240) }) })
        ] })
      ] })
    }
  );
}
function OperationList({ recipe }) {
  const MAX = 8;
  const visible = recipe.files.slice(0, MAX);
  const overflow = recipe.files.length - visible.length;
  if (visible.length === 0) {
    return /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: "no file operations" });
  }
  return /* @__PURE__ */ jsxs12(Box12, { flexDirection: "column", children: [
    visible.map((file, i) => /* @__PURE__ */ jsxs12(Box12, { flexDirection: "row", children: [
      /* @__PURE__ */ jsx13(Box12, { width: 11, children: /* @__PURE__ */ jsx13(Tag, { color: OPERATION_COLOR[file.operation], tone: "solid", children: file.operation }) }),
      /* @__PURE__ */ jsxs12(Text12, { color: theme.textSecondary, children: [
        " ",
        truncate3(file.path, 48)
      ] }),
      /* @__PURE__ */ jsx13(Box12, { flexGrow: 1 }),
      /* @__PURE__ */ jsxs12(Text12, { color: theme.textMuted, children: [
        file.content.length,
        " B"
      ] })
    ] }, `${i}-${file.path}`)),
    overflow > 0 && /* @__PURE__ */ jsxs12(Text12, { color: theme.textMuted, children: [
      "+ ",
      overflow,
      " more file(s) \u2026"
    ] })
  ] });
}
function ActionFooter2({
  mode,
  feedback,
  feedbackItems,
  totalShown,
  totalAll,
  selectedId
}) {
  let hint;
  if (mode === "search") {
    hint = "search \xB7 type to filter \xB7 enter to commit \xB7 esc to clear";
  } else if (mode === "confirm-apply") {
    hint = `apply ${selectedId ?? ""}? press y to confirm \xB7 n to cancel`;
  } else {
    hint = "j/k navigate \xB7 / search \xB7 enter preview \xB7 p preview \xB7 a apply \xB7 r refresh \xB7 esc back";
  }
  const visibleItems = feedbackItems.slice(0, 4);
  const overflow = feedbackItems.length - visibleItems.length;
  return /* @__PURE__ */ jsxs12(
    Box12,
    {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      borderStyle: "single",
      borderColor: theme.borderSoft,
      children: [
        /* @__PURE__ */ jsxs12(Box12, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx13(Text12, { color: theme.textMuted, children: hint }),
          /* @__PURE__ */ jsx13(Box12, { flexGrow: 1 }),
          /* @__PURE__ */ jsxs12(Text12, { color: theme.textMuted, children: [
            totalShown,
            " shown \xB7 ",
            totalAll,
            " installed"
          ] })
        ] }),
        feedback && /* @__PURE__ */ jsx13(Box12, { marginTop: 0, children: /* @__PURE__ */ jsx13(Text12, { color: theme.text, children: feedback }) }),
        visibleItems.length > 0 && visibleItems.map((item, i) => /* @__PURE__ */ jsxs12(Text12, { color: theme.textSecondary, children: [
          "  ",
          item
        ] }, i)),
        overflow > 0 && /* @__PURE__ */ jsxs12(Text12, { color: theme.textMuted, children: [
          "  ",
          "+ ",
          overflow,
          " more line(s) \u2026"
        ] })
      ]
    }
  );
}
function truncate3(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}\u2026`;
}

// src/tui/screens/PromptsScreen.tsx
import { useCallback as useCallback3, useEffect as useEffect4, useMemo as useMemo4, useState as useState5 } from "react";
import { Box as Box13, Text as Text13, useInput as useInput4 } from "ink";
import Spinner5 from "ink-spinner";

// src/tui/screens/prompt-helpers.ts
var PROMPT_TYPE_LIST = [
  "feature",
  "debug",
  "refactor",
  "audit",
  "test",
  "cleanup",
  "deploy",
  "review"
];
function filterPrompts(prompts, query, typeFilter) {
  const q = query.trim().toLowerCase();
  return prompts.filter((entry) => {
    if (typeFilter !== null && entry.type !== typeFilter) {
      return false;
    }
    if (q.length === 0) return true;
    return entry.id.toLowerCase().includes(q) || entry.task.toLowerCase().includes(q) || entry.type.toLowerCase().includes(q) || entry.mode.toLowerCase().includes(q) || entry.projectRoot.toLowerCase().includes(q);
  });
}
function sortNewestFirst(prompts) {
  return [...prompts].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
function cycleTypeFilter(current) {
  if (current === null) {
    return PROMPT_TYPE_LIST[0];
  }
  const idx = PROMPT_TYPE_LIST.indexOf(current);
  if (idx === -1 || idx === PROMPT_TYPE_LIST.length - 1) {
    return null;
  }
  return PROMPT_TYPE_LIST[idx + 1];
}
function clampIndex4(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}
function formatTimestamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// src/tui/screens/PromptsScreen.tsx
import { jsx as jsx14, jsxs as jsxs13 } from "react/jsx-runtime";
var WINDOW_SIZE3 = 14;
var BODY_LINE_LIMIT = 28;
var TYPE_COLORS = {
  feature: theme.primary,
  debug: theme.warning,
  refactor: theme.secondary,
  audit: theme.danger,
  test: theme.success,
  cleanup: theme.textSecondary,
  deploy: theme.primary,
  review: theme.secondary
};
function PromptsScreen({
  appState
}) {
  const [state, setState] = useState5({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState5(0);
  const [search, setSearch] = useState5("");
  const [typeFilter, setTypeFilter] = useState5(null);
  const [mode, setMode] = useState5("browse");
  const [feedback, setFeedback] = useState5(null);
  const reload = useCallback3(async () => {
    setState({ kind: "loading" });
    setFeedback(null);
    try {
      const prompts2 = sortNewestFirst(await loadHistory());
      setState({ kind: "ready", prompts: prompts2 });
      setSelectedIndex(0);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);
  useEffect4(() => {
    void reload();
  }, [reload]);
  useEffect4(() => {
    appState.setInputCaptured(mode === "search");
    return () => {
      appState.setInputCaptured(false);
    };
  }, [mode, appState]);
  const prompts = state.kind === "ready" ? state.prompts : [];
  const filtered = useMemo4(
    () => filterPrompts(prompts, search, typeFilter),
    [prompts, search, typeFilter]
  );
  const safeIndex = clampIndex4(selectedIndex, filtered.length);
  const selected = filtered[safeIndex] ?? null;
  const handleCopy = useCallback3(async () => {
    if (!selected) {
      setFeedback("No prompt selected.");
      return;
    }
    const target = selected;
    setFeedback(`Copying ${target.id} \u2026`);
    try {
      const result = await copyPrompt(target.id);
      if (result.copied) {
        setFeedback(`Copied prompt ${target.id} to clipboard.`);
      } else {
        setFeedback(
          result.reason ?? "Clipboard unavailable. Install `clipboardy` to enable copy."
        );
      }
    } catch (err) {
      setFeedback(
        `Copy failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }, [selected]);
  const handleClear = useCallback3(async () => {
    setMode("browse");
    setState({ kind: "working", message: "Clearing prompt history \u2026" });
    setFeedback(null);
    try {
      await clearHistory();
      setFeedback("Cleared all saved prompts.");
      await reload();
    } catch (err) {
      setFeedback(
        `Clear failed: ${err instanceof Error ? err.message : String(err)}`
      );
      await reload();
    }
  }, [reload]);
  useInput4((input, key) => {
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
      setSelectedIndex((i) => clampIndex4(i + 1, filtered.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => clampIndex4(i - 1, filtered.length));
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
      setFeedback(selected ? `Viewing prompt ${selected.id}.` : null);
    }
  });
  if (state.kind === "loading") {
    return /* @__PURE__ */ jsx14(Box13, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx14(Pane, { title: "Prompts", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs13(Box13, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx14(Text13, { color: theme.primary, children: /* @__PURE__ */ jsx14(Spinner5, { type: "dots" }) }),
      /* @__PURE__ */ jsxs13(Text13, { color: theme.textSecondary, children: [
        " ",
        "loading prompt history \u2026"
      ] })
    ] }) }) });
  }
  if (state.kind === "working") {
    return /* @__PURE__ */ jsx14(Box13, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx14(Pane, { title: "Prompts", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs13(Box13, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx14(Text13, { color: theme.primary, children: /* @__PURE__ */ jsx14(Spinner5, { type: "dots" }) }),
      /* @__PURE__ */ jsxs13(Text13, { color: theme.textSecondary, children: [
        " ",
        state.message
      ] })
    ] }) }) });
  }
  if (state.kind === "error") {
    return /* @__PURE__ */ jsx14(Box13, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx14(Pane, { title: "Prompts", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs13(Box13, { paddingY: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs13(Text13, { color: theme.danger, bold: true, children: [
        glyph("warn"),
        " Could not load prompt history"
      ] }),
      /* @__PURE__ */ jsx14(Box13, { marginTop: 1, children: /* @__PURE__ */ jsx14(Text13, { color: theme.textSecondary, children: state.message }) })
    ] }) }) });
  }
  if (prompts.length === 0) {
    return /* @__PURE__ */ jsx14(Box13, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx14(Pane, { title: "Prompts", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs13(Box13, { paddingY: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs13(Text13, { color: theme.text, bold: true, children: [
        glyph("terminal"),
        " No prompts yet"
      ] }),
      /* @__PURE__ */ jsx14(Box13, { marginTop: 1, children: /* @__PURE__ */ jsx14(Text13, { color: theme.textSecondary, children: "Generate your first prompt with:" }) }),
      /* @__PURE__ */ jsx14(Box13, { marginTop: 1, children: /* @__PURE__ */ jsx14(Text13, { color: theme.text, backgroundColor: theme.elevated, children: ' forge prompt feature "add Supabase auth" ' }) }),
      /* @__PURE__ */ jsx14(Box13, { marginTop: 1, children: /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: "Prompts you generate are saved to ~/.forge/prompts/history.json." }) })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs13(Box13, { flexDirection: "column", flexGrow: 1, paddingX: 1, children: [
    /* @__PURE__ */ jsx14(TypeChipBar, { typeFilter }),
    /* @__PURE__ */ jsxs13(Box13, { flexDirection: "row", gap: 1, flexGrow: 1, children: [
      /* @__PURE__ */ jsx14(
        PromptListPane,
        {
          prompts: filtered,
          totalPrompts: prompts.length,
          selectedIndex: safeIndex,
          search,
          mode
        }
      ),
      /* @__PURE__ */ jsx14(PromptDetailPane, { entry: selected })
    ] }),
    /* @__PURE__ */ jsx14(
      ActionFooter3,
      {
        mode,
        feedback,
        totalShown: filtered.length,
        totalAll: prompts.length,
        typeFilter,
        selectedId: selected?.id ?? null
      }
    )
  ] });
}
function TypeChipBar({
  typeFilter
}) {
  return /* @__PURE__ */ jsxs13(Box13, { flexDirection: "row", marginBottom: 1, flexWrap: "wrap", children: [
    /* @__PURE__ */ jsx14(ChipItem, { label: "all", active: typeFilter === null, color: theme.primary }),
    PROMPT_TYPE_LIST.map((t) => /* @__PURE__ */ jsx14(
      ChipItem,
      {
        label: t,
        active: typeFilter === t,
        color: TYPE_COLORS[t]
      },
      t
    )),
    /* @__PURE__ */ jsx14(Box13, { flexGrow: 1 }),
    /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: "press t to cycle" })
  ] });
}
function ChipItem({
  label,
  active,
  color
}) {
  if (active) {
    return /* @__PURE__ */ jsx14(Box13, { marginRight: 1, children: /* @__PURE__ */ jsx14(Text13, { color: theme.bg, backgroundColor: color, bold: true, children: ` ${label} ` }) });
  }
  return /* @__PURE__ */ jsx14(Box13, { marginRight: 1, children: /* @__PURE__ */ jsx14(Text13, { color: theme.textSecondary, children: `[${label}]` }) });
}
function PromptListPane({
  prompts,
  totalPrompts,
  selectedIndex,
  search,
  mode
}) {
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW_SIZE3 / 2)),
      Math.max(0, prompts.length - WINDOW_SIZE3)
    )
  );
  const end = Math.min(prompts.length, start + WINDOW_SIZE3);
  const window = prompts.slice(start, end);
  const headerRight = /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: prompts.length === totalPrompts ? `${totalPrompts} total` : `${prompts.length} shown \xB7 ${totalPrompts} total` });
  return /* @__PURE__ */ jsx14(Pane, { title: "History", focused: true, flexGrow: 1, right: headerRight, children: /* @__PURE__ */ jsxs13(Box13, { flexDirection: "column", children: [
    (search.length > 0 || mode === "search") && /* @__PURE__ */ jsxs13(Box13, { marginBottom: 1, children: [
      /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: "search" }),
      /* @__PURE__ */ jsxs13(Text13, { color: theme.text, children: [
        " /",
        search
      ] }),
      mode === "search" && /* @__PURE__ */ jsx14(Text13, { color: theme.primary, children: "\u258E" })
    ] }),
    prompts.length === 0 ? /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: "no prompts match the current filter" }) : window.map((entry, i) => {
      const flatIdx = start + i;
      const sel = flatIdx === selectedIndex;
      return /* @__PURE__ */ jsx14(
        ListRow,
        {
          selected: sel,
          prefix: /* @__PURE__ */ jsx14(Tag, { color: TYPE_COLORS[entry.type], children: entry.type }),
          right: /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: formatTimestamp(entry.timestamp) }),
          children: /* @__PURE__ */ jsx14(Text13, { color: sel ? theme.text : theme.textSecondary, children: truncate4(entry.task, 48) })
        },
        entry.id
      );
    }),
    prompts.length > WINDOW_SIZE3 && /* @__PURE__ */ jsx14(Box13, { marginTop: 1, children: /* @__PURE__ */ jsxs13(Text13, { color: theme.textMuted, children: [
      "showing ",
      start + 1,
      "\u2013",
      end,
      " of ",
      prompts.length,
      " (j/k to scroll)"
    ] }) })
  ] }) });
}
function PromptDetailPane({
  entry
}) {
  if (!entry) {
    return /* @__PURE__ */ jsx14(Pane, { title: "Prompt", flexGrow: 1, children: /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: "Select a prompt to see its body." }) });
  }
  const lines = entry.prompt.split("\n");
  const visible = lines.slice(0, BODY_LINE_LIMIT);
  const overflow = lines.length - visible.length;
  return /* @__PURE__ */ jsx14(
    Pane,
    {
      title: `Prompt \xB7 ${entry.id}`,
      flexGrow: 1,
      right: /* @__PURE__ */ jsxs13(Box13, { flexDirection: "row", gap: 1, children: [
        /* @__PURE__ */ jsx14(Tag, { color: TYPE_COLORS[entry.type], tone: "solid", children: entry.type }),
        /* @__PURE__ */ jsx14(Tag, { color: theme.secondary, children: `mode ${entry.mode}` })
      ] }),
      children: /* @__PURE__ */ jsxs13(Box13, { flexDirection: "column", children: [
        /* @__PURE__ */ jsx14(Text13, { color: theme.text, bold: true, children: entry.task }),
        /* @__PURE__ */ jsxs13(Box13, { marginTop: 1, flexDirection: "column", children: [
          /* @__PURE__ */ jsx14(
            KeyValue,
            {
              label: "generated",
              value: formatTimestamp(entry.timestamp)
            }
          ),
          /* @__PURE__ */ jsx14(
            KeyValue,
            {
              label: "project",
              value: /* @__PURE__ */ jsx14(Text13, { color: theme.textSecondary, children: truncate4(entry.projectRoot, 48) })
            }
          ),
          /* @__PURE__ */ jsx14(KeyValue, { label: "type", value: entry.type }),
          /* @__PURE__ */ jsx14(KeyValue, { label: "mode", value: entry.mode })
        ] }),
        /* @__PURE__ */ jsxs13(Box13, { marginTop: 1, flexDirection: "column", children: [
          /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, bold: true, children: "BODY" }),
          /* @__PURE__ */ jsxs13(
            Box13,
            {
              marginTop: 0,
              paddingX: 1,
              borderStyle: "single",
              borderColor: theme.borderSoft,
              flexDirection: "column",
              children: [
                visible.map((line, i) => /* @__PURE__ */ jsx14(
                  Text13,
                  {
                    color: line.startsWith("# ") ? theme.primary : line.startsWith("## ") ? theme.secondary : theme.text,
                    children: line.length > 0 ? line : " "
                  },
                  i
                )),
                overflow > 0 && /* @__PURE__ */ jsxs13(Text13, { color: theme.textMuted, children: [
                  "\u2026 ",
                  overflow,
                  " more line(s). Press y to copy the full prompt."
                ] })
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function ActionFooter3({
  mode,
  feedback,
  totalShown,
  totalAll,
  typeFilter,
  selectedId
}) {
  let hint;
  if (mode === "search") {
    hint = "search \xB7 type to filter \xB7 enter to commit \xB7 esc to clear";
  } else if (mode === "confirm-clear") {
    hint = "clear ALL saved prompts? press y to confirm \xB7 n to cancel";
  } else {
    hint = "j/k navigate \xB7 / search \xB7 t cycle type \xB7 y copy \xB7 enter view \xB7 c clear \xB7 esc back";
  }
  return /* @__PURE__ */ jsxs13(
    Box13,
    {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      borderStyle: "single",
      borderColor: theme.borderSoft,
      children: [
        /* @__PURE__ */ jsxs13(Box13, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx14(Text13, { color: theme.textMuted, children: hint }),
          /* @__PURE__ */ jsx14(Box13, { flexGrow: 1 }),
          /* @__PURE__ */ jsxs13(Text13, { color: theme.textMuted, children: [
            typeFilter ? `type: ${typeFilter} \xB7 ` : "",
            totalShown,
            " shown \xB7 ",
            totalAll,
            " total",
            selectedId ? ` \xB7 selected ${selectedId}` : ""
          ] })
        ] }),
        feedback && /* @__PURE__ */ jsx14(Box13, { marginTop: 0, children: /* @__PURE__ */ jsx14(Text13, { color: theme.text, children: feedback }) })
      ]
    }
  );
}
function truncate4(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}\u2026`;
}

// src/tui/screens/LaunchScreen.tsx
import { useCallback as useCallback4, useEffect as useEffect5, useMemo as useMemo5, useState as useState6 } from "react";
import { Box as Box14, Text as Text14, useInput as useInput5 } from "ink";
import Spinner6 from "ink-spinner";

// src/modules/launchcheck/reports.ts
import fs7 from "fs/promises";
import os4 from "os";
import path23 from "path";
function safeProjectName(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "unnamed";
}
async function resolveProjectName(cwd, explicit) {
  if (explicit) {
    return safeProjectName(explicit);
  }
  const raw = await readJsonFile(
    path23.join(cwd, "package.json")
  );
  if (raw?.name) {
    return safeProjectName(raw.name);
  }
  return safeProjectName(path23.basename(cwd));
}
function getReportsBaseDir() {
  return path23.join(os4.homedir(), ".forge", "reports");
}
function getReportsDir(projectName) {
  return path23.join(getReportsBaseDir(), projectName);
}
function timestampToFilename(ts) {
  return ts.replace(/:/g, "-").replace(/\./g, "-");
}
async function saveReport(result, opts) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const report = {
    ...result,
    project: opts.project,
    cwd: result.projectRoot,
    timestamp,
    ...opts.url !== void 0 ? { url: opts.url } : {}
  };
  const dir = getReportsDir(opts.project);
  await ensureDir(dir);
  const filePath = path23.join(dir, `${timestampToFilename(timestamp)}.json`);
  await writeJsonFile(filePath, report);
  return filePath;
}
async function listReports(projectName) {
  const dir = getReportsDir(projectName);
  let files;
  try {
    const entries = await fs7.readdir(dir);
    files = entries.filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const reports = [];
  for (const file of files) {
    const report = await readJsonFile(path23.join(dir, file));
    if (report) {
      reports.push(report);
    }
  }
  return reports;
}

// src/tui/screens/launch-helpers.ts
var STATUS_RANK = {
  pass: 0,
  warn: 1,
  fail: 2
};
function categorizeCheck(prev, cur) {
  if (prev === void 0 && cur !== void 0) return "new";
  if (prev !== void 0 && cur === void 0) return "removed";
  if (prev === void 0 || cur === void 0) return "unchanged";
  if (prev === cur) return "unchanged";
  return STATUS_RANK[cur] < STATUS_RANK[prev] ? "fixed" : "regressed";
}
function groupKeyFor(checkId) {
  const first = checkId.split("-")[0];
  return first.length > 0 ? first : "other";
}
function buildCheckRows(from, to) {
  const fromById = new Map(
    (from?.checks ?? []).map((c) => [c.id, c])
  );
  const toById = new Map(
    (to?.checks ?? []).map((c) => [c.id, c])
  );
  const allIds = /* @__PURE__ */ new Set([...fromById.keys(), ...toById.keys()]);
  const rows = [];
  for (const id of allIds) {
    const prevCheck = fromById.get(id);
    const curCheck = toById.get(id);
    const title = curCheck?.title ?? prevCheck?.title ?? id;
    const message = curCheck?.message ?? prevCheck?.message;
    const change = categorizeCheck(prevCheck?.status, curCheck?.status);
    rows.push({
      id,
      title,
      group: groupKeyFor(id),
      prevStatus: prevCheck?.status ?? null,
      curStatus: curCheck?.status ?? null,
      change,
      ...message !== void 0 ? { message } : {}
    });
  }
  return rows;
}
var CHANGE_RANK = {
  regressed: 0,
  new: 1,
  fixed: 2,
  removed: 3,
  unchanged: 4
};
function groupChecks(rows) {
  const byGroup = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const bucket = byGroup.get(row.group) ?? [];
    bucket.push(row);
    byGroup.set(row.group, bucket);
  }
  const groups = [];
  for (const [group, items] of byGroup) {
    groups.push({
      group,
      items: [...items].sort(
        (a, b) => CHANGE_RANK[a.change] - CHANGE_RANK[b.change]
      )
    });
  }
  groups.sort((a, b) => a.group.localeCompare(b.group));
  return groups;
}
function countChanges(rows) {
  const counts = {
    fixed: 0,
    regressed: 0,
    new: 0,
    removed: 0,
    unchanged: 0
  };
  for (const row of rows) {
    counts[row.change] += 1;
  }
  return counts;
}
function sortReportsNewestFirst(reports) {
  return [...reports].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
function clampIndex5(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

// src/tui/screens/LaunchScreen.tsx
import { Fragment, jsx as jsx15, jsxs as jsxs14 } from "react/jsx-runtime";
var STATUS_COLOR = {
  pass: theme.success,
  warn: theme.warning,
  fail: theme.danger
};
var CHANGE_LABEL = {
  fixed: "FIXED",
  regressed: "REGRESS",
  new: "NEW",
  removed: "GONE",
  unchanged: "\u2014"
};
var CHANGE_COLOR = {
  fixed: theme.success,
  regressed: theme.danger,
  new: theme.primary,
  removed: theme.textMuted,
  unchanged: theme.textMuted
};
function LaunchScreen({
  appState
}) {
  const [state, setState] = useState6({ kind: "loading" });
  const [selectedIndex, setSelectedIndex] = useState6(0);
  const [pendingResult, setPendingResult] = useState6(null);
  const [feedback, setFeedback] = useState6(null);
  const [projectName, setProjectName] = useState6("");
  const reload = useCallback4(async () => {
    setState({ kind: "loading" });
    setFeedback(null);
    try {
      const name = await resolveProjectName(process.cwd());
      const raw = await listReports(name);
      const reports2 = sortReportsNewestFirst(raw);
      setProjectName(name);
      setState({ kind: "ready", reports: reports2 });
      setSelectedIndex(0);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);
  useEffect5(() => {
    void reload();
  }, [reload]);
  const reports = state.kind === "ready" ? state.reports : [];
  const safeIndex = clampIndex5(selectedIndex, reports.length);
  const selectedReport = reports[safeIndex] ?? null;
  const previousReport = reports[safeIndex + 1] ?? null;
  const rows = useMemo5(
    () => buildCheckRows(previousReport, selectedReport),
    [previousReport, selectedReport]
  );
  const groups = useMemo5(() => groupChecks(rows), [rows]);
  const changeCounts = useMemo5(() => countChanges(rows), [rows]);
  const handleRun = useCallback4(async () => {
    setState({
      kind: "running",
      message: "Running launch check (build skipped) \u2026"
    });
    setFeedback(null);
    try {
      const result = await runLaunchCheck({
        cwd: process.cwd(),
        skipBuild: true,
        strict: false
      });
      setPendingResult(result);
      setFeedback(
        `Fresh run: ${result.score}/100 ${result.status.toUpperCase()} \u2014 press s to save.`
      );
      setState({ kind: "ready", reports });
    } catch (err) {
      setFeedback(
        `Run failed: ${err instanceof Error ? err.message : String(err)}`
      );
      setState({ kind: "ready", reports });
    }
  }, [reports]);
  const handleSave = useCallback4(async () => {
    if (!pendingResult) {
      setFeedback("No fresh run to save. Press r to run a launch check first.");
      return;
    }
    const result = pendingResult;
    setState({ kind: "running", message: "Saving report \u2026" });
    setFeedback(null);
    try {
      const target = projectName.length > 0 ? projectName : await resolveProjectName(process.cwd());
      const path26 = await saveReport(result, { project: target });
      setPendingResult(null);
      setFeedback(`Saved report \u2192 ${path26}`);
      await reload();
    } catch (err) {
      setFeedback(
        `Save failed: ${err instanceof Error ? err.message : String(err)}`
      );
      setState({ kind: "ready", reports });
    }
  }, [pendingResult, projectName, reports, reload]);
  const handleCompare = useCallback4(() => {
    if (!selectedReport) {
      setFeedback("No report selected.");
      return;
    }
    if (!previousReport) {
      setFeedback("No previous report to compare against.");
      return;
    }
    setFeedback(
      `Comparing ${selectedReport.timestamp} vs ${previousReport.timestamp}.`
    );
  }, [selectedReport, previousReport]);
  useInput5((input, key) => {
    if (state.kind !== "ready") return;
    if (key.escape) {
      appState.setRoute("dashboard");
      return;
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => clampIndex5(i + 1, reports.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => clampIndex5(i - 1, reports.length));
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
      if (selectedReport) {
        setFeedback(`Viewing report ${selectedReport.timestamp}.`);
      }
    }
  });
  if (state.kind === "loading") {
    return /* @__PURE__ */ jsx15(Box14, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx15(Pane, { title: "Launch", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs14(Box14, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx15(Text14, { color: theme.primary, children: /* @__PURE__ */ jsx15(Spinner6, { type: "dots" }) }),
      /* @__PURE__ */ jsxs14(Text14, { color: theme.textSecondary, children: [
        " ",
        "loading saved launch reports \u2026"
      ] })
    ] }) }) });
  }
  if (state.kind === "running") {
    return /* @__PURE__ */ jsx15(Box14, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx15(Pane, { title: "Launch", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs14(Box14, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx15(Text14, { color: theme.primary, children: /* @__PURE__ */ jsx15(Spinner6, { type: "dots" }) }),
      /* @__PURE__ */ jsxs14(Text14, { color: theme.textSecondary, children: [
        " ",
        state.message
      ] })
    ] }) }) });
  }
  if (state.kind === "error") {
    return /* @__PURE__ */ jsx15(Box14, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx15(Pane, { title: "Launch", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs14(Box14, { paddingY: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs14(Text14, { color: theme.danger, bold: true, children: [
        glyph("warn"),
        " Could not load reports"
      ] }),
      /* @__PURE__ */ jsx15(Box14, { marginTop: 1, children: /* @__PURE__ */ jsx15(Text14, { color: theme.textSecondary, children: state.message }) })
    ] }) }) });
  }
  if (reports.length === 0) {
    return /* @__PURE__ */ jsx15(
      EmptyState,
      {
        pendingResult,
        feedback,
        projectName
      }
    );
  }
  return /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", flexGrow: 1, paddingX: 1, children: [
    /* @__PURE__ */ jsx15(
      SummaryBanner,
      {
        current: selectedReport,
        previous: previousReport,
        pendingResult,
        changeCounts
      }
    ),
    /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", gap: 1, flexGrow: 1, children: [
      /* @__PURE__ */ jsx15(
        ReportListPane,
        {
          reports,
          selectedIndex: safeIndex,
          projectName
        }
      ),
      /* @__PURE__ */ jsx15(ChecksPane, { groups, hasPrevious: previousReport !== null })
    ] }),
    /* @__PURE__ */ jsx15(
      ActionFooter4,
      {
        feedback,
        pendingResult,
        selected: selectedReport,
        previous: previousReport
      }
    )
  ] });
}
function SummaryBanner({
  current,
  previous,
  pendingResult,
  changeCounts
}) {
  if (!current) {
    return /* @__PURE__ */ jsx15(Box14, {});
  }
  const delta = previous ? current.score - previous.score : 0;
  const deltaColor = delta > 0 ? theme.success : delta < 0 ? theme.danger : theme.textMuted;
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;
  return /* @__PURE__ */ jsxs14(
    Box14,
    {
      flexDirection: "row",
      marginBottom: 1,
      paddingX: 1,
      borderStyle: "round",
      borderColor: theme.borderSoft,
      gap: 2,
      children: [
        /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", children: [
          /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "previous" }),
          previous ? /* @__PURE__ */ jsxs14(Fragment, { children: [
            /* @__PURE__ */ jsx15(Text14, { color: theme.textSecondary, bold: true, children: previous.score }),
            /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: previous.timestamp })
          ] }) : /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "\u2014" })
        ] }),
        /* @__PURE__ */ jsx15(Box14, { flexDirection: "column", justifyContent: "center", children: /* @__PURE__ */ jsx15(Text14, { color: deltaColor, bold: true, children: previous ? `${glyph("arrow")} ${deltaText}` : glyph("arrow") }) }),
        /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", children: [
          /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "current" }),
          /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", children: [
            /* @__PURE__ */ jsx15(Text14, { color: theme.text, bold: true, children: current.score }),
            /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: " / 100" })
          ] }),
          /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", children: [
            /* @__PURE__ */ jsx15(Tag, { color: STATUS_COLOR[current.status], tone: "solid", children: current.status.toUpperCase() }),
            /* @__PURE__ */ jsxs14(Text14, { color: theme.textMuted, children: [
              " ",
              current.timestamp
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx15(Box14, { flexGrow: 1 }),
        /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", children: [
          /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "changes" }),
          /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", gap: 1, children: [
            /* @__PURE__ */ jsx15(Tag, { color: theme.success, children: `${changeCounts.fixed} fixed` }),
            /* @__PURE__ */ jsx15(Tag, { color: theme.danger, children: `${changeCounts.regressed} regressed` }),
            /* @__PURE__ */ jsx15(Tag, { color: theme.primary, children: `${changeCounts.new} new` })
          ] })
        ] }),
        pendingResult && /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", marginLeft: 2, children: [
          /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "pending" }),
          /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", children: [
            /* @__PURE__ */ jsx15(Text14, { color: theme.text, children: pendingResult.score }),
            /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "/100" })
          ] }),
          /* @__PURE__ */ jsx15(Tag, { color: theme.warning, children: "unsaved" })
        ] })
      ]
    }
  );
}
function ReportListPane({
  reports,
  selectedIndex,
  projectName
}) {
  const WINDOW = 14;
  const start = Math.max(
    0,
    Math.min(
      Math.max(0, selectedIndex - Math.floor(WINDOW / 2)),
      Math.max(0, reports.length - WINDOW)
    )
  );
  const end = Math.min(reports.length, start + WINDOW);
  const window = reports.slice(start, end);
  return /* @__PURE__ */ jsx15(
    Pane,
    {
      title: "Reports",
      focused: true,
      flexGrow: 1,
      right: /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: projectName || "project" }),
      children: /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", children: [
        window.map((report, i) => {
          const flatIdx = start + i;
          const sel = flatIdx === selectedIndex;
          return /* @__PURE__ */ jsx15(
            ListRow,
            {
              selected: sel,
              prefix: /* @__PURE__ */ jsx15(Tag, { color: STATUS_COLOR[report.status], children: report.status }),
              right: /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: `${report.score}/100` }),
              children: /* @__PURE__ */ jsx15(Text14, { color: sel ? theme.text : theme.textSecondary, children: truncate5(report.timestamp, 28) })
            },
            report.timestamp
          );
        }),
        reports.length > WINDOW && /* @__PURE__ */ jsx15(Box14, { marginTop: 1, children: /* @__PURE__ */ jsxs14(Text14, { color: theme.textMuted, children: [
          "showing ",
          start + 1,
          "\u2013",
          end,
          " of ",
          reports.length,
          " (j/k to scroll)"
        ] }) })
      ] })
    }
  );
}
function ChecksPane({
  groups,
  hasPrevious
}) {
  if (groups.length === 0) {
    return /* @__PURE__ */ jsx15(Pane, { title: "Checks", flexGrow: 2, children: /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "No checks recorded in this report." }) });
  }
  return /* @__PURE__ */ jsx15(
    Pane,
    {
      title: "Checks",
      flexGrow: 2,
      right: /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: hasPrevious ? "diff vs previous" : "no previous report" }),
      children: /* @__PURE__ */ jsx15(Box14, { flexDirection: "column", children: groups.map((g) => /* @__PURE__ */ jsxs14(Box14, { flexDirection: "column", marginBottom: 1, children: [
        /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, bold: true, children: g.group.toUpperCase() }),
          /* @__PURE__ */ jsx15(Box14, { flexGrow: 1 }),
          /* @__PURE__ */ jsxs14(Text14, { color: theme.textMuted, children: [
            g.items.length,
            " check",
            g.items.length === 1 ? "" : "s"
          ] })
        ] }),
        g.items.map((row) => /* @__PURE__ */ jsx15(CheckRowView, { row }, row.id))
      ] }, g.group)) })
    }
  );
}
function CheckRowView({ row }) {
  return /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx15(Box14, { width: 3, children: /* @__PURE__ */ jsx15(Text14, { color: row.prevStatus ? STATUS_COLOR[row.prevStatus] : theme.textMuted, children: row.prevStatus ? statusGlyph(row.prevStatus) : "\xB7" }) }),
    /* @__PURE__ */ jsxs14(Text14, { color: theme.textMuted, children: [
      glyph("arrow"),
      " "
    ] }),
    /* @__PURE__ */ jsx15(Box14, { width: 3, children: /* @__PURE__ */ jsx15(Text14, { color: row.curStatus ? STATUS_COLOR[row.curStatus] : theme.textMuted, children: row.curStatus ? statusGlyph(row.curStatus) : "\xB7" }) }),
    /* @__PURE__ */ jsx15(Box14, { flexGrow: 1, children: /* @__PURE__ */ jsx15(Text14, { color: theme.text, children: truncate5(row.title, 60) }) }),
    row.change !== "unchanged" && /* @__PURE__ */ jsx15(Tag, { color: CHANGE_COLOR[row.change], tone: "solid", children: CHANGE_LABEL[row.change] })
  ] });
}
function statusGlyph(status) {
  if (status === "pass") return glyph("check");
  if (status === "warn") return glyph("warn");
  return glyph("cross");
}
function EmptyState({
  pendingResult,
  feedback,
  projectName
}) {
  return /* @__PURE__ */ jsx15(Box14, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx15(Pane, { title: "Launch", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs14(Box14, { paddingY: 1, flexDirection: "column", children: [
    /* @__PURE__ */ jsxs14(Text14, { color: theme.text, bold: true, children: [
      glyph("info"),
      " No saved launch reports for",
      " ",
      projectName || "this project"
    ] }),
    /* @__PURE__ */ jsx15(Box14, { marginTop: 1, children: /* @__PURE__ */ jsx15(Text14, { color: theme.textSecondary, children: "Save a report from the CLI:" }) }),
    /* @__PURE__ */ jsx15(Box14, { marginTop: 1, children: /* @__PURE__ */ jsx15(Text14, { color: theme.text, backgroundColor: theme.elevated, children: " forge launch --skip-build --save " }) }),
    /* @__PURE__ */ jsx15(Box14, { marginTop: 1, children: /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: "Or press r to run a check here (build skipped), then s to save." }) }),
    pendingResult && /* @__PURE__ */ jsxs14(Box14, { marginTop: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx15(Tag, { color: STATUS_COLOR[pendingResult.status], tone: "solid", children: pendingResult.status.toUpperCase() }),
      /* @__PURE__ */ jsxs14(Text14, { color: theme.text, children: [
        " ",
        pendingResult.score,
        "/100 \u2014 press s to save"
      ] })
    ] }),
    feedback && /* @__PURE__ */ jsx15(Box14, { marginTop: 1, children: /* @__PURE__ */ jsx15(Text14, { color: theme.textSecondary, children: feedback }) })
  ] }) }) });
}
function ActionFooter4({
  feedback,
  pendingResult,
  selected,
  previous
}) {
  const hint = "j/k navigate \xB7 d compare \xB7 r run (no build) \xB7 s save \xB7 enter view \xB7 esc back";
  return /* @__PURE__ */ jsxs14(
    Box14,
    {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      borderStyle: "single",
      borderColor: theme.borderSoft,
      children: [
        /* @__PURE__ */ jsxs14(Box14, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: hint }),
          /* @__PURE__ */ jsx15(Box14, { flexGrow: 1 }),
          pendingResult && /* @__PURE__ */ jsx15(Text14, { color: theme.warning, children: "pending unsaved run \u2014 press s" }),
          !pendingResult && selected && /* @__PURE__ */ jsx15(Text14, { color: theme.textMuted, children: previous ? "diff vs previous" : "no previous report" })
        ] }),
        feedback && /* @__PURE__ */ jsx15(Box14, { marginTop: 0, children: /* @__PURE__ */ jsx15(Text14, { color: theme.text, children: feedback }) }),
        selected && selected.url && /* @__PURE__ */ jsx15(Box14, { marginTop: 0, children: /* @__PURE__ */ jsx15(
          KeyValue,
          {
            label: "url",
            value: /* @__PURE__ */ jsx15(Text14, { color: theme.textSecondary, children: truncate5(selected.url, 64) })
          }
        ) })
      ]
    }
  );
}
function truncate5(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}\u2026`;
}

// src/tui/screens/ConfigScreen.tsx
import { useCallback as useCallback5, useEffect as useEffect6, useState as useState7 } from "react";
import os5 from "os";
import path24 from "path";
import { Box as Box15, Text as Text15, useInput as useInput6 } from "ink";
import Spinner7 from "ink-spinner";

// src/tui/screens/config-helpers.ts
var SECTIONS = [
  { id: "defaults", label: "Defaults" },
  { id: "generation", label: "Generation" },
  { id: "templates", label: "Templates" },
  { id: "paths", label: "Paths" }
];
var SETTINGS = [
  {
    key: "preferredPackageManager",
    section: "defaults",
    label: "Package manager",
    description: "Preferred package manager for scaffolding commands.",
    options: ["npm", "pnpm", "yarn", "bun"]
  },
  {
    key: "defaultPromptMode",
    section: "defaults",
    label: "Prompt mode",
    description: "Default mode for `forge prompt`. plan = inspect, implement = build, review = report.",
    options: ["plan", "implement", "review"]
  },
  {
    key: "componentStyle",
    section: "generation",
    label: "Component style",
    description: "Export style used by `forge component` scaffolds (named vs default export).",
    options: ["named-export", "default-export"]
  },
  {
    key: "testFramework",
    section: "generation",
    label: "Test framework",
    description: "Framework chosen by `forge component --with-test`.",
    options: ["vitest", "jest", "none"]
  }
];
function getSettingsForSection(section) {
  return SETTINGS.filter((s) => s.section === section);
}
function getCurrentValue(config, setting) {
  const value = config[setting.key];
  return typeof value === "string" ? value : String(value);
}
function applySettingChange(config, key, value) {
  const next = { ...config, [key]: value };
  const parsed = ForgeConfigSchema.safeParse(next);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    };
  }
  return { ok: true, config: parsed.data };
}
function getDefaultConfig() {
  return ForgeConfigSchema.parse({});
}
function clampIndex6(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}
function findOptionIndex(setting, value) {
  const idx = setting.options.indexOf(value);
  return idx >= 0 ? idx : 0;
}

// src/tui/screens/ConfigScreen.tsx
import { jsx as jsx16, jsxs as jsxs15 } from "react/jsx-runtime";
function ConfigScreen({
  appState
}) {
  const [state, setState] = useState7({ kind: "loading" });
  const [settingIndex, setSettingIndex] = useState7(0);
  const [mode, setMode] = useState7("browse");
  const [editOptionIndex, setEditOptionIndex] = useState7(0);
  const [feedback, setFeedback] = useState7(null);
  const reload = useCallback5(async () => {
    setState({ kind: "loading" });
    setFeedback(null);
    try {
      const config2 = await readForgeConfig();
      setState({ kind: "ready", config: config2 });
      setSettingIndex(0);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);
  useEffect6(() => {
    void reload();
  }, [reload]);
  const config = state.kind === "ready" ? state.config : null;
  const safeIndex = clampIndex6(settingIndex, SETTINGS.length);
  const selectedSetting = SETTINGS[safeIndex] ?? null;
  const currentSection = selectedSetting?.section ?? null;
  const handleEnterEdit = useCallback5(() => {
    if (!config || !selectedSetting) return;
    const current = getCurrentValue(config, selectedSetting);
    setEditOptionIndex(findOptionIndex(selectedSetting, current));
    setMode("edit");
    setFeedback(null);
  }, [config, selectedSetting]);
  const handleCommitEdit = useCallback5(async () => {
    if (!config || !selectedSetting) {
      setMode("browse");
      return;
    }
    const value = selectedSetting.options[editOptionIndex];
    if (typeof value !== "string") {
      setMode("browse");
      return;
    }
    const result = applySettingChange(config, selectedSetting.key, value);
    if (!result.ok) {
      setFeedback(`Invalid value: ${result.error}`);
      setMode("browse");
      return;
    }
    setState({
      kind: "working",
      message: `Saving ${selectedSetting.key} = ${value} \u2026`
    });
    try {
      await writeForgeConfig(result.config);
      setState({ kind: "ready", config: result.config });
      setFeedback(`Saved ${selectedSetting.label}: ${value}`);
    } catch (err) {
      setFeedback(
        `Save failed: ${err instanceof Error ? err.message : String(err)}`
      );
      setState({ kind: "ready", config });
    }
    setMode("browse");
  }, [config, selectedSetting, editOptionIndex]);
  const handleReset = useCallback5(async () => {
    setMode("browse");
    setState({ kind: "working", message: "Resetting config to defaults \u2026" });
    try {
      const next = getDefaultConfig();
      await writeForgeConfig(next);
      setState({ kind: "ready", config: next });
      setFeedback("Reset config to defaults.");
    } catch (err) {
      setFeedback(
        `Reset failed: ${err instanceof Error ? err.message : String(err)}`
      );
      if (config) {
        setState({ kind: "ready", config });
      }
    }
  }, [config]);
  useInput6((input, key) => {
    if (state.kind !== "ready") return;
    if (mode === "edit") {
      if (!selectedSetting) {
        setMode("browse");
        return;
      }
      if (key.escape) {
        setMode("browse");
        setFeedback(null);
        return;
      }
      if (key.return) {
        void handleCommitEdit();
        return;
      }
      if (key.downArrow || input === "j") {
        setEditOptionIndex(
          (i) => clampIndex6(i + 1, selectedSetting.options.length)
        );
        return;
      }
      if (key.upArrow || input === "k") {
        setEditOptionIndex(
          (i) => clampIndex6(i - 1, selectedSetting.options.length)
        );
        return;
      }
      return;
    }
    if (mode === "confirm-reset") {
      if (input === "y") {
        void handleReset();
      } else if (input === "n" || key.escape) {
        setMode("browse");
        setFeedback(null);
      }
      return;
    }
    if (key.escape) {
      appState.setRoute("dashboard");
      return;
    }
    if (key.downArrow || input === "j") {
      setSettingIndex((i) => clampIndex6(i + 1, SETTINGS.length));
      return;
    }
    if (key.upArrow || input === "k") {
      setSettingIndex((i) => clampIndex6(i - 1, SETTINGS.length));
      return;
    }
    if (key.return) {
      handleEnterEdit();
      return;
    }
    if (input === "r") {
      setMode("confirm-reset");
      return;
    }
    if (input === "p") {
      setFeedback(`Config path: ${getForgeConfigPath()}`);
    }
  });
  if (state.kind === "loading") {
    return /* @__PURE__ */ jsx16(Box15, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx16(Pane, { title: "Config", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs15(Box15, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx16(Text15, { color: theme.primary, children: /* @__PURE__ */ jsx16(Spinner7, { type: "dots" }) }),
      /* @__PURE__ */ jsx16(Text15, { color: theme.textSecondary, children: " reading ~/.forge/config.json \u2026" })
    ] }) }) });
  }
  if (state.kind === "working") {
    return /* @__PURE__ */ jsx16(Box15, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx16(Pane, { title: "Config", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs15(Box15, { paddingY: 1, flexDirection: "row", children: [
      /* @__PURE__ */ jsx16(Text15, { color: theme.primary, children: /* @__PURE__ */ jsx16(Spinner7, { type: "dots" }) }),
      /* @__PURE__ */ jsxs15(Text15, { color: theme.textSecondary, children: [
        " ",
        state.message
      ] })
    ] }) }) });
  }
  if (state.kind === "error" || !config) {
    return /* @__PURE__ */ jsx16(Box15, { flexGrow: 1, flexDirection: "row", paddingX: 1, children: /* @__PURE__ */ jsx16(Pane, { title: "Config", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs15(Box15, { paddingY: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsxs15(Text15, { color: theme.danger, bold: true, children: [
        glyph("warn"),
        " Could not load config"
      ] }),
      /* @__PURE__ */ jsx16(Box15, { marginTop: 1, children: /* @__PURE__ */ jsx16(Text15, { color: theme.textSecondary, children: state.kind === "error" ? state.message : "unknown error" }) })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs15(Box15, { flexDirection: "column", flexGrow: 1, paddingX: 1, children: [
    /* @__PURE__ */ jsxs15(Box15, { flexDirection: "row", gap: 1, flexGrow: 1, children: [
      /* @__PURE__ */ jsx16(SectionsPane, { currentSection }),
      /* @__PURE__ */ jsx16(
        SettingsPane,
        {
          config,
          selectedSettingIndex: safeIndex,
          mode,
          editOptionIndex
        }
      )
    ] }),
    /* @__PURE__ */ jsx16(
      ActionFooter5,
      {
        mode,
        feedback,
        selectedSetting,
        configPath: getForgeConfigPath()
      }
    )
  ] });
}
function SectionsPane({
  currentSection
}) {
  const home = getForgeHomeDir();
  const homeDisplay = home.replace(os5.homedir(), "~");
  return /* @__PURE__ */ jsx16(Pane, { title: "Sections", flexGrow: 1, children: /* @__PURE__ */ jsxs15(Box15, { flexDirection: "column", children: [
    SECTIONS.map((section) => {
      const count = SETTINGS.filter((s) => s.section === section.id).length;
      return /* @__PURE__ */ jsx16(
        ListRow,
        {
          selected: section.id === currentSection,
          prefix: /* @__PURE__ */ jsx16(Text15, { color: theme.textSecondary, children: glyph("chevron") }),
          right: count > 0 ? /* @__PURE__ */ jsx16(Text15, { color: theme.textMuted, children: count }) : /* @__PURE__ */ jsx16(Text15, { color: theme.textMuted, children: "info" }),
          children: /* @__PURE__ */ jsx16(
            Text15,
            {
              color: section.id === currentSection ? theme.text : theme.textSecondary,
              children: section.label
            }
          )
        },
        section.id
      );
    }),
    /* @__PURE__ */ jsxs15(Box15, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx16(Text15, { color: theme.textMuted, bold: true, children: "PATHS" }),
      /* @__PURE__ */ jsxs15(Text15, { color: theme.textSecondary, children: [
        glyph("folder"),
        " ",
        homeDisplay
      ] }),
      /* @__PURE__ */ jsxs15(Text15, { color: theme.textSecondary, children: [
        glyph("folder"),
        " ",
        homeDisplay,
        "/recipes"
      ] }),
      /* @__PURE__ */ jsxs15(Text15, { color: theme.textSecondary, children: [
        glyph("folder"),
        " ",
        homeDisplay,
        "/templates"
      ] }),
      /* @__PURE__ */ jsxs15(Text15, { color: theme.textSecondary, children: [
        glyph("folder"),
        " ",
        homeDisplay,
        "/prompts/history.json"
      ] })
    ] })
  ] }) });
}
function SettingsPane({
  config,
  selectedSettingIndex,
  mode,
  editOptionIndex
}) {
  return /* @__PURE__ */ jsx16(Pane, { title: "Settings", focused: true, flexGrow: 2, children: /* @__PURE__ */ jsxs15(Box15, { flexDirection: "column", children: [
    SECTIONS.filter(
      (section) => getSettingsForSection(section.id).length > 0
    ).map((section) => {
      const sectionSettings = getSettingsForSection(section.id);
      return /* @__PURE__ */ jsxs15(Box15, { flexDirection: "column", marginBottom: 1, children: [
        /* @__PURE__ */ jsx16(Text15, { color: theme.textMuted, bold: true, children: section.label.toUpperCase() }),
        sectionSettings.map((setting) => {
          const flatIdx = SETTINGS.indexOf(setting);
          const sel = flatIdx === selectedSettingIndex;
          const value = getCurrentValue(config, setting);
          return /* @__PURE__ */ jsx16(
            ListRow,
            {
              selected: sel,
              prefix: /* @__PURE__ */ jsx16(Text15, { color: theme.textSecondary, children: setting.label }),
              right: /* @__PURE__ */ jsx16(Tag, { color: theme.primary, tone: "solid", children: value }),
              children: " "
            },
            setting.key
          );
        })
      ] }, section.id);
    }),
    mode === "edit" && /* @__PURE__ */ jsx16(
      EditPicker,
      {
        setting: SETTINGS[selectedSettingIndex],
        optionIndex: editOptionIndex
      }
    ),
    mode === "browse" && SETTINGS[selectedSettingIndex] && /* @__PURE__ */ jsx16(
      SettingDetail,
      {
        setting: SETTINGS[selectedSettingIndex],
        value: getCurrentValue(config, SETTINGS[selectedSettingIndex])
      }
    )
  ] }) });
}
function SettingDetail({
  setting,
  value
}) {
  return /* @__PURE__ */ jsxs15(
    Box15,
    {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      borderStyle: "round",
      borderColor: theme.borderSoft,
      children: [
        /* @__PURE__ */ jsxs15(Box15, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx16(Text15, { color: theme.text, bold: true, children: setting.label }),
          /* @__PURE__ */ jsx16(Box15, { marginLeft: 1, children: /* @__PURE__ */ jsx16(Tag, { color: theme.secondary, children: "enum" }) })
        ] }),
        /* @__PURE__ */ jsx16(Box15, { marginTop: 1, children: /* @__PURE__ */ jsx16(Text15, { color: theme.textSecondary, children: setting.description }) }),
        /* @__PURE__ */ jsxs15(Box15, { marginTop: 1, flexDirection: "column", children: [
          /* @__PURE__ */ jsx16(KeyValue, { label: "current", value: /* @__PURE__ */ jsx16(Tag, { color: theme.primary, tone: "solid", children: value }) }),
          /* @__PURE__ */ jsx16(
            KeyValue,
            {
              label: "options",
              value: /* @__PURE__ */ jsx16(Text15, { color: theme.textSecondary, children: setting.options.join(", ") })
            }
          ),
          /* @__PURE__ */ jsx16(KeyValue, { label: "key", value: setting.key })
        ] }),
        /* @__PURE__ */ jsx16(Box15, { marginTop: 1, children: /* @__PURE__ */ jsxs15(Text15, { color: theme.textMuted, children: [
          glyph("arrow"),
          " press enter to edit"
        ] }) })
      ]
    }
  );
}
function EditPicker({
  setting,
  optionIndex
}) {
  if (!setting) {
    return /* @__PURE__ */ jsx16(Box15, {});
  }
  return /* @__PURE__ */ jsxs15(
    Box15,
    {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      borderStyle: "double",
      borderColor: theme.primary,
      children: [
        /* @__PURE__ */ jsxs15(Box15, { flexDirection: "row", marginBottom: 1, children: [
          /* @__PURE__ */ jsxs15(Text15, { color: theme.primary, bold: true, children: [
            "Edit \xB7 ",
            setting.label
          ] }),
          /* @__PURE__ */ jsx16(Box15, { flexGrow: 1 }),
          /* @__PURE__ */ jsxs15(Text15, { color: theme.textMuted, children: [
            glyph("arrow"),
            " j/k select \xB7 enter save \xB7 esc cancel"
          ] })
        ] }),
        setting.options.map((opt, i) => {
          const active = i === optionIndex;
          return /* @__PURE__ */ jsxs15(Box15, { flexDirection: "row", children: [
            /* @__PURE__ */ jsx16(Text15, { color: active ? theme.primary : theme.borderSoft, children: active ? "\u258E" : " " }),
            /* @__PURE__ */ jsx16(Box15, { marginLeft: 1, children: active ? /* @__PURE__ */ jsx16(Tag, { color: theme.primary, tone: "solid", children: opt }) : /* @__PURE__ */ jsx16(Text15, { color: theme.textSecondary, children: opt }) })
          ] }, opt);
        })
      ]
    }
  );
}
function ActionFooter5({
  mode,
  feedback,
  selectedSetting,
  configPath
}) {
  let hint;
  if (mode === "edit") {
    hint = "edit \xB7 j/k select option \xB7 enter save \xB7 esc cancel";
  } else if (mode === "confirm-reset") {
    hint = "reset all settings to defaults? press y to confirm \xB7 n to cancel";
  } else {
    hint = "j/k navigate \xB7 enter edit \xB7 r reset \xB7 p show path \xB7 esc back";
  }
  const compactPath = configPath.replace(os5.homedir(), "~");
  return /* @__PURE__ */ jsxs15(
    Box15,
    {
      flexDirection: "column",
      marginTop: 1,
      paddingX: 1,
      borderStyle: "single",
      borderColor: theme.borderSoft,
      children: [
        /* @__PURE__ */ jsxs15(Box15, { flexDirection: "row", children: [
          /* @__PURE__ */ jsx16(Text15, { color: theme.textMuted, children: hint }),
          /* @__PURE__ */ jsx16(Box15, { flexGrow: 1 }),
          /* @__PURE__ */ jsx16(Text15, { color: theme.textMuted, children: selectedSetting ? `editing ${selectedSetting.key}` : `config \xB7 ${path24.basename(configPath)}` })
        ] }),
        /* @__PURE__ */ jsx16(Box15, { marginTop: 0, children: /* @__PURE__ */ jsx16(Text15, { color: theme.textMuted, children: compactPath }) }),
        feedback && /* @__PURE__ */ jsx16(Box15, { marginTop: 0, children: /* @__PURE__ */ jsx16(Text15, { color: theme.text, children: feedback }) })
      ]
    }
  );
}

// src/tui/screens/OnboardingScreen.tsx
import { useEffect as useEffect7, useState as useState8 } from "react";
import { Box as Box16, Text as Text16 } from "ink";
import Spinner8 from "ink-spinner";

// src/tui/onboarding-helpers.ts
import path25 from "path";
function evaluateFirstRun(signals) {
  const indicators = [
    !signals.hasPackage,
    !signals.hasConfig,
    signals.recipeCount === 0,
    signals.promptCount === 0,
    signals.reportCount === 0
  ];
  const missing = indicators.filter(Boolean).length;
  return missing >= 3;
}
async function collectFirstRunSignals(cwd) {
  const [hasPackage, hasConfig, recipeCount, promptCount, reportCount] = await Promise.all([
    fileExists(path25.join(cwd, "package.json")),
    fileExists(getForgeConfigPath()),
    safeRecipeCount(),
    safePromptCount(),
    safeReportCount(cwd)
  ]);
  return { hasPackage, hasConfig, recipeCount, promptCount, reportCount };
}
async function safeRecipeCount() {
  try {
    return (await listRecipes()).length;
  } catch {
    return 0;
  }
}
async function safePromptCount() {
  try {
    return (await loadHistory()).length;
  } catch {
    return 0;
  }
}
async function safeReportCount(cwd) {
  try {
    const project = await resolveProjectName(cwd);
    return (await listReports(project)).length;
  } catch {
    return 0;
  }
}

// src/tui/screens/OnboardingScreen.tsx
import { jsx as jsx17, jsxs as jsxs16 } from "react/jsx-runtime";
function OnboardingScreen() {
  const [signals, setSignals] = useState8(null);
  useEffect7(() => {
    let cancelled = false;
    void (async () => {
      const s = await collectFirstRunSignals(process.cwd());
      if (!cancelled) setSignals(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return /* @__PURE__ */ jsx17(Box16, { flexDirection: "column", flexGrow: 1, paddingX: 1, children: /* @__PURE__ */ jsx17(Pane, { title: "Welcome to Forge", focused: true, flexGrow: 1, children: /* @__PURE__ */ jsxs16(Box16, { flexDirection: "column", paddingY: 1, children: [
    /* @__PURE__ */ jsxs16(Box16, { flexDirection: "row", children: [
      /* @__PURE__ */ jsxs16(Text16, { color: theme.primary, bold: true, children: [
        glyph("forge"),
        " forge tui"
      ] }),
      /* @__PURE__ */ jsx17(Text16, { color: theme.textMuted, children: " \xB7 local developer cockpit" })
    ] }),
    /* @__PURE__ */ jsx17(Box16, { marginTop: 1, children: /* @__PURE__ */ jsx17(Text16, { color: theme.textSecondary, children: "Project scaffolding \xB7 repo doctor \xB7 prompt generation \xB7 recipes \xB7 launch checks." }) }),
    /* @__PURE__ */ jsxs16(Box16, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx17(Text16, { color: theme.textMuted, bold: true, children: "CURRENT STATE" }),
      signals ? /* @__PURE__ */ jsx17(SignalsList, { signals }) : /* @__PURE__ */ jsxs16(Box16, { flexDirection: "row", children: [
        /* @__PURE__ */ jsx17(Text16, { color: theme.primary, children: /* @__PURE__ */ jsx17(Spinner8, { type: "dots" }) }),
        /* @__PURE__ */ jsx17(Text16, { color: theme.textSecondary, children: " detecting \u2026" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs16(Box16, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx17(Text16, { color: theme.textMuted, bold: true, children: "GET STARTED" }),
      /* @__PURE__ */ jsx17(
        StepLine,
        {
          keyHint: "1",
          label: "Open the dashboard",
          detail: "see project, doctor, and launch summary at a glance"
        }
      ),
      /* @__PURE__ */ jsx17(
        StepLine,
        {
          keyHint: "2",
          label: "Triage repo issues",
          detail: "forge doctor scans for security, deploy, and react gotchas"
        }
      ),
      /* @__PURE__ */ jsx17(
        StepLine,
        {
          keyHint: "3",
          label: "Browse recipes",
          detail: "install bundled defaults via the command palette (ctrl+k)"
        }
      ),
      /* @__PURE__ */ jsx17(
        StepLine,
        {
          keyHint: "ctrl+k",
          label: "Open the command palette",
          detail: "navigate, run actions, or init defaults from one menu"
        }
      ),
      /* @__PURE__ */ jsx17(
        StepLine,
        {
          keyHint: "?",
          label: "Show keyboard reference",
          detail: "every screen has screen-specific shortcuts"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs16(Box16, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx17(Text16, { color: theme.textMuted, bold: true, children: "ALSO ON THE CLI" }),
      /* @__PURE__ */ jsxs16(Text16, { color: theme.textSecondary, children: [
        "  ",
        "forge pack init-defaults"
      ] }),
      /* @__PURE__ */ jsx17(Text16, { color: theme.textSecondary, children: '  forge prompt feature "add Supabase auth"' }),
      /* @__PURE__ */ jsxs16(Text16, { color: theme.textSecondary, children: [
        "  ",
        "forge launch --skip-build --save"
      ] })
    ] }),
    /* @__PURE__ */ jsx17(Box16, { marginTop: 1, children: /* @__PURE__ */ jsx17(Text16, { color: theme.textMuted, children: "Press 1\u20136 to enter a screen, ctrl+k for the action palette, ? for help, q to quit." }) })
  ] }) }) });
}
function SignalsList({
  signals
}) {
  return /* @__PURE__ */ jsxs16(Box16, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx17(
      SignalRow,
      {
        ok: signals.hasPackage,
        label: "package.json",
        ok_detail: "found in current directory",
        missing_detail: "run forge tui inside a project, or use `forge new <name>`"
      }
    ),
    /* @__PURE__ */ jsx17(
      SignalRow,
      {
        ok: signals.hasConfig,
        label: "~/.forge/config.json",
        ok_detail: "forge configuration is initialized",
        missing_detail: "will be created automatically on first save"
      }
    ),
    /* @__PURE__ */ jsx17(
      SignalRow,
      {
        ok: signals.recipeCount > 0,
        label: "recipes",
        ok_detail: `${signals.recipeCount} installed`,
        missing_detail: "run `forge pack init-defaults` to install bundled recipes"
      }
    ),
    /* @__PURE__ */ jsx17(
      SignalRow,
      {
        ok: signals.promptCount > 0,
        label: "prompt history",
        ok_detail: `${signals.promptCount} saved`,
        missing_detail: 'run `forge prompt feature "\u2026"` to generate a prompt'
      }
    ),
    /* @__PURE__ */ jsx17(
      SignalRow,
      {
        ok: signals.reportCount > 0,
        label: "launch reports",
        ok_detail: `${signals.reportCount} saved`,
        missing_detail: "run `forge launch --skip-build --save` to capture one"
      }
    )
  ] });
}
function SignalRow({
  ok,
  label,
  ok_detail,
  missing_detail
}) {
  return /* @__PURE__ */ jsxs16(Box16, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx17(Box16, { width: 3, children: /* @__PURE__ */ jsx17(Text16, { color: ok ? theme.success : theme.textMuted, children: ok ? glyph("check") : glyph("cross") }) }),
    /* @__PURE__ */ jsx17(Box16, { width: 26, children: /* @__PURE__ */ jsx17(Text16, { color: ok ? theme.text : theme.textSecondary, children: label }) }),
    /* @__PURE__ */ jsx17(Text16, { color: theme.textMuted, children: ok ? ok_detail : missing_detail })
  ] });
}
function StepLine({
  keyHint,
  label,
  detail
}) {
  return /* @__PURE__ */ jsxs16(Box16, { flexDirection: "row", children: [
    /* @__PURE__ */ jsx17(Box16, { width: 10, children: /* @__PURE__ */ jsx17(Text16, { color: theme.text, backgroundColor: theme.elevated, children: ` ${keyHint} ` }) }),
    /* @__PURE__ */ jsx17(Box16, { width: 32, children: /* @__PURE__ */ jsxs16(Text16, { color: theme.text, children: [
      " ",
      label
    ] }) }),
    /* @__PURE__ */ jsx17(Text16, { color: theme.textMuted, children: detail })
  ] });
}

// src/tui/state.ts
import { useState as useState9, useCallback as useCallback6 } from "react";
function useAppState(initialRoute = "dashboard") {
  const [route, setRoute] = useState9(initialRoute);
  const [overlay, setOverlay] = useState9(null);
  const [focusIndex, setFocusIndex] = useState9(0);
  const [inputCaptured, setInputCaptured] = useState9(false);
  const toggleHelp = useCallback6(() => {
    setOverlay((current) => current === "help" ? null : "help");
  }, []);
  const togglePalette = useCallback6(() => {
    setOverlay((current) => current === "palette" ? null : "palette");
  }, []);
  const closeOverlay = useCallback6(() => {
    setOverlay(null);
  }, []);
  const cycleFocus = useCallback6(() => {
    setFocusIndex((idx) => (idx + 1) % 4);
  }, []);
  return {
    route,
    overlay,
    focusIndex,
    inputCaptured,
    setRoute,
    setOverlay,
    toggleHelp,
    togglePalette,
    closeOverlay,
    cycleFocus,
    setInputCaptured
  };
}

// src/tui/routes.ts
var routes = [
  { key: "dashboard", label: "Dashboard", numericKey: "1" },
  { key: "doctor", label: "Doctor", numericKey: "2" },
  { key: "recipes", label: "Recipes", numericKey: "3" },
  { key: "prompts", label: "Prompts", numericKey: "4" },
  { key: "launch", label: "Launch", numericKey: "5" },
  { key: "config", label: "Config", numericKey: "6" },
  { key: "onboarding", label: "Welcome", numericKey: "" }
];
function findRouteByNumericKey(key) {
  if (key.length === 0) return void 0;
  return routes.find((r) => r.numericKey === key);
}
function findRouteByKey(key) {
  const route = routes.find((r) => r.key === key);
  if (!route) {
    throw new Error(`Unknown route: ${key}`);
  }
  return route;
}

// src/tui/key-helpers.ts
function isPaletteShortcut(input, key) {
  if (!key.ctrl && !key.meta && input === ":") return true;
  if (input === "\v") return true;
  if (key.ctrl) {
    if (input === "k" || input === "K") return true;
    if (input === "") return true;
  }
  return false;
}

// src/tui/App.tsx
import { jsx as jsx18, jsxs as jsxs17 } from "react/jsx-runtime";
var globalShortcuts = [
  { key: "1-6", label: "tabs" },
  { key: "?", label: "help" },
  { key: "ctrl+k / :", label: "palette" },
  { key: "tab", label: "focus" },
  { key: "q", label: "quit" }
];
function App() {
  const { exit } = useApp();
  const state = useAppState();
  const interactedRef = useRef(false);
  const { cols, rows } = useTerminalSize();
  useEffect8(() => {
    let cancelled = false;
    void (async () => {
      try {
        const signals = await collectFirstRunSignals(process.cwd());
        if (cancelled || interactedRef.current) return;
        if (evaluateFirstRun(signals)) {
          state.setRoute("onboarding");
        }
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useInput7((input, key) => {
    interactedRef.current = true;
    if (state.overlay !== null) {
      if (key.escape) {
        state.closeOverlay();
      }
      return;
    }
    if (state.inputCaptured) {
      return;
    }
    if (isPaletteShortcut(input, key)) {
      state.togglePalette();
      return;
    }
    if (input === "?") {
      state.toggleHelp();
      return;
    }
    if (input === "q") {
      exit();
      return;
    }
    if (key.tab) {
      state.cycleFocus();
      return;
    }
    const numericRoute = findRouteByNumericKey(input);
    if (numericRoute) {
      state.setRoute(numericRoute.key);
    }
  });
  const paletteActions = useMemo7(
    () => buildPaletteActions(state, exit),
    [state, exit]
  );
  const currentRoute = findRouteByKey(state.route);
  const tooSmall = cols < 100 || rows < 30;
  return /* @__PURE__ */ jsxs17(AppFrame, { children: [
    tooSmall && /* @__PURE__ */ jsx18(SmallScreenWarning, { cols, rows }),
    /* @__PURE__ */ jsx18(
      TopBar,
      {
        crumbs: [currentRoute.label.toLowerCase()],
        right: /* @__PURE__ */ jsxs17(Text17, { color: theme.textMuted, children: [
          "focus \xB7 pane ",
          state.focusIndex + 1
        ] })
      }
    ),
    /* @__PURE__ */ jsx18(Box17, { flexGrow: 1, flexDirection: "column", children: state.overlay === "help" ? /* @__PURE__ */ jsx18(HelpOverlay, { currentRoute: state.route }) : state.overlay === "palette" ? /* @__PURE__ */ jsx18(
      CommandPalette,
      {
        actions: paletteActions,
        onClose: state.closeOverlay
      }
    ) : renderScreen(state) }),
    /* @__PURE__ */ jsx18(
      StatusBar,
      {
        mode: currentRoute.label.toUpperCase(),
        shortcuts: globalShortcuts,
        hint: state.overlay === "help" ? "help overlay \xB7 esc to close" : state.overlay === "palette" ? "palette \xB7 esc to close" : `${currentRoute.label} screen`
      }
    )
  ] });
}
function buildPaletteActions(state, exit) {
  return [
    {
      id: "go-dashboard",
      group: "Navigate",
      label: "Go to Dashboard",
      hint: "project overview",
      shortcut: "1",
      run: () => state.setRoute("dashboard")
    },
    {
      id: "go-doctor",
      group: "Navigate",
      label: "Go to Doctor",
      hint: "triage repo issues",
      shortcut: "2",
      run: () => state.setRoute("doctor")
    },
    {
      id: "go-recipes",
      group: "Navigate",
      label: "Go to Recipes",
      hint: "browse stackpack recipes",
      shortcut: "3",
      run: () => state.setRoute("recipes")
    },
    {
      id: "go-prompts",
      group: "Navigate",
      label: "Go to Prompts",
      hint: "prompt history",
      shortcut: "4",
      run: () => state.setRoute("prompts")
    },
    {
      id: "go-launch",
      group: "Navigate",
      label: "Go to Launch",
      hint: "launch reports",
      shortcut: "5",
      run: () => state.setRoute("launch")
    },
    {
      id: "go-config",
      group: "Navigate",
      label: "Go to Config",
      hint: "edit ~/.forge/config.json",
      shortcut: "6",
      run: () => state.setRoute("config")
    },
    {
      id: "run-doctor",
      group: "Doctor",
      label: "Run Doctor",
      hint: "scan rules (no fixes)",
      run: () => state.setRoute("doctor")
    },
    {
      id: "init-recipes",
      group: "Recipes",
      label: "Init Default Recipes",
      hint: "install bundled defaults",
      run: async () => {
        await installDefaultRecipes({ force: false });
        state.setRoute("recipes");
      }
    },
    {
      id: "open-config-path",
      group: "Config",
      label: "Open Config Path",
      hint: "show ~/.forge/config.json",
      run: () => state.setRoute("config")
    },
    {
      id: "show-help",
      group: "Global",
      label: "Show Help",
      hint: "keyboard reference",
      shortcut: "?",
      run: () => state.setOverlay("help")
    },
    {
      id: "quit",
      group: "Global",
      label: "Quit",
      hint: "exit forge tui",
      shortcut: "q",
      run: () => exit()
    }
  ];
}
function renderScreen(state) {
  switch (state.route) {
    case "dashboard":
      return /* @__PURE__ */ jsx18(DashboardScreen, {});
    case "doctor":
      return /* @__PURE__ */ jsx18(DoctorScreen, { appState: state });
    case "recipes":
      return /* @__PURE__ */ jsx18(RecipesScreen, { appState: state });
    case "prompts":
      return /* @__PURE__ */ jsx18(PromptsScreen, { appState: state });
    case "launch":
      return /* @__PURE__ */ jsx18(LaunchScreen, { appState: state });
    case "config":
      return /* @__PURE__ */ jsx18(ConfigScreen, { appState: state });
    case "onboarding":
      return /* @__PURE__ */ jsx18(OnboardingScreen, {});
  }
}
function useTerminalSize() {
  const { stdout } = useStdout();
  const [size, setSize] = useState10({
    cols: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24
  });
  useEffect8(() => {
    if (!stdout) return;
    const handler = () => {
      setSize({
        cols: stdout.columns ?? 80,
        rows: stdout.rows ?? 24
      });
    };
    stdout.on("resize", handler);
    return () => {
      stdout.off("resize", handler);
    };
  }, [stdout]);
  return size;
}

// src/commands/tui/index.ts
var Tui = class extends Command {
  static description = "Launch the Forge interactive terminal UI (Ink-based).";
  static examples = ["forge tui"];
  async run() {
    const instance = render(React11.createElement(App));
    await instance.waitUntilExit();
  }
};
export {
  Tui as default
};
//# sourceMappingURL=index.js.map