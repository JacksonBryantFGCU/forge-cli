/* Screen: Launch report diff. */

const Gl = window.TuiTokens.glyph;
const Dl = window.ForgeData;

function ScreenLaunch({ direction = 'a', iconSet, runIdx = 0 }) {
  return direction === 'a'
    ? <LaunchA iconSet={iconSet} runIdx={runIdx} />
    : <LaunchB iconSet={iconSet} runIdx={runIdx} />;
}

const statusColor = (s) => ({
  pass: 'var(--tui-success)', warn: 'var(--tui-warning)', fail: 'var(--tui-danger)',
}[s] || 'var(--tui-textSec)');
const statusGlyph = (s, iconSet) =>
  s === 'pass' ? Gl('check', iconSet)
  : s === 'warn' ? Gl('warn', iconSet)
  : s === 'fail' ? Gl('cross', iconSet)
  : Gl('dot', iconSet);

function changeBadge(change) {
  if (change === 'fixed')    return <Tag color="var(--tui-success)" tone="solid">FIXED</Tag>;
  if (change === 'regressed')return <Tag color="var(--tui-danger)"  tone="solid">REGRESS</Tag>;
  if (change === 'new')      return <Tag color="var(--tui-primary)" tone="solid">NEW</Tag>;
  return null;
}

function LaunchA({ iconSet, runIdx }) {
  const cur = Dl.launch.current;
  const prev = Dl.launch.previous;
  const checks = Dl.launch.checks;
  const groups = [...new Set(checks.map(c => c.group))];

  const fixed = checks.filter(c => c.change === 'fixed').length;
  const regressed = checks.filter(c => c.change === 'regressed').length;

  return (
    <>
      <TopBar
        crumbs={['launch', 'compare']}
        right={
          <Row gap={10}>
            <Dim>prev</Dim><Sec>{prev.when}</Sec>
            <Dim>{Gl('chevron', iconSet)}</Dim>
            <Dim>current</Dim><span>{cur.when}</span>
          </Row>
        }
      />

      <Workspace dir="column">
        {/* Header strip */}
        <Row gap={10} style={{ flex: '0 0 auto' }}>
          <Pane focused>
            <Row gap={20} align="center">
              <Col gap={2} style={{ flex: '0 0 auto' }}>
                <Dim>previous</Dim>
                <span style={{ fontSize: 36, fontWeight: 600, color: 'var(--tui-textSec)', lineHeight: 1 }}>{prev.score}</span>
                <Dim>{prev.when}</Dim>
              </Col>
              <span style={{ color: 'var(--tui-success)', fontSize: 22 }}>→ +6</span>
              <Col gap={2} style={{ flex: '0 0 auto' }}>
                <Dim>current</Dim>
                <Row gap={6} align="baseline">
                  <span style={{ fontSize: 44, fontWeight: 700, color: 'var(--tui-text)', lineHeight: 1 }}>{cur.score}</span>
                  <Dim>/ 100</Dim>
                </Row>
                <Row gap={6}><Tag color="var(--tui-success)" tone="solid">READY</Tag><Dim>{cur.when}</Dim></Row>
              </Col>
              <div style={{ width: 1, height: 60, background: 'var(--tui-borderSoft)' }} />
              <Col gap={2} style={{ flex: 1 }}>
                <Sec>score · last 10 runs</Sec>
                <Sparkline values={Dl.launch.sparkline} color="var(--tui-success)" />
                <Row gap={8}>
                  <Tag color="var(--tui-success)">{fixed} fixed</Tag>
                  <Tag color="var(--tui-danger)">{regressed} regressed</Tag>
                  <Tag color="var(--tui-textSec)">{checks.length - fixed - regressed} unchanged</Tag>
                </Row>
              </Col>
              <Col gap={4} style={{ flex: '0 0 auto', alignItems: 'flex-end' }}>
                <KV k="url" v={<Sec>{cur.url.replace('https://', '')}</Sec>} />
                <KV k="id"  v={<Sec>{Dl.launch.runs[0].id}</Sec>} />
              </Col>
            </Row>
          </Pane>
        </Row>

        {/* Side-by-side check columns */}
        <Row gap={10} style={{ flex: 1, minHeight: 0 }}>
          <Pane title={`Previous · ${prev.when}`} width={420}>
            <CheckList checks={checks} side="prev" iconSet={iconSet} />
          </Pane>

          <Pane title="Δ" width={56}>
            <Col gap={1}>
              {checks.map((c, i) => (
                <div key={i} style={{
                  height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.change === 'fixed' ? 'var(--tui-success)'
                    : c.change === 'regressed' ? 'var(--tui-danger)'
                    : 'var(--tui-textMuted)',
                }}>
                  {c.change === 'fixed' ? Gl('arrow', iconSet)
                    : c.change === 'regressed' ? Gl('arrow', iconSet)
                    : '·'}
                </div>
              ))}
            </Col>
          </Pane>

          <Pane title={`Current · ${cur.when}`} focused>
            <CheckList checks={checks} side="cur" iconSet={iconSet} grouped />
          </Pane>

          {/* Runs sidebar */}
          <Pane title="Recent runs" width={240}>
            <Col gap={2}>
              {Dl.launch.runs.map((r, i) => (
                <ListRow
                  key={r.id}
                  selected={i === 0}
                  focused={i === 0}
                  prefix={<span style={{ color: r.status === 'partial' ? 'var(--tui-warning)' : 'var(--tui-success)' }}>{Gl('bullet', iconSet)}</span>}
                  right={
                    <Sec style={{ color: r.delta > 0 ? 'var(--tui-success)' : r.delta < 0 ? 'var(--tui-danger)' : 'var(--tui-textMuted)' }}>
                      {r.delta > 0 ? '+' : ''}{r.delta}
                    </Sec>
                  }
                >
                  <Col gap={0}>
                    <span>{r.score}</span>
                    <Dim>{r.when}</Dim>
                  </Col>
                </ListRow>
              ))}
            </Col>
          </Pane>
        </Row>
      </Workspace>

      <StatusBar
        mode="LAUNCH"
        shortcuts={[
          { key: 'j/k',   label: 'navigate' },
          { key: '⏎',     label: 'open check' },
          { key: 'c',     label: 'compare another' },
          { key: 'r',     label: 'rerun' },
          { key: 'o',     label: 'open url' },
        ]}
        hint={`forge launch · ${fixed} fixed · ${regressed} regressed`}
      />
    </>
  );
}

