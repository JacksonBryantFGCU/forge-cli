/* Screen: Recipe browser. */

const Gr = window.TuiTokens.glyph;
const Dr = window.ForgeData;

function ScreenRecipes({ direction = 'a', iconSet, selectedIdx = 0 }) {
  return direction === 'a'
    ? <RecipesA iconSet={iconSet} idx={selectedIdx} />
    : <RecipesB iconSet={iconSet} idx={selectedIdx} />;
}

function opColor(op) {
  return ({
    create:    'var(--tui-success)',
    append:    'var(--tui-secondary)',
    overwrite: 'var(--tui-warning)',
    skip:      'var(--tui-textSec)',
  })[op] || 'var(--tui-textSec)';
}

function RecipesA({ iconSet, idx }) {
  const r = Dr.recipes[idx] || Dr.recipes[0];
  const preview = Dr.recipePreview;

  return (
    <>
      <TopBar
        crumbs={['recipes', 'browser']}
        right={
          <Row gap={8} align="center">
            <Dim>{Gr('arrow', iconSet)} search</Dim>
            <SearchBox value="vercel" />
            <Dim>{Dr.recipes.length} loaded</Dim>
          </Row>
        }
      />

      <Workspace>
        <Pane title="Recipes" focused width={460} right={<Dim>14 in ~/.forge/recipes</Dim>}>
          <Row gap={6} style={{ marginBottom: 8, flexWrap: 'wrap' }}>
            <FilterChip active>all</FilterChip>
            <FilterChip>vite</FilterChip>
            <FilterChip>vercel</FilterChip>
            <FilterChip>supabase</FilterChip>
            <FilterChip>express</FilterChip>
            <FilterChip>ci</FilterChip>
          </Row>
          <Col gap={1}>
            {Dr.recipes.map((rec, i) => {
              const sel = i === idx;
              return (
                <ListRow
                  key={rec.slug}
                  selected={sel}
                  focused={sel}
                  prefix={<Sec>{Gr('pkg', iconSet)}</Sec>}
                  right={
                    <Row gap={6}>
                      {rec.tags.slice(0, 2).map((tg) => <Tag key={tg}>{tg}</Tag>)}
                      <Tag color={opColor(rec.op)}>{rec.op}</Tag>
                    </Row>
                  }
                >
                  <span style={{ color: sel ? 'var(--tui-text)' : 'var(--tui-text)' }}>{rec.slug}</span>
                </ListRow>
              );
            })}
          </Col>
        </Pane>

        <Pane
          title={`Recipe · ${r.slug}`}
          right={<Row gap={6}>{r.tags.map(tg => <Tag key={tg}>{tg}</Tag>)}</Row>}
        >
          <Col gap={6}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tui-text)' }}>{r.slug}</span>
            <span style={{ color: 'var(--tui-textSec)' }}>{r.desc}</span>
            <Row gap={14} style={{ marginTop: 4 }}>
              <KV k="files" v={`${r.files}`} />
              <KV k="op"    v={<Tag color={opColor(r.op)}>{r.op}</Tag>} />
              <KV k="path"  v={<Sec>~/.forge/recipes/{r.slug}.json</Sec>} />
            </Row>

            <SectionTitle right={<Sec>{preview.operations.length} operation{preview.operations.length === 1 ? '' : 's'}</Sec>}>
              operations
            </SectionTitle>
            <Col gap={1}>
              {preview.operations.map((op, i) => (
                <ListRow
                  key={i}
                  prefix={<Tag color={opColor(op.op)} tone="solid">{op.op}</Tag>}
                  right={<Dim>{op.bytes} B</Dim>}
                >
                  <Sec>{op.path}</Sec>
                </ListRow>
              ))}
            </Col>

            <SectionTitle right={<Sec>{Gr('arrow', iconSet)} preview file</Sec>}>vercel.json</SectionTitle>
            <div style={{
              background: 'var(--tui-elevated)',
              border: '1px solid var(--tui-borderSoft)',
              borderRadius: 4,
              padding: '8px 10px',
              fontSize: 'inherit',
            }}>
              <pre style={{ margin: 0, fontFamily: 'inherit', lineHeight: 'inherit', color: 'var(--tui-text)' }}>
{preview.body.join('\n')}
              </pre>
            </div>

            <SectionTitle>notes</SectionTitle>
            <Col gap={3}>
              {preview.notes.map((n, i) => (
                <Row key={i} gap={8} align="baseline">
                  <Sec>{Gr('chevron', iconSet)}</Sec>
                  <Sec>{n}</Sec>
                </Row>
              ))}
            </Col>

            <div style={{ flex: 1 }} />
            <Row gap={8} style={{ marginTop: 10 }}>
              <ActionBtn shortcut="⏎" primary>apply recipe</ActionBtn>
              <ActionBtn shortcut="d">dry run</ActionBtn>
              <ActionBtn shortcut="f">force</ActionBtn>
              <ActionBtn shortcut="o">open in editor</ActionBtn>
            </Row>
          </Col>
        </Pane>
      </Workspace>

      <StatusBar
        mode="RECIPES"
        shortcuts={[
          { key: '↑↓',  label: 'navigate' },
          { key: '⏎',   label: 'apply' },
          { key: 'd',   label: 'dry run' },
          { key: '/',   label: 'search' },
          { key: 'esc', label: 'back' },
        ]}
        hint={`${idx + 1} / ${Dr.recipes.length} · forge pack use ${r.slug}`}
      />
    </>
  );
}

