/* Screen: Prompt history. */

const Gp = window.TuiTokens.glyph;
const Dp = window.ForgeData;

function ScreenPrompts({ direction = 'a', iconSet, selectedIdx = 0 }) {
  return direction === 'a'
    ? <PromptsA iconSet={iconSet} idx={selectedIdx} />
    : <PromptsB iconSet={iconSet} idx={selectedIdx} />;
}

const TYPES = ['feature','debug','refactor','audit','test','cleanup','deploy','review'];

function PromptsA({ iconSet, idx }) {
  const p = Dp.prompts[idx] || Dp.prompts[0];
  return (
    <>
      <TopBar
        crumbs={['prompts', 'history']}
        right={
          <Row gap={8}>
            <SearchBox value="" placeholder="filter prompts (/)" />
            <Dim>{Dp.prompts.length} total · 142 lifetime</Dim>
          </Row>
        }
      />

      <Workspace>
        <Pane title="History" focused width={480} right={<Dim>sort · newest</Dim>}>
          <Row gap={6} style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            <FilterChip active>all</FilterChip>
            {TYPES.map(tp => <FilterChip key={tp}>{tp}</FilterChip>)}
          </Row>
          <Col gap={1}>
            {Dp.prompts.map((pr, i) => {
              const sel = i === idx;
              return (
                <ListRow
                  key={pr.id}
                  selected={sel}
                  focused={sel}
                  prefix={<PromptTypeChip type={pr.type} />}
                  right={<Dim>{pr.when}</Dim>}
                >
                  <span>{pr.task}</span>
                </ListRow>
              );
            })}
          </Col>
        </Pane>

        <Pane
          title={`Prompt · ${p.id}`}
          right={
            <Row gap={6}>
              <PromptTypeChip type={p.type} />
              <Tag color="var(--tui-secondary)">mode {p.mode}</Tag>
              <Dim>{p.tokens} tok</Dim>
            </Row>
          }
        >
          <Col gap={6}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tui-text)' }}>{p.task}</span>
            <Row gap={14}>
              <KV k="generated" v={p.when} />
              <KV k="project"   v={<Sec>{Dp.project.name}</Sec>} />
              <KV k="stack"     v={<Sec>{Dp.project.framework}</Sec>} />
            </Row>

            <SectionTitle right={<Sec>{Gp('arrow', iconSet)} press <Kbd>y</Kbd> to copy</Sec>}>
              prompt body
            </SectionTitle>
            <div style={{
              flex: 1,
              minHeight: 0,
              background: 'var(--tui-elevated)',
              border: '1px solid var(--tui-borderSoft)',
              borderRadius: 4,
              padding: '10px 12px',
              overflow: 'hidden',
            }}>
              <pre style={{
                margin: 0, fontFamily: 'inherit', lineHeight: 'inherit',
                color: 'var(--tui-text)', fontSize: 'inherit',
                whiteSpace: 'pre-wrap',
              }}>
{Dp.promptBody.map((ln) => {
  if (ln.startsWith('# ')) return <span style={{ color: 'var(--tui-primary)', fontWeight: 600 }}>{ln}{'\n'}</span>;
  if (ln.startsWith('## ')) return <span style={{ color: 'var(--tui-secondary)', fontWeight: 600 }}>{ln}{'\n'}</span>;
  if (ln.startsWith('- ') || ln.match(/^\d\./)) return <span><span style={{ color: 'var(--tui-textMuted)' }}>{ln.slice(0, 2)}</span>{ln.slice(2)}{'\n'}</span>;
  return ln + '\n';
})}
              </pre>
            </div>

            <Row gap={8} style={{ marginTop: 6 }}>
              <ActionBtn shortcut="y" primary>copy to clipboard</ActionBtn>
              <ActionBtn shortcut="r">regenerate</ActionBtn>
              <ActionBtn shortcut="e">edit task</ActionBtn>
              <ActionBtn shortcut="x">delete</ActionBtn>
            </Row>
          </Col>
        </Pane>
      </Workspace>

      <StatusBar
        mode="PROMPTS"
        shortcuts={[
          { key: '↑↓',  label: 'navigate' },
          { key: 'y',   label: 'copy' },
          { key: 'r',   label: 'regenerate' },
          { key: 'n',   label: 'new prompt' },
          { key: '/',   label: 'filter' },
          { key: 'esc', label: 'back' },
        ]}
        hint={`forge prompt show ${p.id}`}
      />
    </>
  );
}

