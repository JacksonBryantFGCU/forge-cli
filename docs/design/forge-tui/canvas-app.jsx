/* Forge TUI design canvas root.
   Sections:
     · Foundation — palette/type/atoms/layout (1 artboard)
     · Dashboard — A + B  (2)
     · Doctor — A + B
     · Recipes — A + B
     · Prompts — A + B
     · Launch — A + B
     · Config — A + B
     · Command Palette — A + B (overlay over dashboard)
     · Onboarding — A + B
     · Help overlay — single
     · States — loading / empty / error  (3)
*/

const { useState } = React;

const FRAME_W = 1176;
const FRAME_H = 842;

function CanvasApp() {
  return (
    <DesignCanvas
      title="Forge TUI"
      subtitle="Terminal-native developer cockpit · two directions · drag to reorder, click any artboard to focus"
    >
      <DCSection id="foundation" title="Foundation" subtitle="palette · type · density · atoms · layout">
        <DCArtboard id="system" label="design system" width={1180} height={840}>
          <SystemFoundation />
        </DCArtboard>
        <DCArtboard id="notes" label="design notes" width={520} height={840}>
          <NotesPanel />
        </DCArtboard>
      </DCSection>

      <DCSection id="dashboard" title="Dashboard · forge dash" subtitle="multi-pane cockpit · top status + bottom shortcuts">
        <PairFrames screen="dashboard" />
      </DCSection>

      <DCSection id="doctor" title="Interactive Doctor · forge doctor" subtitle="grouped issue list + inline diff · bulk apply">
        <PairFrames screen="doctor" />
      </DCSection>

      <DCSection id="recipes" title="Recipe browser · forge pack" subtitle="14 default recipes from ~/.forge/recipes/">
        <PairFrames screen="recipes" />
      </DCSection>

      <DCSection id="prompts" title="Prompt history · forge prompt" subtitle="8 prompt types · plan / implement / review modes">
        <PairFrames screen="prompts" />
      </DCSection>

      <DCSection id="launch" title="Launch report diff · forge launch --compare" subtitle="side-by-side prev / current · regressions highlighted">
        <PairFrames screen="launch" />
      </DCSection>

      <DCSection id="config" title="Config editor · forge config" subtitle="~/.forge/config.json with template overrides">
        <PairFrames screen="config" />
      </DCSection>

      <DCSection id="palette" title="Command palette · ⌘K" subtitle="fuzzy across commands · recipes · prompts">
        <PairFrames screen="palette" />
      </DCSection>

      <DCSection id="onboarding" title="Onboarding · first-run" subtitle="detect → init → recipes → first doctor run">
        <PairFrames screen="onboarding" />
      </DCSection>

      <DCSection id="help" title="Help overlay · press ?">
        <DCArtboard id="help" label="keyboard reference" width={FRAME_W} height={FRAME_H}>
          <TuiFrame theme="slate" accent="blue" density="comfortable" borderStyle="single" iconSet="nerd" cols={140} rows={40}>
            <ScreenHelp direction="a" iconSet="nerd" />
          </TuiFrame>
        </DCArtboard>
      </DCSection>

      <DCSection id="states" title="States" subtitle="loading · empty · error">
        <DCArtboard id="loading" label="loading · launch in progress" width={FRAME_W} height={FRAME_H}>
          <TuiFrame theme="slate" accent="blue" density="comfortable" borderStyle="single" iconSet="nerd" cols={140} rows={40}>
            <ScreenStates direction="a" iconSet="nerd" which="loading" />
          </TuiFrame>
        </DCArtboard>
        <DCArtboard id="empty" label="empty · no prompts yet" width={FRAME_W} height={FRAME_H}>
          <TuiFrame theme="slate" accent="blue" density="comfortable" borderStyle="single" iconSet="nerd" cols={140} rows={40}>
            <ScreenStates direction="a" iconSet="nerd" which="empty" />
          </TuiFrame>
        </DCArtboard>
        <DCArtboard id="error" label="error · rule crashed" width={FRAME_W} height={FRAME_H}>
          <TuiFrame theme="slate" accent="blue" density="comfortable" borderStyle="single" iconSet="nerd" cols={140} rows={40}>
            <ScreenStates direction="a" iconSet="nerd" which="error" />
          </TuiFrame>
        </DCArtboard>
      </DCSection>

      <DCSection id="responsive" title="Responsive · 100×30 fallback" subtitle="graceful degradation for narrow terminals">
        <DCArtboard id="narrow-dash" label="dashboard · 100×30" width={840} height={628}>
          <TuiFrame theme="slate" accent="blue" density="compact" borderStyle="single" iconSet="nerd" cols={100} rows={30}>
            <ScreenDashboard direction="a" iconSet="nerd" />
          </TuiFrame>
        </DCArtboard>
        <DCArtboard id="narrow-doctor" label="doctor · 100×30" width={840} height={628}>
          <TuiFrame theme="slate" accent="blue" density="compact" borderStyle="single" iconSet="nerd" cols={100} rows={30}>
            <ScreenDoctor direction="a" iconSet="nerd" />
          </TuiFrame>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

function PairFrames({ screen }) {
  return (
    <>
      <DCArtboard id={`${screen}-a`} label={`A · cockpit`} width={FRAME_W} height={FRAME_H}>
        <Frame screen={screen} direction="a" />
      </DCArtboard>
      <DCArtboard id={`${screen}-b`} label={`B · hero`} width={FRAME_W} height={FRAME_H}>
        <Frame screen={screen} direction="b" />
      </DCArtboard>
    </>
  );
}

function Frame({ screen, direction }) {
  const common = { theme: 'slate', accent: 'blue', density: 'comfortable', borderStyle: 'single', iconSet: 'nerd', cols: 140, rows: 40 };
  return (
    <TuiFrame {...common}>
      {screen === 'dashboard'  && <ScreenDashboard  direction={direction} iconSet="nerd" />}
      {screen === 'doctor'     && <ScreenDoctor     direction={direction} iconSet="nerd" />}
      {screen === 'recipes'    && <ScreenRecipes    direction={direction} iconSet="nerd" />}
      {screen === 'prompts'    && <ScreenPrompts    direction={direction} iconSet="nerd" />}
      {screen === 'launch'     && <ScreenLaunch     direction={direction} iconSet="nerd" />}
      {screen === 'config'     && <ScreenConfig     direction={direction} iconSet="nerd" />}
      {screen === 'palette'    && <ScreenPalette    direction={direction} iconSet="nerd" query="doc" />}
      {screen === 'onboarding' && <ScreenOnboarding direction={direction} iconSet="nerd" step={2} />}
    </TuiFrame>
  );
}

// Side notes card
function NotesPanel() {
  const SYS = window.TuiTokens.themes.slate;
  return (
    <div style={{
      width: 520, height: 840,
      background: SYS.bg,
      color: SYS.text,
      fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.5,
      padding: 32,
      boxSizing: 'border-box',
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      overflow: 'hidden',
    }}>
      <div>
        <div style={{ color: SYS.primary, fontSize: 18, fontWeight: 700 }}>two directions</div>
        <div style={{ color: SYS.textSec, marginTop: 4, fontSize: 13 }}>
          Same data, two opinions. A is the calm baseline; B is the opinionated take.
        </div>
      </div>

      <NoteBlock SYS={SYS} title="A · cockpit" tag="baseline">
        IDE-grade multi-pane layout. Key/value rails, single-line section
        dividers, focus border on active pane only. Dense but calm. Reads
        like <span style={{ color: SYS.text }}>gh + k9s</span>.
      </NoteBlock>

      <NoteBlock SYS={SYS} title="B · hero" tag="opinionated">
        Tinted hero band, severity heatmap, score ring, sparklines,
        regression banner. More graphic, more confident. Reads like
        <span style={{ color: SYS.text }}> Linear + Warp</span>.
      </NoteBlock>

      <NoteBlock SYS={SYS} title="motion rules" tag="subtle">
        180ms fade on pane swap. Spinner on running work. Animated
        sparkline draw on launch report. Nothing decorative.
      </NoteBlock>

      <NoteBlock SYS={SYS} title="responsive" tag="adaptive">
        Design baseline is 140×40. At 100×30 the multi-pane dashboard
        collapses to a two-pane stack; sub-tools drop the side rail.
        Status bar trims to 3 shortcuts. See the bottom of the canvas.
      </NoteBlock>

      <NoteBlock SYS={SYS} title="Ink hierarchy" tag="impl">
        <span style={{ color: SYS.textSec }}>
          {`<App>
  <Frame>
    <TopBar />
    <Workspace direction="row|col">
      <Pane focused?>
        <List | Diff | KV | Composer />
      </Pane>
    </Workspace>
    <StatusBar />
  </Frame>
  <PaletteOverlay? />
  <HelpOverlay? />
</App>`}
        </span>
      </NoteBlock>
    </div>
  );
}

function NoteBlock({ SYS, title, tag, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ color: SYS.text, fontWeight: 600 }}>{title}</span>
        {tag && <span style={{
          color: SYS.primary,
          fontSize: 11,
          padding: '0 6px',
          borderRadius: 3,
          background: SYS.primary + '14',
          border: `1px solid ${SYS.primary}55`,
          letterSpacing: 0.4,
        }}>{tag}</span>}
      </div>
      <div style={{ color: SYS.textSec, fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {children}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CanvasApp />);