function RecipesB({ iconSet, idx }) {
  const r = Dr.recipes[idx] || Dr.recipes[0];
  const preview = Dr.recipePreview;

  return (
    <>
      <TopBar
        crumbs={['recipes']}
        right={
          <Row gap={8}>
            <SearchBox value="" placeholder="fuzzy search recipes (/)" wide />
          </Row>
        }
      />

      <Workspace dir="column">
        {/* Category strip */}
        <Row gap={6} style={{ flex: '0 0 auto', flexWrap: 'wrap' }}>
          {[
            { label: 'all', count: 14, active: true },
            { label: 'vite', count: 4 },
            { label: 'vercel', count: 3 },
            { label: 'supabase', count: 2 },
            { label: 'express', count: 3 },
            { label: 'ci', count: 2 },
            { label: 'react', count: 4 },
            { label: 'testing', count: 1 },
            { label: 'forms', count: 1 },
          ].map((c) => (
            <CategoryCard key={c.label} {...c} />
          ))}
        </Row>

        <Row gap={10} style={{ flex: 1, minHeight: 0 }}>
          {/* Card grid */}
          <Pane title="Browse" focused width={undefined} right={<Dim>sort · recently used</Dim>}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}>
              {Dr.recipes.slice(0, 8).map((rec, i) => {
                const sel = i === idx;
                return (
                  <div key={rec.slug} style={{
                    padding: '10px 12px',
                    borderRadius: 5,
                    background: sel ? 'var(--tui-selection)' : 'var(--tui-elevated)',
                    border: `1px solid ${sel ? 'var(--tui-primary)' : 'var(--tui-borderSoft)'}`,
                    minHeight: 78,
                    display: 'flex', flexDirection: 'column', gap: 4,
                    cursor: 'pointer',
                    position: 'relative',
                  }}>
                    {sel && <span style={{
                      position: 'absolute', top: 8, right: 8,
                      color: 'var(--tui-primary)', fontSize: 10,
                    }}>{Gr('arrow', iconSet)}</span>}
                    <Row gap={6} align="baseline">
                      <Sec>{Gr('pkg', iconSet)}</Sec>
                      <span style={{ color: 'var(--tui-text)', fontWeight: 500 }}>{rec.slug}</span>
                    </Row>
                    <Sec style={{ lineHeight: 1.3, fontSize: 'inherit' }}>{rec.desc}</Sec>
                    <Row gap={6} style={{ marginTop: 'auto' }}>
                      {rec.tags.slice(0, 2).map(tg => <Tag key={tg}>{tg}</Tag>)}
                      <Tag color={opColor(rec.op)}>{rec.op}</Tag>
                    </Row>
                  </div>
                );
              })}
            </div>
          </Pane>

          {/* Preview side */}
          <Pane title="Preview" width={460}>
            <Col gap={6}>
              <Row gap={8} align="baseline">
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--tui-text)' }}>{r.slug}</span>
                <Tag color={opColor(r.op)} tone="solid">{r.op}</Tag>
              </Row>
              <Sec>{r.desc}</Sec>
              <Row gap={6}>{r.tags.map(tg => <Tag key={tg}>{tg}</Tag>)}</Row>

              <SectionTitle>files</SectionTitle>
              {preview.operations.map((op, i) => (
                <Row key={i} gap={8} align="baseline">
                  <Tag color={opColor(op.op)} tone="solid">{op.op}</Tag>
                  <Sec>{op.path}</Sec>
                  <Dim style={{ marginLeft: 'auto' }}>{op.bytes} B</Dim>
                </Row>
              ))}

              <SectionTitle>vercel.json</SectionTitle>
              <div style={{
                background: 'var(--tui-bg)',
                border: '1px solid var(--tui-borderSoft)',
                borderRadius: 4,
                padding: '8px 10px',
                fontSize: 'inherit',
                color: 'var(--tui-text)',
              }}>
                <pre style={{ margin: 0, fontFamily: 'inherit', lineHeight: 'inherit' }}>
{preview.body.join('\n')}
                </pre>
              </div>

              <div style={{ flex: 1 }} />
              <Row gap={8} style={{ marginTop: 6 }}>
                <ActionBtn shortcut="⏎" primary>apply</ActionBtn>
                <ActionBtn shortcut="d">dry run</ActionBtn>
                <ActionBtn shortcut="s">save copy</ActionBtn>
              </Row>
            </Col>
          </Pane>
        </Row>
      </Workspace>

      <StatusBar
        mode="RECIPES"
        shortcuts={[
          { key: 'h j k l', label: 'navigate' },
          { key: '⏎',   label: 'apply' },
          { key: 'd',   label: 'dry run' },
          { key: '/',   label: 'search' },
          { key: 't',   label: 'tags' },
        ]}
        hint={`${Dr.recipes.length} recipes · ~/.forge/recipes`}
      />
    </>
  );
}

