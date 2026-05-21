/* Screen: Dashboard (forge dash). Two directions.
   Direction A — "Cockpit": calm multi-pane key/value rails.
   Direction B — "Hero": tinted section cards, score ring, sparklines. */

const { glyph: G } = window.TuiTokens;
const D = window.ForgeData;

function ScreenDashboard({ direction = 'a', iconSet }) {
  return direction === 'a' ? <DashA iconSet={iconSet} /> : <DashB iconSet={iconSet} />;
}

// ---------- Direction A: cockpit ----------
function DashA({ iconSet }) {
  return (
    <>
      <TopBar
        crumbs={['dashboard', 'overview']}
        right={<DashContextChip />}
      />

      <Workspace dir="column">
        {/* row 1 — four equal cards */}
        <Row gap={10} style={{ flex: '0 0 auto' }}>
          <Pane title="Project" focused>
            <Col gap={4}>
              <Row gap={6}>
                <span style={{ color: 'var(--tui-text)', fontWeight: 600, fontSize: 16 }}>
                  {D.project.name}
                </span>
              </Row>
              <Dim>{D.project.path}</Dim>
              <div style={{ height: 4 }} />
              <KV k="framework" v={D.project.framework} />
              <KV k="package"   v={`${D.project.pm} ${D.project.pmVersion}`} />
              <KV k="node"      v={D.project.node} />
              <Row gap={6}>
                <span style={{ color: 'var(--tui-textMuted)' }}>git</span>
                <span>{G('branch', iconSet)} {D.project.branch}</span>
                <Sec>↑{D.project.ahead}</Sec>
                <Sec>↓{D.project.behind}</Sec>
                <Tag color="var(--tui-success)">clean</Tag>
              </Row>
            </Col>
          </Pane>

          <Pane title="Doctor" badge={<Tag color="var(--tui-warning)">{D.doctor.summary.total} open</Tag>}>
            <Col gap={4}>
              <Row gap={10} align="center">
                <span style={{ color: 'var(--tui-danger)' }}>{G('bullet', iconSet)} high</span>
                <span style={{ marginLeft: 'auto', color: 'var(--tui-text)' }}>{D.doctor.summary.high}</span>
              </Row>
              <Row gap={10} align="center">
                <span style={{ color: 'var(--tui-warning)' }}>{G('bullet', iconSet)} medium</span>
                <span style={{ marginLeft: 'auto', color: 'var(--tui-text)' }}>{D.doctor.summary.medium}</span>
              </Row>
              <Row gap={10} align="center">
                <span style={{ color: 'var(--tui-textSec)' }}>{G('low', iconSet)} low</span>
                <span style={{ marginLeft: 'auto', color: 'var(--tui-text)' }}>{D.doctor.summary.low}</span>
              </Row>
              <div style={{ height: 6 }} />
              <Row gap={6}><Sec>fixed today</Sec><span style={{ marginLeft: 'auto', color: 'var(--tui-success)' }}>+{D.doctor.summary.fixed}</span></Row>
              <Row gap={6}><Sec>{G('arrow', iconSet)} press</Sec><Kbd>D</Kbd><Dim>to triage</Dim></Row>
            </Col>
          </Pane>

          <Pane title="Launch">
            <Col gap={4}>
              <Row gap={10} align="baseline">
                <span style={{ fontSize: 26, fontWeight: 600, color: 'var(--tui-text)' }}>{D.launch.current.score}</span>
                <span style={{ color: 'var(--tui-textMuted)', fontSize: 12 }}>/ 100</span>
                <span style={{ color: 'var(--tui-success)', marginLeft: 'auto' }}>+6 prev</span>
              </Row>
              <Sparkline values={D.launch.sparkline} color="var(--tui-success)" />
              <div style={{ height: 4 }} />
              <KV k="status"  v={<Tag color="var(--tui-success)" tone="solid">READY</Tag>} />
              <KV k="last run" v={D.launch.current.when} />
              <KV k="url"     v={<Sec>{D.launch.current.url.replace('https://','')}</Sec>} />
            </Col>
          </Pane>

          <Pane title="Environment">
            <Col gap={4}>
              <Row gap={8}><Sec>{G('check', iconSet)}</Sec><span>~/.forge initialized</span></Row>
              <Row gap={8}><Sec>{G('check', iconSet)}</Sec><span>14 recipes loaded</span></Row>
              <Row gap={8}><Sec>{G('check', iconSet)}</Sec><span>3 overrides</span></Row>
              <Row gap={8}><Sec>{G('check', iconSet)}</Sec><span>history · 142 prompts</span></Row>
              <div style={{ height: 4 }} />
              <Dim>last sync · 12 min ago</Dim>
            </Col>
          </Pane>
        </Row>

        {/* row 2 — wide list + narrow side */}
        <Row gap={10} style={{ flex: 1, minHeight: 0 }}>
          <Pane title="Recent prompts" right={<Dim>{D.prompts.length} total</Dim>}>
            <Col gap={2}>
              {D.prompts.slice(0, 6).map((p, i) => (
                <ListRow
                  key={p.id}
                  selected={i === 0}
                  focused={i === 0}
                  prefix={<PromptTypeChip type={p.type} />}
                  right={<Dim>{p.when}</Dim>}
                >
                  <span style={{ color: 'var(--tui-text)' }}>{p.task}</span>
                </ListRow>
              ))}
            </Col>
          </Pane>

          <Col gap={10} style={{ flex: '0 0 38%' }}>
            <Pane title="Recipes" right={<Dim>14 installed</Dim>} flex={undefined} height={undefined}>
              <Col gap={2}>
                {D.recipes.slice(0, 5).map((r, i) => (
                  <ListRow
                    key={r.slug}
                    prefix={<Sec>{G('pkg', iconSet)}</Sec>}
                    right={<Dim>{r.op}</Dim>}
                  >
                    {r.slug}
                  </ListRow>
                ))}
              </Col>
            </Pane>
            <Pane title="Warnings" right={<Tag color="var(--tui-warning)">2</Tag>}>
              <Col gap={4}>
                <Row gap={8} align="baseline">
                  <span style={{ color: 'var(--tui-warning)' }}>{G('warn', iconSet)}</span>
                  <Col gap={0}>
                    <span>.env.example drifted from src/</span>
                    <Dim>add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY</Dim>
                  </Col>
                </Row>
                <Row gap={8} align="baseline">
                  <span style={{ color: 'var(--tui-warning)' }}>{G('warn', iconSet)}</span>
                  <Col gap={0}>
                    <span>CORS allows all origins</span>
                    <Dim>api/index.ts · cors() — restrict allowlist</Dim>
                  </Col>
                </Row>
              </Col>
            </Pane>
          </Col>
        </Row>
      </Workspace>

      <StatusBar
        mode="DASH"
        shortcuts={[
          { key: '⌘K', label: 'palette' },
          { key: 'D',  label: 'doctor' },
          { key: 'R',  label: 'recipes' },
          { key: 'P',  label: 'prompts' },
          { key: 'L',  label: 'launch' },
          { key: '?',  label: 'help' },
        ]}
        hint={`${D.project.name} · ${D.project.framework}`}
      />
    </>
  );
}

