/* Screen: Interactive Doctor. Two directions.
   A — calm two-pane: grouped issue list (left) + diff/preview (right).
   B — opinionated triage: severity heatmap header, focused issue card, bulk-apply rail. */

const Gd = window.TuiTokens.glyph;
const Dd = window.ForgeData;

function ScreenDoctor({ direction = 'a', iconSet, selectedIdx = 0 }) {
  return direction === 'a'
    ? <DoctorA iconSet={iconSet} idx={selectedIdx} />
    : <DoctorB iconSet={iconSet} idx={selectedIdx} />;
}

const sevColor = (sev) => ({ high: 'var(--tui-danger)', medium: 'var(--tui-warning)', low: 'var(--tui-textSec)' })[sev];
const catColor = (cat) => ({
  project: 'var(--tui-secondary)',
  env: 'var(--tui-warning)',
  deployment: 'var(--tui-primary)',
  react: 'var(--tui-secondary)',
  express: 'var(--tui-primary)',
  security: 'var(--tui-danger)',
})[cat] || 'var(--tui-textSec)';

// ---------- Direction A ----------
function DoctorA({ iconSet, idx }) {
  const issues = Dd.doctor.issues;
  const issue = issues[idx] || issues[0];

  // Group by category for the list
  const groups = ['security', 'deployment', 'env', 'react', 'project'].map((cat) => ({
    cat,
    items: issues.filter((i) => i.cat === cat),
  })).filter((g) => g.items.length);

  return (
    <>
      <TopBar
        crumbs={['doctor', 'all rules']}
        right={
          <Row gap={8}>
            <Tag color="var(--tui-danger)">{Dd.doctor.summary.high} high</Tag>
            <Tag color="var(--tui-warning)">{Dd.doctor.summary.medium} med</Tag>
            <Tag color="var(--tui-textSec)">{Dd.doctor.summary.low} low</Tag>
            <Dim>·</Dim>
            <Tag color="var(--tui-success)">{Dd.doctor.summary.fixed} fixed</Tag>
          </Row>
        }
      />

      <Workspace>
        {/* Left — grouped issue list */}
        <Pane title="Issues" focused width={460} right={<Dim>{issues.length} total</Dim>}>
          <Row gap={6} style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            <FilterChip active>all</FilterChip>
            <FilterChip>high</FilterChip>
            <FilterChip>autofix</FilterChip>
            <FilterChip>deployment</FilterChip>
            <FilterChip>security</FilterChip>
          </Row>
          <Col gap={6}>
            {groups.map((g) => (
              <Col key={g.cat} gap={1}>
                <SectionTitle right={<Sec>{g.items.length}</Sec>}>{g.cat}</SectionTitle>
                {g.items.map((it) => {
                  const sel = it.id === issue.id;
                  return (
                    <ListRow
                      key={it.id}
                      selected={sel}
                      focused={sel}
                      prefix={<span style={{ color: sevColor(it.sev) }}>{Gd(it.sev === 'low' ? 'low' : 'bullet', iconSet)}</span>}
                      right={
                        <Row gap={6}>
                          {it.autofix && <Tag color="var(--tui-success)">fix</Tag>}
                          <Dim>{it.rule}</Dim>
                        </Row>
                      }
                    >
                      {it.title}
                    </ListRow>
                  );
                })}
              </Col>
            ))}
          </Col>
        </Pane>

        {/* Right — preview */}
        <Pane title={`Preview · ${issue.rule}`}
              right={
                <Row gap={8}>
                  <Tag color={sevColor(issue.sev)}>{issue.sev}</Tag>
                  <Tag color={catColor(issue.cat)}>{issue.cat}</Tag>
                </Row>
              }>
          <Col gap={6}>
            <span style={{ fontSize: 16, color: 'var(--tui-text)', fontWeight: 600 }}>{issue.title}</span>
            <Row gap={8} align="baseline">
              <Dim>file</Dim>
              <Sec>{issue.file}</Sec>
              <Dim>·</Dim>
              <Dim>rule</Dim>
              <Sec>{issue.rule}</Sec>
            </Row>
            <span style={{ color: 'var(--tui-textSec)' }}>{issue.note}</span>

            <div style={{ height: 6 }} />
            <SectionTitle right={<Sec>{issue.autofix ? 'auto-fixable' : 'manual'}</Sec>}>diff preview</SectionTitle>
            <div style={{
              background: 'var(--tui-elevated)',
              border: '1px solid var(--tui-borderSoft)',
              borderRadius: 4,
              padding: '8px 10px',
            }}>
              <DiffBlock
                filename={Dd.doctorDiff.file}
                hunkHeader={Dd.doctorDiff.hunkHeader}
                lines={Dd.doctorDiff.lines}
              />
            </div>

            <div style={{ flex: 1 }} />
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              padding: '10px 12px',
              background: 'var(--tui-elevated)',
              borderRadius: 4,
              border: '1px solid var(--tui-borderSoft)',
              marginTop: 4,
            }}>
              <Sec>actions</Sec>
              <Row gap={8}>
                <ActionBtn shortcut="a">apply fix</ActionBtn>
                <ActionBtn shortcut="A">apply all auto</ActionBtn>
                <ActionBtn shortcut="s">skip</ActionBtn>
                <ActionBtn shortcut="o">open file</ActionBtn>
                <ActionBtn shortcut="e">explain</ActionBtn>
              </Row>
            </div>
          </Col>
        </Pane>
      </Workspace>

      <StatusBar
        mode="DOCTOR"
        shortcuts={[
          { key: '↑↓',  label: 'navigate' },
          { key: '⏎',   label: 'preview' },
          { key: 'a',   label: 'apply' },
          { key: 'A',   label: 'apply all' },
          { key: 's',   label: 'skip' },
          { key: '/',   label: 'filter' },
          { key: 'esc', label: 'back' },
        ]}
        hint={`${idx + 1} / ${issues.length}`}
      />
    </>
  );
}