function CategoryCard({ label, count, active }) {
  return (
    <div style={{
      padding: '6px 12px',
      borderRadius: 4,
      background: active ? 'var(--tui-primary)' : 'var(--tui-panel)',
      color: active ? 'var(--tui-bg)' : 'var(--tui-textSec)',
      border: `1px solid ${active ? 'var(--tui-primary)' : 'var(--tui-borderSoft)'}`,
      display: 'flex', alignItems: 'baseline', gap: 6,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
    }}>
      <span>{label}</span>
      <span style={{ fontSize: '0.85em', opacity: active ? 0.85 : 0.7 }}>{count}</span>
    </div>
  );
}

function SearchBox({ value = '', placeholder = 'search', wide }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '2px 10px',
      borderRadius: 3,
      background: 'var(--tui-elevated)',
      border: '1px solid var(--tui-borderSoft)',
      minWidth: wide ? 360 : 200,
    }}>
      <Sec>/</Sec>
      {value ? (
        <span style={{ color: 'var(--tui-text)' }}>{value}</span>
      ) : (
        <Dim>{placeholder}</Dim>
      )}
      <span style={{ flex: 1 }} />
      <span style={{
        width: 1, height: 14, background: 'var(--tui-primary)',
        animation: 'tui-blink 1s steps(1) infinite',
      }} />
    </div>
  );
}

Object.assign(window, { ScreenRecipes, SearchBox, CategoryCard });