// ---------- Direction B: hero ----------
function DashB({ iconSet }) {
  const t = window._theme; // optional: read tints from theme via CSS variables instead
  return (
    <>
      <TopBar
        crumbs={['dashboard']}
        right={
          <Row gap={8} align="center">
            <Tag color="var(--tui-success)" tone="solid">READY</Tag>
            <Dim>1m ago</Dim>
          </Row>
        }
      />

      <Workspace dir="column">
        {/* Hero band */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            padding: '18px 22px',
            background: 'var(--tui-elevated)',
            borderRadius: 8,
            border: '1px solid var(--tui-borderSoft)',
            flex: '0 0 auto',
          }}
        >
          <div style={{ flex: 1 }}>
            <Row gap={10} align="baseline">
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, color: 'var(--tui-text)' }}>
                {D.project.name}
              </span>
              <Tag color="var(--tui-secondary)">{D.project.framework}</Tag>
              <Tag color="var(--tui-textSec)">{D.project.pm} {D.project.pmVersion}</Tag>
            </Row>
            <div style={{ height: 8 }} />
            <Row gap={18} align="center">
              <Row gap={6}><Dim>{G('branch', iconSet)}</Dim><span>{D.project.branch}</span><Sec>↑{D.project.ahead}</Sec><Sec>↓{D.project.behind}</Sec></Row>
              <Row gap={6}><Dim>node</Dim><span>{D.project.node}</span></Row>
              <Row gap={6}><Dim>stack</Dim><Sec>{D.project.stack.join(' · ')}</Sec></Row>
            </Row>
            <div style={{ height: 12 }} />
            <Row gap={8}>
              <PromoCmd icon={G('wrench', iconSet)} label="forge doctor"   shortcut="D" />
              <PromoCmd icon={G('pkg', iconSet)}    label="forge pack list" shortcut="R" />
              <PromoCmd icon={G('terminal', iconSet)} label="forge prompt"  shortcut="P" />
              <PromoCmd icon={G('arrow', iconSet)}  label="forge launch"   shortcut="L" />
            </Row>
          </div>
          <ScoreRing value={D.launch.current.score} size={108} stroke={9} label="launch score" />
        </div>

        {/* 3-up tinted cards */}
        <Row gap={10} style={{ flex: '0 0 auto' }}>
          <Pane title="Doctor" tint="var(--tui-panel)" right={<Sec>{D.doctor.summary.total} open</Sec>}>
            <Row gap={6}>
              <Heat count={D.doctor.summary.high}   color="var(--tui-danger)"  label="high" />
              <Heat count={D.doctor.summary.medium} color="var(--tui-warning)" label="med" />
              <Heat count={D.doctor.summary.low}    color="var(--tui-textSec)" label="low" />
            </Row>
            <div style={{ height: 8 }} />
            <Col gap={2}>
              <Row gap={6}><Sec>deployment</Sec><Sec style={{ marginLeft: 'auto' }}>{D.doctor.catCounts.deployment}</Sec></Row>
              <Row gap={6}><Sec>security</Sec><Sec style={{ marginLeft: 'auto' }}>{D.doctor.catCounts.security}</Sec></Row>
              <Row gap={6}><Sec>react</Sec><Sec style={{ marginLeft: 'auto' }}>{D.doctor.catCounts.react}</Sec></Row>
            </Col>
          </Pane>

          <Pane title="Launch trend" right={<Sec>last 10 runs</Sec>}>
            <Row gap={10} align="baseline">
              <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--tui-text)' }}>{D.launch.current.score}</span>
              <span style={{ color: 'var(--tui-textMuted)' }}>was</span>
              <Sec>{D.launch.previous.score}</Sec>
              <span style={{ color: 'var(--tui-success)' }}>+6</span>
            </Row>
            <div style={{ height: 8 }} />
            <Sparkline values={D.launch.sparkline} color="var(--tui-primary)" />
            <div style={{ height: 8 }} />
            <Row gap={6}>
              <Tag color="var(--tui-success)">3 fixed</Tag>
              <Tag color="var(--tui-danger)">2 regressed</Tag>
            </Row>
          </Pane>

          <Pane title="Recent activity">
            <Col gap={3}>
              <Row gap={8}><Sec>{G('check', iconSet)}</Sec><span>fixed</span><Sec>vercel.json rewrite</Sec><Dim style={{ marginLeft: 'auto' }}>11:32</Dim></Row>
              <Row gap={8}><Sec>{G('terminal', iconSet)}</Sec><span>prompt</span><Sec>feature · Supabase auth</Sec><Dim style={{ marginLeft: 'auto' }}>14:02</Dim></Row>
              <Row gap={8}><Sec>{G('pkg', iconSet)}</Sec><span>recipe</span><Sec>supabase-auth-react</Sec><Dim style={{ marginLeft: 'auto' }}>13:50</Dim></Row>
              <Row gap={8}><Sec>{G('arrow', iconSet)}</Sec><span>launch</span><Sec>score 84 · ready</Sec><Dim style={{ marginLeft: 'auto' }}>11:32</Dim></Row>
              <Row gap={8}><Sec>{G('wrench', iconSet)}</Sec><span>doctor</span><Sec>17 issues found</Sec><Dim style={{ marginLeft: 'auto' }}>09:14</Dim></Row>
            </Col>
          </Pane>
        </Row>

        {/* bottom — recipes + warnings */}
        <Row gap={10} style={{ flex: 1, minHeight: 0 }}>
          <Pane title="Recipes" focused right={<Dim>14 installed · {G('arrow', iconSet)} R to browse</Dim>}>
            <Col gap={2}>
              {D.recipes.slice(0, 5).map((r) => (
                <ListRow
                  key={r.slug}
                  prefix={<Sec>{G('pkg', iconSet)}</Sec>}
                  right={<Row gap={6}>{r.tags.slice(0, 2).map(tg => <Tag key={tg}>{tg}</Tag>)}<Dim>{r.op}</Dim></Row>}
                >
                  {r.slug} <Dim>· {r.desc}</Dim>
                </ListRow>
              ))}
            </Col>
          </Pane>
          <Pane title="Warnings" right={<Tag color="var(--tui-warning)">2</Tag>} flex={0.65}>
            <Col gap={6}>
              <Col gap={2}>
                <Row gap={8}><span style={{ color: 'var(--tui-warning)' }}>{G('warn', iconSet)}</span><span>.env.example drifted</span></Row>
                <Dim style={{ paddingLeft: 22 }}>add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY</Dim>
              </Col>
              <Col gap={2}>
                <Row gap={8}><span style={{ color: 'var(--tui-warning)' }}>{G('warn', iconSet)}</span><span>CORS allows all origins</span></Row>
                <Dim style={{ paddingLeft: 22 }}>api/index.ts · restrict cors() allowlist</Dim>
              </Col>
            </Col>
          </Pane>
        </Row>
      </Workspace>

      <StatusBar
        mode="DASH"
        shortcuts={[
          { key: '⌘K', label: 'palette' },
          { key: 'D',  label: 'doctor' },
          { key: 'R',  label: 'recipes' },
          { key: 'P',  label: 'prompts' },
          { key: 'L',  label: 'launch' },
          { key: '?',  label: 'help' },
        ]}
        hint={`${D.project.name} · ${D.project.framework}`}
      />
    </>
  );
}

