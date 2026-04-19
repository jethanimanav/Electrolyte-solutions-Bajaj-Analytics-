// ============================================================
// Theme System v4 — Premium Light Mode + Unchanged Dark Mode
// Light mode: Stripe/Vercel/Notion-level quality
// ============================================================

export const darkTheme = {
  mode: 'dark',
  bg:        '#0b0f19',
  surface:   'linear-gradient(180deg, rgba(13,20,34,0.96) 0%, rgba(9,14,25,0.96) 100%)',
  surface2:  '#111827',
  navbarbg:  '#080e1a',
  border:    'rgba(148,163,184,0.14)',
  borderStr: 'rgba(148,163,184,0.25)',
  text1:     '#f1f5f9',
  text2:     '#94a3b8',
  text3:     '#64748b',
  text4:     '#475569',
  text5:     '#334155',
  blue:      '#3b82f6',
  blueLight: '#60a5fa',
  green:     '#22c55e',
  orange:    '#f59e0b',
  red:       '#ef4444',
  purple:    '#8b5cf6',
  purple2:   '#a78bfa',
  cyan:      '#38bdf8',
  accent:    '#3b82f6',
  accentLight: '#60a5fa',
  accentBg:  'rgba(59,130,246,0.1)',
  tooltipBg: '#0d1626',
  tooltipText: '#e2e8f0',
  ok:        '#22c55e',
  nff:       '#f59e0b',
  wip:       '#a78bfa',
  sidebarActive: 'rgba(59,130,246,0.12)',
  sidebarHover:  'rgba(255,255,255,0.04)',
  tableRow:  'transparent',
  tableRowAlt: 'rgba(255,255,255,0.015)',
  tableRowHover: 'rgba(59,130,246,0.05)',
  inputBg:   'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.08)',
  scrollThumb: 'rgba(255,255,255,0.1)',
  skeleton1: 'rgba(255,255,255,0.04)',
  skeleton2: 'rgba(255,255,255,0.08)',
  cardShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
  cardShadowHover: '0 4px 24px rgba(0,0,0,0.5)',
  muiMode: 'dark',
}

export const lightTheme = {
  mode: 'light',

  // ── Backgrounds ──────────────────────────────────────────
  // Clean off-white, not pure white — avoids harshness
  bg:        '#f5f7fa',
  bgAlt:     '#eef2f7',
  surface:   '#ffffff',
  surface2:  '#f8fafc',
  navbarbg:  '#ffffff',

  // ── Borders — crisp but not harsh ────────────────────────
  border:    'rgba(15,23,42,0.09)',
  borderStr: 'rgba(15,23,42,0.16)',
  borderFocus: 'rgba(37,99,235,0.5)',

  // ── Typography — WCAG AA compliant ────────────────────────
  // text1: headings/primary  ≥7:1 contrast on white
  // text2: body              ≥4.5:1
  // text3: secondary         ≥3:1
  // text4: tertiary/hint     ≥2.5:1 (non-body)
  // text5: disabled/muted
  text1:     '#0f172a',   // slate-900   contrast 19:1
  text2:     '#1e293b',   // slate-800   contrast 15:1
  text3:     '#334155',   // slate-700   contrast 9:1
  text4:     '#64748b',   // slate-500   contrast 4.6:1
  text5:     '#94a3b8',   // slate-400   contrast 2.8:1 (decorative)

  // ── Brand/Accent — electric blue (Stripe-like) ────────────
  blue:      '#2563eb',   // blue-600
  blueLight: '#3b82f6',   // blue-500
  blueBg:    'rgba(37,99,235,0.06)',
  blueBgStr: 'rgba(37,99,235,0.12)',
  accent:    '#2563eb',
  accentLight: '#3b82f6',
  accentBg:  'rgba(37,99,235,0.07)',

  // ── Semantic colors ────────────────────────────────────────
  green:     '#16a34a',   // green-600  — OK
  greenBg:   'rgba(22,163,74,0.08)',
  greenBorder: 'rgba(22,163,74,0.2)',

  orange:    '#d97706',   // amber-600  — NFF
  orangeBg:  'rgba(217,119,6,0.08)',
  orangeBorder: 'rgba(217,119,6,0.2)',

  purple:    '#7c3aed',   // violet-600 — WIP
  purpleBg:  'rgba(124,58,237,0.08)',
  purpleBorder: 'rgba(124,58,237,0.2)',

  red:       '#dc2626',   // red-600
  redBg:     'rgba(220,38,38,0.08)',
  cyan:      '#0284c7',   // sky-600
  purple2:   '#8b5cf6',

  // ── Status ────────────────────────────────────────────────
  ok:        '#16a34a',
  okBg:      'rgba(22,163,74,0.09)',
  okBorder:  'rgba(22,163,74,0.22)',
  okText:    '#14532d',   // even darker for better contrast

  nff:       '#d97706',
  nffBg:     'rgba(217,119,6,0.09)',
  nffBorder: 'rgba(217,119,6,0.22)',
  nffText:   '#78350f',

  wip:       '#7c3aed',
  wipBg:     'rgba(124,58,237,0.09)',
  wipBorder: 'rgba(124,58,237,0.22)',
  wipText:   '#4c1d95',

  // ── Charts ────────────────────────────────────────────────
  tooltipBg: '#0f172a',
  tooltipText: '#f1f5f9',
  chartGrid: 'rgba(15,23,42,0.07)',

  // ── Sidebar ───────────────────────────────────────────────
  sidebarBg:     '#ffffff',
  sidebarBorder: 'rgba(15,23,42,0.08)',
  sidebarActive: 'rgba(37,99,235,0.08)',
  sidebarActiveBorder: 'rgba(37,99,235,0.2)',
  sidebarHover:  'rgba(15,23,42,0.04)',
  sidebarActiveText: '#1d4ed8',
  sidebarActiveIcon: '#2563eb',

  // ── Table ────────────────────────────────────────────────
  tableHeader: '#f8fafc',
  tableHeaderText: '#374151',
  tableRow:  '#ffffff',
  tableRowAlt: '#f9fafb',
  tableRowHover: 'rgba(37,99,235,0.04)',
  tableBorder: 'rgba(15,23,42,0.08)',

  // ── Inputs ───────────────────────────────────────────────
  inputBg:     '#ffffff',
  inputBorder: 'rgba(15,23,42,0.18)',
  inputBorderFocus: '#2563eb',

  // ── Shadows — key differentiator for premium feel ─────────
  cardShadow:  '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.08)',
  cardShadowHover: '0 4px 16px rgba(15,23,42,0.12), 0 8px 24px rgba(15,23,42,0.08)',
  chipShadow:  '0 1px 2px rgba(15,23,42,0.08)',

  // ── Misc ─────────────────────────────────────────────────
  scrollThumb: 'rgba(15,23,42,0.18)',
  skeleton1: 'rgba(15,23,42,0.05)',
  skeleton2: 'rgba(15,23,42,0.09)',
  muiMode: 'light',
}