// ---------- Direction B ----------
function DoctorB({ iconSet, idx }) {
  const issues = Dd.doctor.issues;
  const issue = issues[idx] || issues[0];

  return (
    <>
      <TopBar
        crumbs={['doctor', 'triage']}
        right={<Row gap={8}><Tag color="var(--tui-success)" tone="solid">{Dd.doctor.summary.fixed} FIXED</Tag><Dim>·</Dim><Sec>{Dd.doctor.summary.total - Dd.doctor.summary.fixed} open</Sec></Row>}
      />

      <Workspace dir="column">
        {/* Heatmap header */}
        <Row gap={6} style={{ flex: '0 0 auto' }}>
          <Heat count={Dd.doctor.summary.high}     color="var(--tui-danger)"   label="HIGH" />
          <Heat count={Dd.doctor.summary.medium}   color="var(--tui-warning)"  label="MEDIUM" />
          <Heat count={Dd.doctor.summary.low}      color="var(--tui-textSec)"  label="LOW" />
          <Heat count={Dd.doctor.summary.fixed}    color="var(--tui-success)"  label="FIXED" />
          <div style={{
            flex: 2,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 12px',
            background: 'var(--tui-panel)',
            borderRadius: 4,
            border: '1px solid var(--tui-borderSoft)',
          }}>
            <Sec>by category</Sec>
            {Object.entries(Dd.doctor.catCounts).filter(([,n]) => n > 0).map(([c, n]) => (
              <Row key={c} gap={4} align="baseline">
                <span style={{ color: catColor(c), fontWeight: 600 }}>{n}</span>
                <Dim>{c}</Dim>
              </Row>
            ))}
          </div>
        </Row>

        <Row gap={10} style={{ flex: 1, minHeight: 0 }}>
          {/* Left: queue */}
          <Pane title="Triage queue" width={420} right={<Dim>sev ↓ · cat</Dim>}>
            <Row gap={6} style={{ marginBottom: 8 }}>
              <FilterChip active>all</FilterChip>
              <FilterChip>open</FilterChip>
              <FilterChip>autofix</FilterChip>
              <FilterChip>high</FilterChip>
            </Row>
            <Col gap={1}>
              {issues.map((it) => {
                const sel = it.id === issue.id;
                return (
                  <ListRow
                    key={it.id}
                    selected={sel}
                    focused={sel}
                    prefix={
                      <Row gap={4}>
                        <span style={{ color: sevColor(it.sev), width: 10 }}>{Gd(it.sev === 'low' ? 'low' : 'bullet', iconSet)}</span>
                        <Tag color={catColor(it.cat)}>{it.cat.slice(0, 3)}</Tag>
                      </Row>
                    }
                    right={it.autofix ? <Tag color="var(--tui-success)">fix</Tag> : <Dim>manual</Dim>}
                  >
                    {it.title}
                  </ListRow>
                );
              })}
            </Col>
          </Pane>

          {/* Right: focused card */}
          <Pane focused noTitleBorder title={null}>
            <div style={{
              padding: '14px 16px',
              borderRadius: 6,
              background: 'var(--tui-elevated)',
              marginBottom: 12,
            }}>
              <Row gap={8} align="baseline">
                <Tag color={sevColor(issue.sev)} tone="solid">{issue.sev.toUpperCase()}</Tag>
                <Tag color={catColor(issue.cat)}>{issue.cat}</Tag>
                <span style={{ flex: 1 }} />
                <Dim>{idx + 1} of {issues.length}</Dim>
              </Row>
              <div style={{ height: 8 }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--tui-text)' }}>{issue.title}</div>
              <div style={{ height: 4 }} />
              <Row gap={10} align="baseline">
                <Dim>{Gd('folder', iconSet)} {issue.file}</Dim>
                <Dim>·</Dim>
                <Dim>rule {issue.rule}</Dim>
                {issue.autofix && <Tag color="var(--tui-success)">auto-fixable</Tag>}
              </Row>
              <div style={{ height: 8 }} />
              <span style={{ color: 'var(--tui-textSec)' }}>{issue.note}</span>
            </div>

            <SectionTitle right={<Sec>{Gd('arrow', iconSet)} press <Kbd>a</Kbd> to apply</Sec>}>fix preview</SectionTitle>
            <div style={{
              background: 'var(--tui-bg)',
              border: '1px solid var(--tui-borderSoft)',
              borderRadius: 4,
              padding: '8px 10px',
            }}>
              <DiffBlock filename={Dd.doctorDiff.file} hunkHeader={Dd.doctorDiff.hunkHeader} lines={Dd.doctorDiff.lines} />
            </div>

            <div style={{ flex: 1 }} />
            <Row gap={8} style={{ marginTop: 12 }}>
              <ActionBtn shortcut="a" primary>apply this fix</ActionBtn>
              <ActionBtn shortcut="A">apply all autofix ({issues.filter(i => i.autofix).length})</ActionBtn>
              <ActionBtn shortcut="s">skip</ActionBtn>
              <ActionBtn shortcut="o">open file</ActionBtn>
            </Row>
          </Pane>
        </Row>
      </Workspace>

      <StatusBar
        mode="DOCTOR"
        shortcuts={[
          { key: 'j/k', label: 'navigate' },
          { key: 'a',   label: 'apply' },
          { key: 'A',   label: 'apply all auto' },
          { key: 's',   label: 'skip' },
          { key: '/',   label: 'filter' },
          { key: '?',   label: 'help' },
          { key: 'esc', label: 'back' },
        ]}
        hint={`triage · ${issues.filter(i => i.autofix).length} auto-fixable`}
      />
    </>
  );
}

