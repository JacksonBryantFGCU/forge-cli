/* Screens: Command Palette overlay, Onboarding, Help overlay, States (loading/empty/error). */

const Gx = window.TuiTokens.glyph;
const Dx = window.ForgeData;

// =========================================================
// Command palette — rendered as an overlay over a dimmed dashboard
// =========================================================
function ScreenPalette({ direction = 'a', iconSet, query = 'doc' }) {
  return (
    <>
      {/* Background — dashboard, dimmed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', filter: 'blur(0.5px) brightness(0.6)' }}>
        <ScreenDashboard direction={direction === 'a' ? 'a' : 'b'} iconSet={iconSet} />
      </div>
      {/* Overlay */}
      <PaletteOverlay query={query} iconSet={iconSet} variant={direction} />
    </>
  );
}

function PaletteOverlay({ query, iconSet, variant }) {
  const filtered = Dx.paletteCommands.filter(c =>
    !query ||
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.group.toLowerCase().includes(query.toLowerCase()) ||
    c.hint.toLowerCase().includes(query.toLowerCase())
  );
  const groups = [...new Set(filtered.map(c => c.group))];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: variant === 'b' ? 'center' : 'flex-start',
      justifyContent: 'center',
      paddingTop: variant === 'b' ? 0 : 96,
      pointerEvents: 'none',
      background: 'rgba(7,10,20,0.55)',
    }}>
      <div style={{
        width: 720,
        background: 'var(--tui-panel)',
        border: '1px solid var(--tui-primary)',
        borderRadius: 8,
        boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}>
        {/* Input row */}
        <div style={{
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--tui-borderSoft)',
          background: 'var(--tui-elevated)',
        }}>
          <span style={{ color: 'var(--tui-primary)', fontWeight: 600 }}>{'>'} </span>
          <span style={{ color: 'var(--tui-text)', fontSize: 16 }}>{query}</span>
          <span style={{ width: 1, height: 18, background: 'var(--tui-primary)',
                         animation: 'tui-blink 1s steps(1) infinite' }} />
          <span style={{ flex: 1 }} />
          <Dim>{filtered.length} of {Dx.paletteCommands.length}</Dim>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '6px 0' }}>
          {groups.map((g) => (
            <div key={g}>
              <div style={{
                padding: '6px 16px 2px',
                color: 'var(--tui-textMuted)',
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                fontSize: 11,
                fontWeight: 600,
              }}>{g}</div>
              {filtered.filter(c => c.group === g).map((c, i) => {
                const isSelected = i === 0 && g === groups[0];
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 16px',
                    background: isSelected ? 'var(--tui-selection)' : 'transparent',
                    position: 'relative',
                  }}>
                    {isSelected && <span style={{
                      position: 'absolute', left: 0, top: 6, bottom: 6, width: 2,
                      background: 'var(--tui-primary)',
                    }} />}
                    <span style={{ color: 'var(--tui-secondary)' }}>{Gx('terminal', iconSet)}</span>
                    <span style={{ color: isSelected ? 'var(--tui-text)' : 'var(--tui-textSec)', flex: 1 }}>
                      {c.label}
                    </span>
                    <Dim>{c.hint}</Dim>
                    {c.shortcut && <Kbd>{c.shortcut}</Kbd>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--tui-borderSoft)',
          display: 'flex', alignItems: 'center', gap: 14,
          fontSize: 12,
          color: 'var(--tui-textSec)',
        }}>
          <Row gap={6} align="center"><Kbd>↑↓</Kbd><Dim>navigate</Dim></Row>
          <Row gap={6} align="center"><Kbd>⏎</Kbd><Dim>run</Dim></Row>
          <Row gap={6} align="center"><Kbd>⇥</Kbd><Dim>autocomplete</Dim></Row>
          <Row gap={6} align="center"><Kbd>esc</Kbd><Dim>close</Dim></Row>
          <span style={{ flex: 1 }} />
          <Dim>· also: <Kbd>:</Kbd> command bar · <Kbd>/</Kbd> search</Dim>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Onboarding / first-run
// =========================================================
function ScreenOnboarding({ direction = 'a', iconSet, step = 1 }) {
  return direction === 'a'
    ? <OnboardingA iconSet={iconSet} step={step} />
    : <OnboardingB iconSet={iconSet} step={step} />;
}

const STEPS = [
  { id: 'detect',  title: 'Detect project',     glyph: 'folder',  body: 'forge sniffs package.json, lockfiles, framework hints. Nothing is written.' },
  { id: 'config',  title: 'Initialize ~/.forge', glyph: 'pkg',    body: 'Creates config.json, recipes/, templates/, history.json with safe defaults.' },
  { id: 'recipes', title: 'Install recipes',    glyph: 'wrench',  body: '14 default recipes from the Forge library. Override anything in ~/.forge/recipes/.' },
  { id: 'doctor',  title: 'First doctor run',   glyph: 'check',   body: 'Scan once, dry-run only. Auto-fixes always opt-in per rule.' },
];

function OnboardingA({ iconSet, step }) {
  return (
    <>
      <TopBar crumbs={['welcome']} right={<Dim>forge v0.4.2</Dim>} />

      <Workspace dir="column">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ width: '100%', maxWidth: 880 }}>
            {/* Wordmark */}
            <Row gap={14} align="baseline">
              <span style={{ color: 'var(--tui-primary)', fontSize: 38, fontWeight: 700, letterSpacing: -0.5 }}>
                {Gx('forge', iconSet)} forge
              </span>
              <Dim>local developer cockpit · v0.4.2</Dim>
            </Row>
            <div style={{ height: 6 }} />
            <span style={{ color: 'var(--tui-textSec)', fontSize: 16 }}>
              project scaffolding · repo doctor · prompt generation · recipes · launch checks
            </span>

            <div style={{ height: 28 }} />

            {/* Steps */}
            <div style={{
              padding: '16px 18px',
              background: 'var(--tui-panel)',
              borderRadius: 6,
              border: '1px solid var(--tui-borderSoft)',
            }}>
              <SectionTitle right={<Sec>{step} of {STEPS.length}</Sec>}>setup</SectionTitle>
              <Col gap={4}>
                {STEPS.map((s, i) => {
                  const done = i + 1 < step;
                  const cur  = i + 1 === step;
                  return (
                    <Row key={s.id} gap={12} align="baseline" style={{
                      padding: '8px 10px',
                      background: cur ? 'var(--tui-selection)' : 'transparent',
                      borderRadius: 4,
                      position: 'relative',
                    }}>
                      {cur && <span style={{
                        position: 'absolute', left: 0, top: 8, bottom: 8, width: 2,
                        background: 'var(--tui-primary)',
                      }} />}
                      <span style={{
                        color: done ? 'var(--tui-success)' : cur ? 'var(--tui-primary)' : 'var(--tui-textMuted)',
                        minWidth: 18,
                      }}>
                        {done ? Gx('check', iconSet) : cur ? Gx('arrow', iconSet) : Gx('low', iconSet)}
                      </span>
                      <Col gap={1} style={{ flex: 1 }}>
                        <span style={{ color: cur || done ? 'var(--tui-text)' : 'var(--tui-textSec)', fontWeight: 500 }}>
                          {s.title}
                        </span>
                        <Sec>{s.body}</Sec>
                      </Col>
                      {cur && <Tag color="var(--tui-primary)" tone="solid">CURRENT</Tag>}
                      {done && <Tag color="var(--tui-success)">DONE</Tag>}
                    </Row>
                  );
                })}
              </Col>
            </div>

            <div style={{ height: 16 }} />
            <Row gap={8}>
              <ActionBtn shortcut="⏎" primary>continue</ActionBtn>
              <ActionBtn shortcut="s">skip step</ActionBtn>
              <ActionBtn shortcut="q">quit</ActionBtn>
              <span style={{ flex: 1 }} />
              <Dim>configuration · ~/.forge/config.json</Dim>
            </Row>
          </div>
        </div>
      </Workspace>

      <StatusBar
        mode="WELCOME"
        shortcuts={[
          { key: '⏎', label: 'next' },
          { key: 's', label: 'skip' },
          { key: '?', label: 'help' },
          { key: 'q', label: 'quit' },
        ]}
        hint="first-run · choices are stored in ~/.forge/config.json"
      />
    </>
  );
}

