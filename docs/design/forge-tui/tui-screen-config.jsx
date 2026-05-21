/* Screen: Config editor (forge config). */

const Gc = window.TuiTokens.glyph;
const Dc = window.ForgeData;

function ScreenConfig({ direction = 'a', iconSet, sectionIdx = 0, itemIdx = 1 }) {
  return direction === 'a'
    ? <ConfigA iconSet={iconSet} sIdx={sectionIdx} iIdx={itemIdx} />
    : <ConfigB iconSet={iconSet} sIdx={sectionIdx} iIdx={itemIdx} />;
}

function renderVal(item) {
  if (item.type === 'bool') {
    return <Tag color={item.val ? 'var(--tui-success)' : 'var(--tui-textSec)'} tone="solid">{item.val ? 'ON' : 'OFF'}</Tag>;
  }
  if (item.type === 'enum') return <span style={{ color: 'var(--tui-text)' }}>{item.val}</span>;
  if (item.type === 'number') return <span style={{ color: 'var(--tui-text)' }}>{item.val}</span>;
  if (item.type === 'path') return <Sec>{item.val}</Sec>;
  if (item.type === 'list') return <Sec>{Array.isArray(item.val) && item.val.length ? item.val.join(', ') : '∅ empty'}</Sec>;
  return <span>{String(item.val)}</span>;
}

function ConfigA({ iconSet, sIdx, iIdx }) {
  const section = Dc.config.sections[sIdx];
  const item = section.items[iIdx] || section.items[0];

  return (
    <>
      <TopBar
        crumbs={['config', section.label.toLowerCase()]}
        right={<Dim>~/.forge/config.json</Dim>}
      />

      <Workspace>
        {/* Section nav */}
        <Pane title="Sections" width={220}>
          <Col gap={1}>
            {Dc.config.sections.map((s, i) => (
              <ListRow
                key={s.id}
                selected={i === sIdx}
                focused={i === sIdx}
                prefix={<Sec>{Gc('chevron', iconSet)}</Sec>}
                right={<Dim>{s.items.length}</Dim>}
              >{s.label}</ListRow>
            ))}
          </Col>
          <div style={{ height: 12 }} />
          <SectionTitle>directories</SectionTitle>
          <Col gap={2}>
            <Row gap={6}><Sec>{Gc('folder', iconSet)}</Sec><span>~/.forge</span></Row>
            <Row gap={6}><Sec>{Gc('folder', iconSet)}</Sec><span>~/.forge/recipes</span></Row>
            <Row gap={6}><Sec>{Gc('folder', iconSet)}</Sec><span>~/.forge/templates</span></Row>
          </Col>
        </Pane>

        {/* Values */}
        <Pane title={section.label} focused right={<Dim>{section.items.length} settings</Dim>}>
          <Col gap={1}>
            {section.items.map((it, i) => {
              const sel = i === iIdx;
              return (
                <ListRow
                  key={it.key}
                  selected={sel}
                  focused={sel}
                  prefix={<Sec style={{ minWidth: 18 }}>{Gc(it.type === 'bool' ? (it.val ? 'check' : 'cross') : 'dot', iconSet)}</Sec>}
                  right={
                    <Row gap={8}>
                      {renderVal(it)}
                      {it.readOnly && <Dim>read-only</Dim>}
                    </Row>
                  }
                >
                  <span style={{ color: 'var(--tui-text)' }}>{it.key}</span>
                </ListRow>
              );
            })}
          </Col>

          <div style={{ flex: 1 }} />

          {/* Editor footer */}
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            background: 'var(--tui-elevated)',
            borderRadius: 5,
            border: '1px solid var(--tui-borderSoft)',
          }}>
            <Row gap={8} align="baseline">
              <Sec>edit</Sec>
              <span style={{ color: 'var(--tui-text)', fontWeight: 500 }}>{item.key}</span>
              <Tag color="var(--tui-secondary)">{item.type}</Tag>
              {item.readOnly && <Tag color="var(--tui-textSec)">read-only</Tag>}
            </Row>
            <div style={{ height: 6 }} />
            {item.type === 'enum' && (
              <Row gap={6}>
                {item.options.map(o => (
                  <FilterChip key={o} active={o === item.val}>{o}</FilterChip>
                ))}
              </Row>
            )}
            {item.type === 'bool' && (
              <Row gap={6}>
                <FilterChip active={item.val === true}>on</FilterChip>
                <FilterChip active={item.val === false}>off</FilterChip>
              </Row>
            )}
            {item.type === 'number' && (
              <Row gap={6} align="center">
                <ActionBtn shortcut="h">−</ActionBtn>
                <div style={{
                  padding: '2px 12px',
                  background: 'var(--tui-bg)',
                  border: '1px solid var(--tui-primary)',
                  borderRadius: 3,
                  color: 'var(--tui-text)',
                  fontWeight: 600,
                  minWidth: 80, textAlign: 'center',
                }}>{item.val}</div>
                <ActionBtn shortcut="l">+</ActionBtn>
                <Dim>step 50</Dim>
              </Row>
            )}
            {item.type === 'path' && (
              <Row gap={6} align="center">
                <div style={{
                  flex: 1, padding: '4px 10px',
                  background: 'var(--tui-bg)',
                  border: '1px solid ' + (item.readOnly ? 'var(--tui-borderSoft)' : 'var(--tui-primary)'),
                  borderRadius: 3,
                  color: 'var(--tui-text)',
                }}>{item.val}</div>
                {!item.readOnly && <ActionBtn shortcut="o">browse</ActionBtn>}
              </Row>
            )}
            {item.type === 'list' && (
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {item.options.map(o => (
                  <FilterChip key={o} active={Array.isArray(item.val) && item.val.includes(o)}>{o}</FilterChip>
                ))}
              </Row>
            )}
          </div>
        </Pane>

        {/* Overrides side */}
        <Pane title="Template overrides" width={300} right={<Dim>{Dc.config.overrides.length}</Dim>}>
          <Col gap={2}>
            {Dc.config.overrides.map((o, i) => (
              <Col key={i} gap={1} style={{
                padding: '6px 10px',
                background: 'var(--tui-elevated)',
                borderRadius: 3,
                border: '1px solid var(--tui-borderSoft)',
              }}>
                <Row gap={6} align="baseline">
                  <Tag color="var(--tui-primary)">{o.source}</Tag>
                  <Sec>{o.template}</Sec>
                </Row>
                <Sec>{Gc('folder', iconSet)} {o.file}</Sec>
              </Col>
            ))}
          </Col>

          <div style={{ height: 14 }} />
          <SectionTitle>actions</SectionTitle>
          <Col gap={6}>
            <ActionBtn shortcut="r">reset to default</ActionBtn>
            <ActionBtn shortcut="o">open config.json</ActionBtn>
            <ActionBtn shortcut="t">template list</ActionBtn>
          </Col>
        </Pane>
      </Workspace>

      <StatusBar
        mode="CONFIG"
        shortcuts={[
          { key: 'h/l',  label: 'pane' },
          { key: 'j/k',  label: 'item' },
          { key: '⏎',    label: 'edit' },
          { key: 'r',    label: 'reset' },
          { key: 'esc',  label: 'back' },
        ]}
        hint={`forge config ${item.key}`}
      />
    </>
  );
}

