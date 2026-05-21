/* TUI design tokens — single source of truth.
   Exposes: window.TuiTokens = { themes, density, accents, borderStyles, iconSets, glyph(name, set), themeWithAccent } */

(function () {
  // ---------- themes ----------
  // Midnight is the user-specified baseline palette.
  // Graphite = darker/neutral. Slate = lighter dark with more blue.
  const themes = {
    midnight: {
      name: 'Midnight',
      bg: '#0B1020',
      panel: '#111827',
      elevated: '#172033',
      border: '#263247',
      borderSoft: '#1B2536',
      primary: '#4F8CFF',
      secondary: '#3CCFCF',
      success: '#5BC680',
      warning: '#E6B450',
      danger: '#E06C75',
      text: '#E6EDF3',
      textSec: '#9FB0C0',
      textMuted: '#6B7A90',
      selection: '#1E2A44',
      selectionStrong: '#243454',
      focusBorder: '#4F8CFF',
      shadow: '0 6px 24px rgba(0,0,0,0.35)',
    },
    graphite: {
      name: 'Graphite',
      bg: '#08090C',
      panel: '#0F1116',
      elevated: '#161A22',
      border: '#222831',
      borderSoft: '#171B22',
      primary: '#4F8CFF',
      secondary: '#3CCFCF',
      success: '#5BC680',
      warning: '#E6B450',
      danger: '#E06C75',
      text: '#E6EDF3',
      textSec: '#A0A6B0',
      textMuted: '#6A707A',
      selection: '#1A1F28',
      selectionStrong: '#222A36',
      focusBorder: '#4F8CFF',
      shadow: '0 6px 24px rgba(0,0,0,0.45)',
    },
    slate: {
      name: 'Slate',
      bg: '#0F1623',
      panel: '#172033',
      elevated: '#1E2A44',
      border: '#2C3A52',
      borderSoft: '#1F2A40',
      primary: '#6FA8F0',
      secondary: '#3CCFCF',
      success: '#5BC680',
      warning: '#E6B450',
      danger: '#E06C75',
      text: '#EAF1F8',
      textSec: '#A8B7CA',
      textMuted: '#788698',
      selection: '#243454',
      selectionStrong: '#2C3F66',
      focusBorder: '#6FA8F0',
      shadow: '0 6px 24px rgba(0,0,0,0.3)',
    },
  };

  // ---------- density ----------
  const density = {
    compact:     { lineHeight: 1.25, padX: 14, padY: 10, gap: 6,  rowGap: 2,  fontPx: 13 },
    comfortable: { lineHeight: 1.45, padX: 18, padY: 14, gap: 10, rowGap: 4,  fontPx: 14 },
    roomy:       { lineHeight: 1.65, padX: 24, padY: 18, gap: 14, rowGap: 6,  fontPx: 14 },
  };

  // ---------- accents (override primary hue) ----------
  // Lock chroma/lightness, only hue varies. Restrained per brief.
  const accents = {
    blue:   { primary: '#4F8CFF', secondary: '#3CCFCF' },
    cyan:   { primary: '#3CCFCF', secondary: '#4F8CFF' },
    green:  { primary: '#5BC680', secondary: '#3CCFCF' },
    violet: { primary: '#8C7DFF', secondary: '#3CCFCF' },
    amber:  { primary: '#E6B450', secondary: '#4F8CFF' },
  };

  // ---------- border styles ----------
  const borderStyles = {
    minimal: { style: 'minimal' },     // tint + focus ring only
    single:  { style: 'single' },       // 1px solid border on every pane
    double:  { style: 'double' },       // double-rule on focused pane
    none:    { style: 'none' },         // background tint only
  };

  // ---------- icon / glyph sets ----------
  // Forge needs: bullet, severity-high/med/low, check, cross, arrow, branch, folder,
  //              chevron, dot-status, spinner, plus, ellipsis, diff-add, diff-del.
  const iconSets = {
    'nerd':    { // assume Nerd Font is installed -> use private-use codepoints visually approximated with unicode
      bullet: '●', high: '◆', med: '◆', low: '◇', check: '✓', cross: '✕', arrow: '→',
      branch: '', folder: '', chevron: '›', dot: '●', spin: '◐', plus: '＋',
      ellipsis: '…', diffAdd: '＋', diffDel: '－', warn: '▲', info: 'ⓘ', star: '★',
      forge: '', wrench: '', pkg: '', clock: '', terminal: '',
    },
    'unicode': {
      bullet: '●', high: '●', med: '●', low: '○', check: '✓', cross: '✕', arrow: '→',
      branch: '⎇', folder: '▾', chevron: '›', dot: '●', spin: '◐', plus: '＋',
      ellipsis: '…', diffAdd: '＋', diffDel: '－', warn: '▲', info: 'ⓘ', star: '★',
      forge: '◆', wrench: '✺', pkg: '◫', clock: '◷', terminal: '▶',
    },
    'ascii': {
      bullet: '*', high: '!', med: '.', low: '.', check: 'v', cross: 'x', arrow: '->',
      branch: '^', folder: '+', chevron: '>', dot: '*', spin: '-', plus: '+',
      ellipsis: '...', diffAdd: '+', diffDel: '-', warn: '!', info: 'i', star: '*',
      forge: '#', wrench: '*', pkg: '[]', clock: 'o', terminal: '>',
    },
  };

  function glyph(name, set = 'unicode') {
    return (iconSets[set] || iconSets.unicode)[name] || '';
  }

  // Apply accent override on top of a theme
  function themeWithAccent(themeKey, accentKey) {
    const t = themes[themeKey] || themes.midnight;
    const a = accents[accentKey];
    if (!a) return { ...t };
    return { ...t, primary: a.primary, secondary: a.secondary, focusBorder: a.primary };
  }

  window.TuiTokens = { themes, density, accents, borderStyles, iconSets, glyph, themeWithAccent };
})();
