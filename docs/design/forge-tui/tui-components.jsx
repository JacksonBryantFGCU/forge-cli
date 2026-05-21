/* TUI primitives — Frame, Pane, Row, Col, content atoms.
   Depends on window.TuiTokens.

   Frame size model: char-grid sizing computed from font metrics.
   At fontPx=14, JetBrains Mono, lineHeight=1.4:
     cellW ≈ fontPx * 0.6  ≈ 8.4px
     cellH ≈ fontPx * 1.4  ≈ 19.6px
   We expose ch units inside the frame so child widths can be expressed in cols.
*/

const { glyph, themeWithAccent, density: DENSITIES } = window.TuiTokens;

// ===== Frame =====
// width/height expressed in cols/rows.
function TuiFrame({
  title = 'forge — ~/projects',
  theme = 'midnight',
  accent = 'blue',
  density = 'comfortable',
  borderStyle = 'minimal',
  iconSet = 'unicode',
  cols = 140,
  rows = 40,
  chrome = true,
  glow = true,
  className = '',
  style = {},
  children,
}) {
  const t = themeWithAccent(theme, accent);
  const d = DENSITIES[density] || DENSITIES.comfortable;
  // Char metrics — keep these consistent across all frames.
  const cellW = d.fontPx * 0.6;
  const cellH = d.fontPx * 1.45;
  const contentW = Math.round(cellW * cols);
  const contentH = Math.round(cellH * rows);

  const ctx = { t, d, cols, rows, cellW, cellH, iconSet, borderStyle };

  // Expose theme as CSS variables so deep children can use var(--tui-text) etc.
  const cssVars = {};
  Object.entries(t).forEach(([k, v]) => { if (typeof v === 'string') cssVars[`--tui-${k}`] = v; });

  return (
    <TuiCtx.Provider value={ctx}>
      <div
        className={`tui-frame ${className}`}
        style={{
          ...cssVars,
          width: contentW,
          minHeight: contentH + (chrome ? 30 : 0),
          background: t.bg,
          color: t.text,
          fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
          fontSize: d.fontPx,
          lineHeight: d.lineHeight,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: glow
            ? `${t.shadow}, 0 0 0 1px ${t.borderSoft}`
            : `0 0 0 1px ${t.borderSoft}`,
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        {chrome && <WindowChrome title={title} />}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: contentH,
            position: 'relative',
          }}
        >
          {children}
        </div>
      </div>
    </TuiCtx.Provider>
  );
}

const TuiCtx = React.createContext(null);
const useTui = () => React.useContext(TuiCtx);

// ===== Window chrome (mac-style traffic lights, kept subtle) =====
function WindowChrome({ title }) {
  const { t } = useTui();
  return (
    <div
      style={{
        height: 30,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        background: t.panel,
        borderBottom: `1px solid ${t.borderSoft}`,
        gap: 8,
        flex: '0 0 auto',
      }}
    >
      <div style={{ display: 'flex', gap: 6 }}>
        <Dot color="#FF5F57" /><Dot color="#FEBC2E" /><Dot color="#28C840" />
      </div>
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          color: t.textMuted,
          fontSize: 11.5,
          letterSpacing: 0.2,
        }}
      >
        {title}
      </div>
      <div style={{ width: 48 }} />
    </div>
  );
}
function Dot({ color, size = 11 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        background: color,
        borderRadius: '50%',
        display: 'inline-block',
      }}
    />
  );
}

// ===== TopBar — forge branding + breadcrumb + context =====
function TopBar({ crumbs = [], right = null }) {
  const { t, iconSet, d } = useTui();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: `${d.padY * 0.6}px ${d.padX}px`,
        gap: 10,
        flex: '0 0 auto',
        background: t.bg,
      }}
    >
      <span style={{ color: t.primary, fontWeight: 600, letterSpacing: 0.4 }}>
        {glyph('forge', iconSet)} forge
      </span>
      <span style={{ color: t.textMuted }}>·</span>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span style={{ color: i === crumbs.length - 1 ? t.text : t.textSec }}>{c}</span>
          {i < crumbs.length - 1 && (
            <span style={{ color: t.textMuted }}>{glyph('chevron', iconSet)}</span>
          )}
        </React.Fragment>
      ))}
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

// ===== StatusBar — bottom hint strip =====
function StatusBar({ shortcuts = [], hint = null, mode = 'NORMAL' }) {
  const { t, d } = useTui();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: `${d.padY * 0.5}px ${d.padX}px`,
        gap: 14,
        flex: '0 0 auto',
        borderTop: `1px solid ${t.borderSoft}`,
        background: t.panel,
        fontSize: d.fontPx - 1,
      }}
    >
      <span
        style={{
          color: t.bg,
          background: t.primary,
          padding: '1px 8px',
          borderRadius: 3,
          fontWeight: 600,
          letterSpacing: 0.6,
        }}
      >
        {mode}
      </span>
      {shortcuts.map((s, i) => (
        <span key={i} style={{ color: t.textSec, display: 'flex', gap: 6 }}>
          <Kbd>{s.key}</Kbd>
          <span style={{ color: t.textMuted }}>{s.label}</span>
        </span>
      ))}
      <div style={{ flex: 1 }} />
      {hint && <span style={{ color: t.textMuted }}>{hint}</span>}
    </div>
  );
}

