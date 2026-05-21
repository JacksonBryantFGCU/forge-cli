/* Design system showcase — color palette, typography, spacing, components.
   Renders inside an artboard. */

const SYS = window.TuiTokens.themes.slate;

function SystemFoundation() {
  const w = 1180, h = 840;
  return (
    <div style={{
      width: w, height: h,
      background: SYS.bg,
      color: SYS.text,
      fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
      fontSize: 14,
      lineHeight: 1.45,
      padding: 40,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ color: SYS.primary, fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>◆ forge</span>
        <span style={{ color: SYS.textSec, fontSize: 16 }}>terminal UI · design system v0.1</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: SYS.textMuted, fontSize: 12 }}>JetBrains Mono · 14/19.6 · 140×40 baseline</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Palette */}
          <SectionBlock title="palette" subtitle="restrained · IDE-grade dark">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <SwatchBig name="bg" value={SYS.bg} />
              <SwatchBig name="panel" value={SYS.panel} />
              <SwatchBig name="elevated" value={SYS.elevated} />
              <SwatchBig name="border" value={SYS.border} />
            </div>
            <div style={{ height: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              <SwatchSmall name="primary" value={SYS.primary} />
              <SwatchSmall name="secondary" value={SYS.secondary} />
              <SwatchSmall name="success" value={SYS.success} />
              <SwatchSmall name="warning" value={SYS.warning} />
              <SwatchSmall name="danger" value={SYS.danger} />
              <SwatchSmall name="selection" value={SYS.selection} dark />
            </div>
            <div style={{ height: 8 }} />
            <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
              <ColLine label="text" color={SYS.text} val="#E6EDF3" />
              <ColLine label="text · sec" color={SYS.textSec} val="#9FB0C0" />
              <ColLine label="text · muted" color={SYS.textMuted} val="#6B7A90" />
            </div>
          </SectionBlock>

          {/* Severity scale */}
          <SectionBlock title="severity" subtitle="doctor + launch · semantic only">
            <div style={{ display: 'flex', gap: 14 }}>
              <SevDemo color={SYS.danger}  label="HIGH"   subtitle="blocks ship" example="vercel rewrite missing · CORS allow-all" />
              <SevDemo color={SYS.warning} label="MEDIUM" subtitle="should fix"  example="missing .env.example · helmet absent" />
              <SevDemo color={SYS.textSec} label="LOW"    subtitle="nice to fix" example="meta description · lint script" />
              <SevDemo color={SYS.success} label="FIXED"  subtitle="cleared"     example="auto-applied · diff committed" />
            </div>
          </SectionBlock>

          {/* Spacing + density */}
          <SectionBlock title="density" subtitle="compact · comfortable · roomy">
            <div style={{ display: 'flex', gap: 14 }}>
              {['compact','comfortable','roomy'].map(d => (
                <div key={d} style={{
                  flex: 1,
                  padding: 12,
                  background: SYS.panel,
                  border: `1px solid ${SYS.borderSoft}`,
                  borderRadius: 6,
                }}>
                  <div style={{ color: SYS.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{d}</div>
                  <div style={{ height: 6 }} />
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      height: d === 'compact' ? 16 : d === 'comfortable' ? 20 : 26,
                      lineHeight: d === 'compact' ? '16px' : d === 'comfortable' ? '20px' : '26px',
                      color: i === 1 ? SYS.text : SYS.textSec,
                      borderRadius: 3,
                      background: i === 1 ? SYS.selection : 'transparent',
                      padding: '0 8px',
                      fontSize: d === 'compact' ? 13 : 14,
                    }}>● item {i}</div>
                  ))}
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Type */}
          <SectionBlock title="type" subtitle="JetBrains Mono · 1 family · sized for terminal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TypeRow label="h1"   size={26} weight={700} color={SYS.text}>sunstone-pickleball</TypeRow>
              <TypeRow label="h2"   size={18} weight={600} color={SYS.text}>Doctor · 17 open</TypeRow>
              <TypeRow label="body" size={14} weight={400} color={SYS.text}>express CORS may allow all origins</TypeRow>
              <TypeRow label="sec"  size={14} weight={400} color={SYS.textSec}>api/index.ts · cors() — restrict allowlist</TypeRow>
              <TypeRow label="muted"size={13} weight={400} color={SYS.textMuted}>rule · express-cors-wildcard</TypeRow>
              <TypeRow label="cap"  size={11.5} weight={600} color={SYS.textMuted} caps>SECTION HEADER</TypeRow>
            </div>
          </SectionBlock>

          {/* Components */}
          <SectionBlock title="atoms">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Spec>tags</Spec>
                <Chip color={SYS.primary}>feature</Chip>
                <Chip color={SYS.warning}>debug</Chip>
                <Chip color={SYS.success} solid>READY</Chip>
                <Chip color={SYS.danger}  solid>REGRESS</Chip>
                <Chip color={SYS.textSec}>cleanup</Chip>
              </div>
              {/* Keys */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Spec>keys</Spec>
                <Kb>⌘K</Kb><Kb>D</Kb><Kb>↵</Kb><Kb>esc</Kb><Kb>j/k</Kb>
              </div>
              {/* Progress */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Spec>bar</Spec>
                <span style={{ color: SYS.primary, letterSpacing: -0.5 }}>{'█'.repeat(16)}<span style={{ color: SYS.borderSoft }}>{'░'.repeat(10)}</span></span>
                <span style={{ color: SYS.textMuted }}>62%</span>
              </div>
              {/* Spark */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Spec>spark</Spec>
                <span style={{ color: SYS.success, letterSpacing: -0.5 }}>▁▂▃▂▄▅▄▆▆▇█</span>
                <span style={{ color: SYS.textMuted }}>last 10 launch runs</span>
              </div>
              {/* Selection */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                <Spec>list</Spec>
                <div style={{ flex: 1, background: SYS.panel, borderRadius: 4, padding: 4 }}>
                  <Row sel>● feature   add Supabase auth</Row>
                  <Row>● debug     Vercel refresh returns 404</Row>
                  <Row>● refactor  split Hero into HeroLayout</Row>
                </div>
              </div>
            </div>
          </SectionBlock>

          {/* Layout */}
          <SectionBlock title="layout" subtitle="multi-pane on dashboard · two-pane on sub-tools">
            <pre style={{ margin: 0, color: SYS.textSec, fontSize: 12, lineHeight: 1.35 }}>
{`┌─top bar─────────────────────────────────────────┐
│ ◆ forge · dashboard › overview   react · ⎇ main │
├─────────────────────────────────────────────────┤
│ project │ doctor │ launch │ environment         │   ← row 1
├─────────┴────────┴────────┴────────────┬────────┤
│   recent prompts (focused)             │ recipes│   ← row 2
│                                        │ warns  │
├────────────────────────────────────────┴────────┤
│ ⌘K palette · D doctor · R recipes · P prompts   │
└─────────────────────────────────────────────────┘`}
            </pre>
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}

// ===== helpers =====
function SectionBlock({ title, subtitle, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ color: SYS.textMuted, textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 11, fontWeight: 600 }}>
          {title}
        </span>
        {subtitle && <span style={{ color: SYS.textMuted, fontSize: 12 }}>· {subtitle}</span>}
        <span style={{ flex: 1, height: 1, background: SYS.borderSoft }} />
      </div>
      {children}
    </div>
  );
}

function SwatchBig({ name, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        height: 56, background: value, borderRadius: 5,
        border: `1px solid ${SYS.borderSoft}`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ color: SYS.text }}>{name}</span>
        <span style={{ color: SYS.textMuted, fontSize: 12 }}>{value}</span>
      </div>
    </div>
  );
}
function SwatchSmall({ name, value, dark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{
        height: 32, background: value, borderRadius: 4,
        border: `1px solid ${SYS.borderSoft}`,
      }} />
      <span style={{ color: SYS.textSec, fontSize: 11 }}>{name}</span>
      <span style={{ color: SYS.textMuted, fontSize: 10.5 }}>{value}</span>
    </div>
  );
}
function ColLine({ label, color, val }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ color, fontWeight: 600 }}>Aa</span>
      <span style={{ color: SYS.textSec }}>{label}</span>
      <span style={{ color: SYS.textMuted, fontSize: 11 }}>{val}</span>
    </div>
  );
}
function SevDemo({ color, label, subtitle, example }) {
  return (
    <div style={{
      flex: 1, padding: '10px 12px',
      background: SYS.panel,
      border: `1px solid ${SYS.borderSoft}`,
      borderRadius: 5,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ color, fontWeight: 700 }}>●</span>
        <span style={{ color, fontWeight: 700, letterSpacing: 0.4 }}>{label}</span>
      </div>
      <span style={{ color: SYS.textSec, fontSize: 12 }}>{subtitle}</span>
      <span style={{ color: SYS.textMuted, fontSize: 12, lineHeight: 1.4 }}>{example}</span>
    </div>
  );
}
function TypeRow({ label, size, weight, color, caps, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
      <span style={{ color: SYS.textMuted, fontSize: 11, width: 50, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{
        color, fontSize: size, fontWeight: weight,
        textTransform: caps ? 'uppercase' : 'none',
        letterSpacing: caps ? 1.4 : -0.1,
        lineHeight: 1.25,
      }}>{children}</span>
      <span style={{ flex: 1 }} />
      <span style={{ color: SYS.textMuted, fontSize: 11 }}>{size}/{Math.round(size * 1.45)} · {weight}</span>
    </div>
  );
}
function Chip({ children, color, solid }) {
  return (
    <span style={{
      color: solid ? SYS.bg : color,
      background: solid ? color : `${color}14`,
      border: `1px solid ${solid ? color : color + '55'}`,
      padding: '0 7px', borderRadius: 3,
      fontSize: 12, fontWeight: solid ? 600 : 400, letterSpacing: 0.3,
    }}>{children}</span>
  );
}
function Kb({ children }) {
  return (
    <span style={{
      color: SYS.text, background: SYS.elevated,
      padding: '0 6px', borderRadius: 3,
      border: `1px solid ${SYS.borderSoft}`,
      fontSize: 12,
    }}>{children}</span>
  );
}
function Spec({ children }) {
  return <span style={{ color: SYS.textMuted, fontSize: 11, width: 48, textTransform: 'uppercase', letterSpacing: 1 }}>{children}</span>;
}
function Row({ children, sel }) {
  return (
    <div style={{
      padding: '2px 8px', borderRadius: 3,
      background: sel ? SYS.selectionStrong : 'transparent',
      color: sel ? SYS.text : SYS.textSec,
      position: 'relative',
    }}>
      {sel && <span style={{
        position: 'absolute', left: 0, top: 3, bottom: 3, width: 2,
        background: SYS.primary,
      }} />}
      {children}
    </div>
  );
}

window.SystemFoundation = SystemFoundation;