function PromptsB({ iconSet, idx }) {
  const p = Dp.prompts[idx] || Dp.prompts[0];

  // Activity heatmap data — fake per-day counts last 4 weeks
  const heat = [0,1,2,0,0,3,1, 1,4,0,2,1,0,0, 2,2,1,3,0,0,1, 0,1,2,1,4,2,1];

  // Counts per type
  const typeCounts = TYPES.map(t => ({
    type: t,
    count: Dp.prompts.filter(pp => pp.type === t).length,
  }));

  return (
    <>
      <TopBar
        crumbs={['prompts', 'studio']}
        right={
          <Row gap={8}>
            <ActionBtn shortcut="n" primary>new prompt</ActionBtn>
          </Row>
        }
      />

      <Workspace dir="column">
        {/* Header — composer + stats */}
        <Row gap={10} style={{ flex: '0 0 auto' }}>
          <Pane title="Compose" focused>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {TYPES.map((tp, i) => (
                <ComposerChip key={tp} type={tp} active={i === 0} />
              ))}
            </Row>
            <div style={{ height: 8 }} />
            <div style={{
              padding: '8px 12px',
              borderRadius: 4,
              background: 'var(--tui-elevated)',
              border: '1px solid var(--tui-borderSoft)',
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <Sec>{Gp('chevron', iconSet)}</Sec>
              <span style={{ color: 'var(--tui-text)' }}>add settings page with profile + theme toggle</span>
              <span style={{ flex: 1 }} />
              <Tag color="var(--tui-secondary)">mode · plan</Tag>
            </div>
            <Row gap={6} style={{ marginTop: 8 }}>
              <ActionBtn shortcut="⏎" primary>generate</ActionBtn>
              <ActionBtn shortcut="m">switch mode</ActionBtn>
              <ActionBtn shortcut="c">context</ActionBtn>
            </Row>
          </Pane>

          <Pane title="Last 4 weeks" width={360}>
            <Col gap={6}>
              <Row gap={3} wrap="wrap">
                {heat.map((c, i) => (
                  <span key={i} style={{
                    width: 14, height: 14, borderRadius: 2,
                    background: c === 0 ? 'var(--tui-borderSoft)'
                      : c === 1 ? 'var(--tui-selection)'
                      : c === 2 ? 'var(--tui-primary)' + '66'
                      : c === 3 ? 'var(--tui-primary)' + 'aa'
                      : 'var(--tui-primary)',
                  }} />
                ))}
              </Row>
              <Row gap={4}>
                <Sec>less</Sec>
                {[0,1,2,3,4].map(l => (
                  <span key={l} style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: l === 0 ? 'var(--tui-borderSoft)'
                      : l === 1 ? 'var(--tui-selection)'
                      : l === 2 ? 'var(--tui-primary)' + '66'
                      : l === 3 ? 'var(--tui-primary)' + 'aa'
                      : 'var(--tui-primary)',
                  }} />
                ))}
                <Sec>more</Sec>
                <span style={{ flex: 1 }} />
                <Sec>32 generated</Sec>
              </Row>
            </Col>
          </Pane>
        </Row>

        <Row gap={10} style={{ flex: 1, minHeight: 0 }}>
          {/* History */}
          <Pane title="History" width={420}>
            <Row gap={6} style={{ marginBottom: 8, flexWrap: 'wrap' }}>
              <FilterChip active>all</FilterChip>
              {typeCounts.slice(0, 5).map(tc => (
                <FilterChip key={tc.type}>{tc.type} {tc.count}</FilterChip>
              ))}
            </Row>
            <Col gap={1}>
              {Dp.prompts.map((pr, i) => {
                const sel = i === idx;
                return (
                  <ListRow
                    key={pr.id}
                    selected={sel}
                    focused={sel}
                    prefix={<PromptTypeChip type={pr.type} />}
                    right={<Dim>{pr.when}</Dim>}
                  >{pr.task}</ListRow>
                );
              })}
            </Col>
          </Pane>

          {/* Preview */}
          <Pane title={`${p.id} · ${p.type}`} right={<Tag color="var(--tui-secondary)">{p.mode}</Tag>}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tui-text)' }}>{p.task}</span>
            <Row gap={12} style={{ marginTop: 4, marginBottom: 6 }}>
              <Dim>{p.when}</Dim>
              <Dim>·</Dim>
              <Dim>{p.tokens} tok</Dim>
              <Dim>·</Dim>
              <Sec>{Dp.project.name}</Sec>
            </Row>
            <div style={{
              flex: 1,
              minHeight: 0,
              background: 'var(--tui-bg)',
              border: '1px solid var(--tui-borderSoft)',
              borderRadius: 4,
              padding: '10px 12px',
              overflow: 'hidden',
            }}>
              <pre style={{ margin: 0, fontFamily: 'inherit', lineHeight: 'inherit', color: 'var(--tui-text)', whiteSpace: 'pre-wrap' }}>
{Dp.promptBody.slice(0, 16).map((ln) => {
  if (ln.startsWith('# '))  return <span style={{ color: 'var(--tui-primary)',   fontWeight: 600 }}>{ln}{'\n'}</span>;
  if (ln.startsWith('## ')) return <span style={{ color: 'var(--tui-secondary)', fontWeight: 600 }}>{ln}{'\n'}</span>;
  return ln + '\n';
})}
              </pre>
            </div>
            <Row gap={8} style={{ marginTop: 6 }}>
              <ActionBtn shortcut="y" primary>copy</ActionBtn>
              <ActionBtn shortcut="r">regenerate</ActionBtn>
              <ActionBtn shortcut="e">edit</ActionBtn>
              <ActionBtn shortcut="x">delete</ActionBtn>
            </Row>
          </Pane>
        </Row>
      </Workspace>

      <StatusBar
        mode="PROMPTS"
        shortcuts={[
          { key: 'n',   label: 'new' },
          { key: 'y',   label: 'copy' },
          { key: 'r',   label: 'regen' },
          { key: 'j/k', label: 'nav' },
          { key: '/',   label: 'filter' },
        ]}
        hint={'forge prompt feature "…" · history limit 200'}
      />
    </>
  );
}

function ComposerChip({ type, active }) {
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 3,
      background: active ? 'var(--tui-primary)' : 'var(--tui-panel)',
      color: active ? 'var(--tui-bg)' : 'var(--tui-textSec)',
      border: `1px solid ${active ? 'var(--tui-primary)' : 'var(--tui-borderSoft)'}`,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
    }}>{type}</span>
  );
}

Object.assign(window, { ScreenPrompts });