function Kbd({ children }) {
  const { t } = useTui();
  return (
    <span
      style={{
        color: t.text,
        background: t.elevated,
        padding: '0 6px',
        borderRadius: 3,
        border: `1px solid ${t.borderSoft}`,
        fontSize: 'inherit',
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

// ===== Workspace — main content area between TopBar and StatusBar =====
function Workspace({ children, dir = 'row', gap }) {
  const { d } = useTui();
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: dir,
        gap: gap ?? d.gap,
        padding: `0 ${d.padX}px ${d.padY * 0.4}px`,
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}

// ===== Pane — content panel with title and optional focus border =====
function Pane({
  title,
  badge,
  focused = false,
  flex = 1,
  width,
  height,
  pad = true,
  children,
  right,
  tint,
  noTitleBorder,
}) {
  const { t, d, borderStyle } = useTui();
  const showBorder = borderStyle === 'single' || borderStyle === 'double' || focused || borderStyle === 'minimal';
  const borderColor = focused ? t.focusBorder : t.borderSoft;
  const borderWidth = focused && borderStyle === 'double' ? 2 : 1;
  // Minimal: no border on unfocused panes. Just rely on tint.
  const useBorder = borderStyle === 'minimal' ? focused : showBorder;
  return (
    <div
      style={{
        flex: width ? `0 0 ${width}px` : flex,
        height,
        background: tint || t.panel,
        borderRadius: 6,
        border: useBorder ? `${borderWidth}px solid ${borderColor}` : `1px solid transparent`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        transition: 'border-color 120ms ease',
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: `${d.rowGap + 6}px ${d.padX * 0.7}px`,
            gap: 8,
            borderBottom: noTitleBorder ? 'none' : `1px solid ${t.borderSoft}`,
            flex: '0 0 auto',
          }}
        >
          {title && (
            <span
              style={{
                color: focused ? t.text : t.textSec,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: d.fontPx - 2.5,
                fontWeight: 600,
              }}
            >
              {title}
            </span>
          )}
          {badge}
          <div style={{ flex: 1 }} />
          {right}
        </div>
      )}
      <div
        style={{
          flex: 1,
          padding: pad ? `${d.padY * 0.55}px ${d.padX * 0.7}px` : 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ===== Row / Col =====
function Row({ children, gap, align = 'baseline', justify = 'flex-start', wrap = 'nowrap', style = {} }) {
  const { d } = useTui();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: gap ?? d.gap,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function Col({ children, gap, style = {} }) {
  const { d } = useTui();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gap ?? d.rowGap,
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ===== Content atoms =====

// Key/value rail — common in dashboards
function KV({ k, v, vColor, mono = true, accent }) {
  const { t } = useTui();
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
      <span style={{ color: t.textMuted, minWidth: 76, fontSize: 'inherit' }}>{k}</span>
      <span style={{ color: vColor || t.text, fontFamily: mono ? 'inherit' : undefined }}>{v}</span>
      {accent && <span style={{ color: t.textMuted, fontSize: 12 }}>{accent}</span>}
    </div>
  );
}

// Severity dot
function SevDot({ level }) {
  const { t, iconSet } = useTui();
  const map = { high: t.danger, medium: t.warning, low: t.textSec, ok: t.success };
  return <span style={{ color: map[level] || t.textSec }}>{glyph(level === 'low' ? 'low' : 'bullet', iconSet)}</span>;
}

// Tag chip
function Tag({ children, color, tone = 'subtle' }) {
  const { t } = useTui();
  const c = color || t.textSec;
  if (tone === 'solid') {
    return (
      <span style={{
        color: t.bg,
        background: c,
        padding: '0 6px',
        borderRadius: 3,
        fontSize: '0.85em',
        letterSpacing: 0.3,
        fontWeight: 600,
      }}>{children}</span>
    );
  }
  return (
    <span
      style={{
        color: c,
        border: `1px solid ${c}55`,
        background: `${c}14`,
        padding: '0 6px',
        borderRadius: 3,
        fontSize: '0.85em',
        letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

// Selectable list item (single row)
function ListRow({ selected, focused, children, onClick, prefix, right, dim, style = {} }) {
  const { t, d } = useTui();
  const bg = selected ? (focused ? t.selectionStrong : t.selection) : 'transparent';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: `${Math.max(2, d.rowGap)}px ${d.padX * 0.45}px`,
        background: bg,
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        color: dim ? t.textMuted : t.text,
        position: 'relative',
        ...style,
      }}
    >
      {selected && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            bottom: 4,
            width: 2,
            background: t.primary,
            borderRadius: 1,
          }}
        />
      )}
      {prefix !== undefined && <span style={{ flex: '0 0 auto' }}>{prefix}</span>}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      {right !== undefined && <span style={{ flex: '0 0 auto', color: t.textMuted }}>{right}</span>}
    </div>
  );
}

// Horizontal progress bar (renders as block chars)
function ProgressBar({ value = 0, max = 100, width = 28, color, label }) {
  const { t } = useTui();
  const c = color || t.primary;
  const fill = Math.max(0, Math.min(1, value / max));
  const blocks = Math.round(fill * width);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ letterSpacing: -0.5 }}>
        <span style={{ color: c }}>{'█'.repeat(blocks)}</span>
        <span style={{ color: t.borderSoft }}>{'░'.repeat(Math.max(0, width - blocks))}</span>
      </span>
      {label && <span style={{ color: t.textMuted }}>{label}</span>}
    </span>
  );
}

// Sparkline using block chars
function Sparkline({ values = [], color, width }) {
  const { t } = useTui();
  const c = color || t.primary;
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  let arr = values;
  if (width && width !== values.length) {
    arr = Array.from({ length: width }, (_, i) =>
      values[Math.floor((i / width) * values.length)] ?? 0
    );
  }
  return (
    <span style={{ color: c, letterSpacing: -0.5, fontSize: 'inherit' }}>
      {arr.map((v, i) => chars[Math.round(((v - min) / range) * (chars.length - 1))]).join('')}
    </span>
  );
}

// Diff block — renders unified diff lines
function DiffBlock({ lines = [], filename, hunkHeader }) {
  const { t, d } = useTui();
  return (
    <div style={{ fontSize: d.fontPx - 0.5 }}>
      {filename && (
        <div style={{ color: t.textMuted, marginBottom: 4 }}>
          <span style={{ color: t.textSec }}>{filename}</span>
        </div>
      )}
      {hunkHeader && (
        <div style={{ color: t.secondary, marginBottom: 2 }}>{hunkHeader}</div>
      )}
      <pre style={{ margin: 0, fontFamily: 'inherit', lineHeight: 'inherit', whiteSpace: 'pre' }}>
        {lines.map((ln, i) => {
          let color = t.text;
          let bg = 'transparent';
          let prefix = '  ';
          if (ln.startsWith('+')) { color = t.success; bg = `${t.success}12`; prefix = ''; }
          else if (ln.startsWith('-')) { color = t.danger; bg = `${t.danger}12`; prefix = ''; }
          else if (ln.startsWith('@')) { color = t.secondary; prefix = ''; }
          return (
            <span key={i} style={{ display: 'block', background: bg, color, padding: '0 4px' }}>
              {prefix}{ln}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

// Section heading inside a pane
function SectionTitle({ children, right }) {
  const { t, d } = useTui();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        marginTop: d.rowGap + 2,
        marginBottom: d.rowGap,
      }}
    >
      <span
        style={{
          color: t.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontSize: d.fontPx - 2.5,
          fontWeight: 600,
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: t.borderSoft }} />
      {right && (
        <span style={{ color: t.textMuted, fontSize: d.fontPx - 2 }}>{right}</span>
      )}
    </div>
  );
}

// Generic muted text
function Dim({ children }) {
  const { t } = useTui();
  return <span style={{ color: t.textMuted }}>{children}</span>;
}
function Sec({ children }) {
  const { t } = useTui();
  return <span style={{ color: t.textSec }}>{children}</span>;
}

// Score ring (used in launch/opinionated dashboard)
function ScoreRing({ value = 0, size = 96, stroke = 8, color, label }) {
  const { t, d } = useTui();
  const c = color || t.success;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={t.borderSoft} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={c} strokeWidth={stroke} fill="none"
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ fontSize: d.fontPx + 10, fontWeight: 600, color: t.text, lineHeight: 1 }}>{value}</div>
        {label && <div style={{ color: t.textMuted, fontSize: d.fontPx - 3, marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

// Severity heatmap cell
function Heat({ count, color, label }) {
  const { t, d } = useTui();
  const c = color || t.primary;
  const intensity = Math.min(1, count / 12);
  return (
    <div style={{
      flex: 1,
      padding: '8px 10px',
      borderRadius: 4,
      background: `${c}${Math.round(intensity * 0.3 * 255).toString(16).padStart(2, '0')}`,
      border: `1px solid ${c}33`,
    }}>
      <div style={{ color: c, fontSize: d.fontPx + 6, fontWeight: 600, lineHeight: 1 }}>{count}</div>
      <div style={{ color: t.textSec, fontSize: d.fontPx - 2, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

// Export to window
Object.assign(window, {
  TuiFrame, TopBar, StatusBar, Workspace, Pane, Row, Col, KV, SevDot, Tag,
  ListRow, ProgressBar, Sparkline, DiffBlock, SectionTitle, Dim, Sec, Kbd,
  ScoreRing, Heat, useTui,
});