function OnboardingB({ iconSet, step }) {
  // Two-pane: explanatory ascii on the left, configurable choices on the right
  return (
    <>
      <TopBar crumbs={['welcome', 'guided']} right={<Dim>forge v0.4.2</Dim>} />

      <Workspace>
        <Pane title="Forge" focused width={460}>
          <pre style={{
            margin: 0,
            color: 'var(--tui-primary)',
            fontSize: 12,
            lineHeight: 1.2,
            fontFamily: 'inherit',
          }}>
{` _____                      
|  ___|__  _ __ __ _  ___  
| |_ / _ \\| '__/ _\` |/ _ \\ 
|  _| (_) | | | (_| |  __/ 
|_|  \\___/|_|  \\__, |\\___| 
               |___/        `}
          </pre>
          <div style={{ height: 10 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tui-text)' }}>
            local developer cockpit
          </span>
          <Sec>One CLI for project scaffolding, repo health, prompt generation, recipes, and launch validation.</Sec>

          <div style={{ height: 14 }} />
          <SectionTitle>what's inside</SectionTitle>
          <Col gap={3}>
            <Row gap={8}><Sec>{Gx('check', iconSet)}</Sec><span>9 commands</span></Row>
            <Row gap={8}><Sec>{Gx('check', iconSet)}</Sec><span>14 default recipes</span></Row>
            <Row gap={8}><Sec>{Gx('check', iconSet)}</Sec><span>4 project templates</span></Row>
            <Row gap={8}><Sec>{Gx('check', iconSet)}</Sec><span>16+ doctor rules</span></Row>
            <Row gap={8}><Sec>{Gx('check', iconSet)}</Sec><span>8 prompt types</span></Row>
          </Col>

          <div style={{ flex: 1 }} />
          <Dim>everything lives in ~/.forge</Dim>
        </Pane>

        <Pane title={`Step ${step} of ${STEPS.length} · ${STEPS[step - 1].title}`}>
          <Col gap={6}>
            <span style={{ color: 'var(--tui-text)', fontSize: 15 }}>{STEPS[step - 1].body}</span>
            <div style={{ height: 4 }} />
            {step === 1 && (
              <>
                <SectionTitle>detected</SectionTitle>
                <Col gap={3}>
                  <KV k="project" v={Dx.project.name} />
                  <KV k="framework" v={Dx.project.framework} />
                  <KV k="package" v={`${Dx.project.pm} ${Dx.project.pmVersion}`} />
                  <KV k="git" v={`${Dx.project.branch} (clean)`} />
                </Col>
              </>
            )}
            {step === 2 && (
              <>
                <SectionTitle>defaults</SectionTitle>
                <Col gap={3}>
                  <KV k="package manager" v={<Tag color="var(--tui-primary)">pnpm</Tag>} />
                  <KV k="default template" v={<Tag color="var(--tui-primary)">react-vite-tailwind</Tag>} />
                  <KV k="prompts mode" v={<Tag color="var(--tui-secondary)">plan</Tag>} />
                  <KV k="doctor fail on" v={<Tag color="var(--tui-warning)">high</Tag>} />
                </Col>
              </>
            )}

            <div style={{ flex: 1 }} />

            {/* Step indicator dots */}
            <Row gap={6} style={{ marginTop: 8 }}>
              {STEPS.map((s, i) => (
                <span key={s.id} style={{
                  width: i + 1 === step ? 32 : 10,
                  height: 6,
                  borderRadius: 3,
                  background: i + 1 <= step ? 'var(--tui-primary)' : 'var(--tui-borderSoft)',
                }} />
              ))}
            </Row>

            <Row gap={8}>
              <ActionBtn shortcut="⏎" primary>continue</ActionBtn>
              <ActionBtn shortcut="b">back</ActionBtn>
              <ActionBtn shortcut="s">skip</ActionBtn>
              <span style={{ flex: 1 }} />
              <Dim>{STEPS.length - step} steps left</Dim>
            </Row>
          </Col>
        </Pane>
      </Workspace>

      <StatusBar
        mode="WELCOME"
        shortcuts={[
          { key: '⏎', label: 'continue' },
          { key: 'b', label: 'back' },
          { key: 's', label: 'skip' },
          { key: '?', label: 'help' },
        ]}
        hint="step-by-step setup · resumable"
      />
    </>
  );
}

// =========================================================
// Help overlay (keyboard reference)
// =========================================================
function ScreenHelp({ direction = 'a', iconSet }) {
  return (
    <>
      {/* dim background */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', filter: 'blur(0.5px) brightness(0.5)' }}>
        <ScreenDashboard direction={direction === 'a' ? 'a' : 'b'} iconSet={iconSet} />
      </div>
      <HelpOverlay />
    </>
  );
}

function HelpOverlay() {
  const GROUPS = [
    { title: 'Global', items: [
      ['⌘K / Ctrl-K', 'open command palette'],
      [': ',          'enter command bar'],
      ['/',           'search current view'],
      ['?',           'toggle this help'],
      ['esc',         'close overlay / back'],
      ['q',           'quit'],
    ]},
    { title: 'Navigation', items: [
      ['h j k l',     'pane / item navigation'],
      ['tab / shift-tab', 'cycle panes'],
      ['1-9',         'jump to numbered tab'],
      ['g / G',       'jump to top / bottom'],
    ]},
    { title: 'Tabs', items: [
      ['D',           'dashboard'],
      ['d',           'doctor'],
      ['R',           'recipes'],
      ['P',           'prompts'],
      ['L',           'launch'],
      ['C',           'config'],
    ]},
    { title: 'Actions', items: [
      ['⏎',           'open / apply / run'],
      ['a / A',       'apply / apply all'],
      ['s',           'skip'],
      ['y',           'copy to clipboard'],
      ['r',           'rerun / regenerate'],
      ['o',           'open file in $EDITOR'],
    ]},
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(7,10,20,0.55)',
    }}>
      <div style={{
        width: 880,
        background: 'var(--tui-panel)',
        border: '1px solid var(--tui-borderSoft)',
        borderRadius: 8,
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--tui-borderSoft)',
          display: 'flex', alignItems: 'baseline', gap: 12,
        }}>
          <span style={{ color: 'var(--tui-primary)', fontWeight: 700, fontSize: 16 }}>keyboard reference</span>
          <Dim>· press <Kbd>?</Kbd> any time to toggle</Dim>
          <span style={{ flex: 1 }} />
          <Dim>esc to close</Dim>
        </div>
        <div style={{
          padding: 18,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
        }}>
          {GROUPS.map((g) => (
            <div key={g.title}>
              <SectionTitle>{g.title}</SectionTitle>
              <Col gap={3}>
                {g.items.map(([k, label], i) => (
                  <Row key={i} gap={10} align="baseline">
                    <span style={{ minWidth: 130 }}><Kbd>{k}</Kbd></span>
                    <Sec>{label}</Sec>
                  </Row>
                ))}
              </Col>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// States: loading, empty, error
// =========================================================
function ScreenStates({ direction = 'a', iconSet, which = 'loading' }) {
  if (which === 'loading') return <StateLoading iconSet={iconSet} variant={direction} />;
  if (which === 'empty')   return <StateEmpty iconSet={iconSet} variant={direction} />;
  if (which === 'error')   return <StateError iconSet={iconSet} variant={direction} />;
  return null;
}

function StateLoading({ iconSet, variant }) {
  const tasks = [
    { label: 'pnpm install',                    state: 'done' },
    { label: 'typecheck',                       state: 'done' },
    { label: 'build (vite)',                    state: 'run',  pct: 64 },
    { label: 'bundle size budget',              state: 'pend' },
    { label: 'playwright smoke',                state: 'pend' },
    { label: 'vercel.json rewrite check',       state: 'pend' },
    { label: 'lighthouse perf / a11y',          state: 'pend' },
  ];
  return (
    <>
      <TopBar crumbs={['launch', 'running']} right={<Sec>{Gx('spin', iconSet)} 02:34 elapsed</Sec>} />
      <Workspace dir="column">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 560 }}>
            <Row gap={10} align="baseline">
              <span style={{ color: 'var(--tui-primary)', fontSize: 22, fontWeight: 600 }}>
                <span style={{ display: 'inline-block', animation: 'tui-spin 1s linear infinite' }}>{Gx('spin', iconSet)}</span> running launch
              </span>
              <Dim>· {Dx.project.name}</Dim>
            </Row>
            <div style={{ height: 14 }} />
            <ProgressBar value={3} max={tasks.length} width={56} color="var(--tui-primary)" />
            <Dim>step 3 of {tasks.length}</Dim>

            <div style={{ height: 16 }} />
            <Col gap={2}>
              {tasks.map((t, i) => (
                <Row key={i} gap={10} align="center">
                  <span style={{
                    color: t.state === 'done' ? 'var(--tui-success)'
                      : t.state === 'run'  ? 'var(--tui-primary)'
                      : 'var(--tui-textMuted)',
                    width: 16, textAlign: 'center',
                  }}>
                    {t.state === 'done' ? Gx('check', iconSet)
                      : t.state === 'run' ? <span style={{ display: 'inline-block', animation: 'tui-spin 1s linear infinite' }}>{Gx('spin', iconSet)}</span>
                      : Gx('low', iconSet)}
                  </span>
                  <span style={{
                    color: t.state === 'pend' ? 'var(--tui-textMuted)' : 'var(--tui-text)',
                    flex: 1,
                  }}>{t.label}</span>
                  {t.state === 'run' && <Sec>{t.pct}%</Sec>}
                  {t.state === 'done' && <Sec>0.4s</Sec>}
                </Row>
              ))}
            </Col>

            <div style={{ height: 18 }} />
            <Dim>press <Kbd>q</Kbd> to cancel · output streams to ~/.forge/logs/launch-r_4e2.log</Dim>
          </div>
        </div>
      </Workspace>
      <StatusBar mode="LAUNCH" shortcuts={[{ key: 'q', label: 'cancel' }]} hint="streaming · output below tail with --follow" />
    </>
  );
}

function StateEmpty({ iconSet, variant }) {
  return (
    <>
      <TopBar crumbs={['prompts', 'history']} right={<Dim>0 prompts</Dim>} />
      <Workspace dir="column">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, textAlign: 'center' }}>
            <div style={{
              fontSize: 56, color: 'var(--tui-borderSoft)', lineHeight: 1,
            }}>{Gx('terminal', iconSet)}</div>
            <div style={{ height: 12 }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--tui-text)' }}>no prompts yet</span>
            <div style={{ height: 6 }} />
            <Sec>Generate your first prompt to get a structured Claude Code task package.</Sec>

            <div style={{ height: 18 }} />
            <div style={{
              padding: '10px 14px',
              background: 'var(--tui-elevated)',
              border: '1px solid var(--tui-borderSoft)',
              borderRadius: 4,
              textAlign: 'left',
              fontFamily: 'inherit',
              color: 'var(--tui-text)',
            }}>
              <span style={{ color: 'var(--tui-textMuted)' }}>{'$ '}</span>
              forge prompt feature "add Supabase auth"
            </div>

            <div style={{ height: 14 }} />
            <Row gap={6} justify="center">
              {['feature','debug','refactor','audit','test','cleanup','deploy','review'].map(t => (
                <Tag key={t}>{t}</Tag>
              ))}
            </Row>

            <div style={{ height: 18 }} />
            <Row gap={8} justify="center">
              <ActionBtn shortcut="n" primary>new prompt</ActionBtn>
              <ActionBtn shortcut="?">help</ActionBtn>
            </Row>
          </div>
        </div>
      </Workspace>
      <StatusBar mode="PROMPTS" shortcuts={[{ key: 'n', label: 'new' }, { key: '?', label: 'help' }]} hint="empty · forge prompt --help" />
    </>
  );
}