function CheckList({ checks, side, iconSet, grouped }) {
  if (!grouped) {
    return (
      <Col gap={1}>
        {checks.map((c, i) => {
          const s = side === 'prev' ? c.prev : c.cur;
          return (
            <Row key={i} gap={8} align="center" style={{ padding: '2px 8px', height: 22 }}>
              <span style={{ color: statusColor(s), width: 14, textAlign: 'center' }}>{statusGlyph(s, iconSet)}</span>
              <Sec style={{ minWidth: 56, fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.group}</Sec>
              <span style={{ color: 'var(--tui-text)' }}>{c.name}</span>
            </Row>
          );
        })}
      </Col>
    );
  }
  // grouped on current side
  const groups = [...new Set(checks.map(c => c.group))];
  return (
    <Col gap={4}>
      {groups.map((g) => (
        <Col key={g} gap={1}>
          <SectionTitle>{g}</SectionTitle>
          {checks.filter(c => c.group === g).map((c, i) => (
            <Row key={i} gap={8} align="center" style={{
              padding: '2px 8px', height: 22,
              borderRadius: 3,
              background: c.change === 'fixed' ? 'var(--tui-success)' + '12'
                : c.change === 'regressed' ? 'var(--tui-danger)' + '12'
                : 'transparent',
            }}>
              <span style={{ color: statusColor(c.cur), width: 14, textAlign: 'center' }}>{statusGlyph(c.cur, iconSet)}</span>
              <span style={{ color: 'var(--tui-text)', flex: 1 }}>{c.name}</span>
              {changeBadge(c.change)}
            </Row>
          ))}
        </Col>
      ))}
    </Col>
  );
}

function LaunchB({ iconSet, runIdx }) {
  const cur = Dl.launch.current;
  const prev = Dl.launch.previous;
  const checks = Dl.launch.checks;
  const fixed = checks.filter(c => c.change === 'fixed').length;
  const regressed = checks.filter(c => c.change === 'regressed').length;

  return (
    <>
      <TopBar
        crumbs={['launch', 'report ' + Dl.launch.runs[0].id]}
        right={<Tag color="var(--tui-success)" tone="solid">READY · {cur.when}</Tag>}
      />

      <Workspace dir="column">
        {/* Headline */}
        <div style={{
          display: 'flex',
          gap: 24,
          padding: '14px 20px',
          background: 'var(--tui-elevated)',
          borderRadius: 8,
          border: '1px solid var(--tui-borderSoft)',
          flex: '0 0 auto',
          alignItems: 'center',
        }}>
          <ScoreRing value={cur.score} size={108} stroke={9} color="var(--tui-success)" label="score" />
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            paddingLeft: 4, borderLeft: '1px solid var(--tui-borderSoft)',
            paddingLeft: 20, marginLeft: 4,
          }}>
            <Row gap={10} align="baseline">
              <Dim>was</Dim>
              <span style={{ fontSize: 22, color: 'var(--tui-textSec)' }}>{prev.score}</span>
              <span style={{ color: 'var(--tui-success)' }}>→</span>
              <span style={{ fontSize: 22, color: 'var(--tui-text)', fontWeight: 600 }}>{cur.score}</span>
              <Tag color="var(--tui-success)">+6</Tag>
            </Row>
            <Row gap={10}>
              <Tag color="var(--tui-success)" tone="solid">{fixed} fixed</Tag>
              <Tag color="var(--tui-danger)" tone="solid">{regressed} regressed</Tag>
              <Dim>· vs {prev.when}</Dim>
            </Row>
          </div>
          <div style={{ flex: 1 }} />
          <Col gap={2} style={{ alignItems: 'flex-end' }}>
            <Sec>{cur.url}</Sec>
            <Dim>id · {Dl.launch.runs[0].id}</Dim>
            <Sparkline values={Dl.launch.sparkline} color="var(--tui-primary)" />
          </Col>
        </div>

        {/* Regression banner */}
        {regressed > 0 && (
          <div style={{
            padding: '8px 14px',
            background: 'var(--tui-danger)' + '14',
            border: '1px solid var(--tui-danger)' + '55',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 10,
            flex: '0 0 auto',
          }}>
            <span style={{ color: 'var(--tui-danger)' }}>{Gl('warn', iconSet)}</span>
            <span style={{ color: 'var(--tui-text)' }}>2 new regressions since {prev.when}</span>
            <span style={{ flex: 1 }} />
            <Sec>CORS allow-list · lighthouse a11y</Sec>
            <ActionBtn shortcut="g">go to first</ActionBtn>
          </div>
        )}

        {/* Grouped diff */}
        <Pane title="Checks" focused right={<Dim>{checks.length} total · grouped</Dim>}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}>
            {[...new Set(checks.map(c => c.group))].map((g) => (
              <Col key={g} gap={1}>
                <SectionTitle right={<Sec>{checks.filter(c => c.group === g && c.cur === 'pass').length}/{checks.filter(c => c.group === g).length}</Sec>}>{g}</SectionTitle>
                {checks.filter(c => c.group === g).map((c, i) => (
                  <Row key={i} gap={10} align="center" style={{
                    padding: '3px 8px',
                    borderRadius: 3,
                    background: c.change === 'fixed' ? 'var(--tui-success)' + '14'
                      : c.change === 'regressed' ? 'var(--tui-danger)' + '14'
                      : 'transparent',
                  }}>
                    <span style={{ color: statusColor(c.prev), width: 14, textAlign: 'center', opacity: 0.55 }}>
                      {statusGlyph(c.prev, iconSet)}
                    </span>
                    <span style={{ color: c.change ? (c.change === 'fixed' ? 'var(--tui-success)' : 'var(--tui-danger)') : 'var(--tui-textMuted)' }}>
                      {Gl('arrow', iconSet)}
                    </span>
                    <span style={{ color: statusColor(c.cur), width: 14, textAlign: 'center' }}>
                      {statusGlyph(c.cur, iconSet)}
                    </span>
                    <span style={{ color: 'var(--tui-text)', flex: 1 }}>{c.name}</span>
                    {changeBadge(c.change)}
                  </Row>
                ))}
              </Col>
            ))}
          </div>
        </Pane>
      </Workspace>

      <StatusBar
        mode="LAUNCH"
        shortcuts={[
          { key: 'g',   label: 'go to regression' },
          { key: 'c',   label: 'compare run' },
          { key: 'r',   label: 'rerun' },
          { key: 'o',   label: 'open url' },
          { key: 'e',   label: 'export json' },
        ]}
        hint="forge launch --compare prev"
      />
    </>
  );
}

Object.assign(window, { ScreenLaunch });