function ConfigB({ iconSet, sIdx, iIdx }) {
  // Single-screen "settings page" — all sections visible, tighter
  return (
    <>
      <TopBar
        crumbs={['config']}
        right={
          <Row gap={8}>
            <Dim>{Gc('folder', iconSet)} ~/.forge/config.json</Dim>
            <ActionBtn shortcut="o">open</ActionBtn>
          </Row>
        }
      />

      <Workspace dir="column">
        <Row gap={10} style={{ flex: 1, minHeight: 0 }}>
          <Pane title="Settings" focused>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}>
              {Dc.config.sections.map((s) => (
                <div key={s.id} style={{
                  padding: '10px 12px',
                  background: 'var(--tui-elevated)',
                  border: '1px solid var(--tui-borderSoft)',
                  borderRadius: 5,
                }}>
                  <SectionTitle right={<Sec>{s.items.length}</Sec>}>{s.label}</SectionTitle>
                  <Col gap={3}>
                    {s.items.map((it) => (
                      <Row key={it.key} gap={10} align="baseline">
                        <Sec style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {it.key.replace(s.id + '.', '')}
                        </Sec>
                        <span style={{ flex: '0 0 auto' }}>{renderVal(it)}</span>
                      </Row>
                    ))}
                  </Col>
                </div>
              ))}
            </div>
          </Pane>

          <Pane title="Overrides" width={300}>
            <Col gap={4}>
              {Dc.config.overrides.map((o, i) => (
                <Col key={i} gap={1} style={{
                  padding: '8px 10px',
                  background: 'var(--tui-elevated)',
                  borderRadius: 4,
                  border: '1px solid var(--tui-borderSoft)',
                }}>
                  <Row gap={6} align="baseline">
                    <Tag color="var(--tui-primary)">user</Tag>
                    <span style={{ color: 'var(--tui-text)' }}>{o.template}</span>
                  </Row>
                  <Sec>{o.file}</Sec>
                </Col>
              ))}
            </Col>
            <div style={{ height: 12 }} />
            <SectionTitle>paths</SectionTitle>
            <Col gap={2}>
              <KV k="forge"     v={<Sec>~/.forge</Sec>} />
              <KV k="recipes"   v={<Sec>~/.forge/recipes</Sec>} />
              <KV k="templates" v={<Sec>~/.forge/templates</Sec>} />
              <KV k="history"   v={<Sec>~/.forge/history.json</Sec>} />
            </Col>
          </Pane>
        </Row>
      </Workspace>

      <StatusBar
        mode="CONFIG"
        shortcuts={[
          { key: 'tab', label: 'next section' },
          { key: '⏎',   label: 'edit' },
          { key: 'r',   label: 'reset' },
          { key: 'o',   label: 'open in $EDITOR' },
        ]}
        hint="forge config get|set <key>"
      />
    </>
  );
}

Object.assign(window, { ScreenConfig });