function StateError({ iconSet, variant }) {
  return (
    <>
      <TopBar crumbs={['doctor', 'error']} right={<Tag color="var(--tui-danger)" tone="solid">FAILED</Tag>} />
      <Workspace dir="column">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 620 }}>
            <Row gap={12} align="baseline">
              <span style={{ color: 'var(--tui-danger)', fontSize: 30 }}>{Gx('warn', iconSet)}</span>
              <Col gap={2}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--tui-text)' }}>
                  Doctor rule crashed
                </span>
                <Sec>rule · <span style={{ color: 'var(--tui-text)' }}>express-cors-wildcard</span></Sec>
              </Col>
            </Row>

            <div style={{ height: 16 }} />
            <div style={{
              padding: '12px 14px',
              background: 'var(--tui-elevated)',
              border: '1px solid var(--tui-danger)' + '55',
              borderRadius: 5,
              fontFamily: 'inherit',
              fontSize: 13,
              color: 'var(--tui-text)',
            }}>
              <span style={{ color: 'var(--tui-danger)' }}>SyntaxError</span>: Unexpected token <span style={{ color: 'var(--tui-warning)' }}>'{'>'}'</span> in api/index.ts (line 14)
              <div style={{ height: 6 }} />
              <Sec>at parseExpress (modules/repo-doctor/rules/express-cors-wildcard.ts:42:7)</Sec>
              <Sec>at runRule (modules/repo-doctor/index.ts:88:12)</Sec>
              <Sec>at Doctor.run (commands/doctor/index.ts:91:18)</Sec>
            </div>

            <div style={{ height: 14 }} />
            <SectionTitle>what next</SectionTitle>
            <Col gap={3}>
              <Row gap={8}><Sec>{Gx('chevron', iconSet)}</Sec><span>skip this rule for now</span></Row>
              <Row gap={8}><Sec>{Gx('chevron', iconSet)}</Sec><span>open <Sec>api/index.ts</Sec> at line 14</span></Row>
              <Row gap={8}><Sec>{Gx('chevron', iconSet)}</Sec><span>retry with <Kbd>r</Kbd></span></Row>
              <Row gap={8}><Sec>{Gx('chevron', iconSet)}</Sec><span>file an issue with full stack trace</span></Row>
            </Col>

            <div style={{ height: 18 }} />
            <Row gap={8}>
              <ActionBtn shortcut="r" primary>retry</ActionBtn>
              <ActionBtn shortcut="s">skip rule</ActionBtn>
              <ActionBtn shortcut="o">open file</ActionBtn>
              <ActionBtn shortcut="l">show full log</ActionBtn>
              <ActionBtn shortcut="c">copy trace</ActionBtn>
            </Row>
          </div>
        </div>
      </Workspace>
      <StatusBar mode="DOCTOR" shortcuts={[
        { key: 'r', label: 'retry' }, { key: 's', label: 'skip' }, { key: 'l', label: 'log' },
      ]} hint="error · ~/.forge/logs/doctor-2026-05-21.log" />
    </>
  );
}

Object.assign(window, { ScreenPalette, ScreenOnboarding, ScreenHelp, ScreenStates });
