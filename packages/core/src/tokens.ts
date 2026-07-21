// ── Design tokens ────────────────────────────────────────────
// Transcribed from src/tokens.css into plain JS so both the web app
// (inline styles / CSS vars) and the RN app (StyleSheet / ThemeProvider)
// consume one source of truth. Values are copied, not redesigned.
//
// RN has no `color-mix()`, so the two mixed values used in the UI
// (frosted tab-bar background, skeleton shimmer) are precomputed here as
// rgba equivalents per theme.

export interface ThemeColors {
  paper: string;
  surface: string;
  elevated: string;
  ink: string;
  muted: string;
  faint: string;
  hairline: string;

  brand: string;
  brandHover: string;
  brandTint: string;

  gold: string;
  goldHover: string;
  goldTint: string;

  success: string;
  successTint: string;
  warning: string;
  warningTint: string;
  danger: string;
  dangerTint: string;
  steel: string;
  steelTint: string;
  live: string;

  focus: string;

  // Precomputed color-mix() equivalents (no color-mix in RN)
  tabBarBg: string; // frosted surface for the bottom tab bar
  skeletonBase: string; // hairline @ 55%
  skeletonHighlight: string; // hairline @ 18%

  shadowRest: string;
  shadowRaise: string;
}

export const font = {
  display: "'Fraunces', Georgia, serif",
  ui: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', monospace",
} as const;

/** 4px spacing grid. */
export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s6: 24,
  s8: 32,
  s12: 48,
} as const;

export const radius = {
  cal: 4,
  btn: 8,
  card: 12,
  pill: 9999,
} as const;

/** Motion durations, in milliseconds. */
export const duration = {
  instant: 80,
  fast: 120,
  base: 200,
  slow: 320,
  deliberate: 480,
} as const;

export const easing = {
  standard: 'cubic-bezier(.2,0,0,1)',
  enter: 'cubic-bezier(0,0,0,1)',
  exit: 'cubic-bezier(.3,0,1,1)',
  spring: 'cubic-bezier(.34,1.56,.64,1)',
} as const;

/** Light theme — Admin + Athlete. */
export const light: ThemeColors = {
  paper: '#F3F6FB',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  ink: '#1C2A44',
  muted: '#4E6888',
  faint: '#7A90A8',
  hairline: '#D0DAEA',

  brand: '#1C2A44',
  brandHover: '#0F1E35',
  brandTint: '#E4EBF7',

  gold: '#C9A252',
  goldHover: '#B8912E',
  goldTint: '#F6EDD5',

  success: '#1E7A4C',
  successTint: '#E8F3EC',
  warning: '#B5791A',
  warningTint: '#FBF1DC',
  danger: '#9B2020',
  dangerTint: '#FBEBEC',
  steel: '#4A6080',
  steelTint: '#E4EBF5',
  live: '#E23B3B',

  focus: 'rgba(28,42,68,0.40)',

  tabBarBg: 'rgba(255,255,255,0.72)',
  skeletonBase: 'rgba(208,218,234,0.55)',
  skeletonHighlight: 'rgba(208,218,234,0.18)',

  shadowRest: '0 1px 2px rgba(28,42,68,.07)',
  shadowRaise: '0 8px 24px rgba(28,42,68,.12)',
};

/** Dark theme — Coach console at the salle. */
export const dark: ThemeColors = {
  paper: '#0C1A2E',
  surface: '#1C2A44',
  elevated: '#243659',
  ink: '#EEE8D8',
  muted: '#8BA0BC',
  faint: '#516A85',
  hairline: '#283D5C',

  brand: '#C9A252',
  brandHover: '#D4AD62',
  brandTint: '#2A2010',

  gold: '#C9A252',
  goldHover: '#D4AD62',
  goldTint: '#2A2010',

  success: '#34A06A',
  successTint: '#16271E',
  warning: '#E0A93A',
  warningTint: '#2A2210',
  danger: '#E2616C',
  dangerTint: '#2A1618',
  steel: '#7E8CA8',
  steelTint: '#1B2A40',
  live: '#FF5A5A',

  focus: 'rgba(201,162,82,0.45)',

  tabBarBg: 'rgba(28,42,68,0.72)',
  skeletonBase: 'rgba(40,61,92,0.55)',
  skeletonHighlight: 'rgba(40,61,92,0.18)',

  shadowRest: '0 1px 2px rgba(0,0,0,.35)',
  shadowRaise: '0 8px 24px rgba(0,0,0,.50)',
};

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
  font: typeof font;
  space: typeof space;
  radius: typeof radius;
  duration: typeof duration;
  easing: typeof easing;
}

export const lightTheme: Theme = { name: 'light', colors: light, font, space, radius, duration, easing };
export const darkTheme: Theme = { name: 'dark', colors: dark, font, space, radius, duration, easing };

export const themes = { light: lightTheme, dark: darkTheme } as const;