// helpers used by both directions
function PromptTypeChip({ type }) {
  const colors = {
    feature:  'var(--tui-primary)',
    debug:    'var(--tui-warning)',
    refactor: 'var(--tui-secondary)',
    audit:    'var(--tui-danger)',
    test:     'var(--tui-success)',
    cleanup:  'var(--tui-textSec)',
    deploy:   'var(--tui-primary)',
    review:   'var(--tui-secondary)',
  };
  return <Tag color={colors[type] || 'var(--tui-textSec)'}>{type}</Tag>;
}

function PromoCmd({ icon, label, shortcut }) {
  return (
    <Row gap={6} align="center" style={{
      padding: '4px 10px',
      borderRadius: 4,
      background: 'var(--tui-panel)',
      border: '1px solid var(--tui-borderSoft)',
    }}>
      <Sec>{icon}</Sec>
      <span>{label}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Row>
  );
}

function DashContextChip() {
  return (
    <Row gap={8} align="center">
      <Dim>{D.project.framework}</Dim>
      <span style={{ color: 'var(--tui-textMuted)' }}>·</span>
      <span>{G('branch', 'unicode')} {D.project.branch}</span>
      <Sec>↑{D.project.ahead} ↓{D.project.behind}</Sec>
    </Row>
  );
}

window.ScreenDashboard = ScreenDashboard;
window.PromptTypeChip = PromptTypeChip;