// shared atoms
function FilterChip({ active, children }) {
  return (
    <span style={{
      padding: '1px 8px',
      borderRadius: 3,
      fontSize: 'inherit',
      letterSpacing: 0.2,
      color: active ? 'var(--tui-bg)' : 'var(--tui-textSec)',
      background: active ? 'var(--tui-primary)' : 'transparent',
      border: `1px solid ${active ? 'var(--tui-primary)' : 'var(--tui-borderSoft)'}`,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
    }}>{children}</span>
  );
}

function ActionBtn({ children, shortcut, primary }) {
  return (
    <Row gap={6} align="center" style={{
      padding: '4px 10px',
      borderRadius: 3,
      background: primary ? 'var(--tui-primary)' : 'var(--tui-panel)',
      color: primary ? 'var(--tui-bg)' : 'var(--tui-text)',
      border: `1px solid ${primary ? 'var(--tui-primary)' : 'var(--tui-borderSoft)'}`,
      fontWeight: primary ? 600 : 400,
      cursor: 'pointer',
    }}>
      <span>{children}</span>
      {shortcut && (
        <span style={{
          fontSize: '0.8em',
          padding: '0 5px',
          borderRadius: 2,
          background: primary ? 'rgba(0,0,0,0.18)' : 'var(--tui-elevated)',
          border: '1px solid ' + (primary ? 'rgba(0,0,0,0.2)' : 'var(--tui-borderSoft)'),
          color: primary ? 'var(--tui-bg)' : 'var(--tui-textSec)',
        }}>{shortcut}</span>
      )}
    </Row>
  );
}

Object.assign(window, { ScreenDoctor, FilterChip, ActionBtn });
