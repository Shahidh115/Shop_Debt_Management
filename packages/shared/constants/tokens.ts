/**
 * ShopLedger — Design System Tokens (Refined Emerald & Deep Pine Green Palette)
 * "Credit, with clarity. A calmer way to manage everyday shop credit."
 */

export const COLORS = {
  /** Primary Emerald Green (#1B7A4E) — Primary actions, active nav, primary brand surface */
  primary: '#1B7A4E',
  /** Deep Pine Green (#0F4C31) — Admin brand panels, deep headers, high-contrast surfaces */
  deep: '#0F4C31',
  /** Soft Mint Sage (#68B692) — Secondary fills, chart bars, subtle accents */
  soft: '#68B692',
  /** Light Mint Tint (#D1ECE0) — Pill backgrounds, active nav highlights, soft dividers */
  sage: '#D1ECE0',
  /** Clean Sage-White Canvas (#F4F8F6) — Primary canvas / page background across web & mobile */
  ivory: '#F4F8F6',
  /** Pure White (#FFFFFF) — Elevated cards, tables, modals, input backgrounds */
  white: '#FFFFFF',
  /** Deep Forest Charcoal (#16241D) — Primary typography, headings, financial figures */
  charcoal: '#16241D',
  /** Muted Slate-Sage (#5C6F65) — Secondary labels, metadata, timestamps, captions */
  muted: '#5C6F65',
  /** Crisp Sage Border (#DCE7E1) — Card borders, table dividers, input borders */
  border: '#DCE7E1',

  // Status & Semantic Tokens
  /** Paid / Active / Resolved / Credit received (#16804A) */
  paid: '#16804A',
  success: '#16804A',
  successSoft: '#E6F5EC',

  /** Pending / Under Review / Invited (#D99A32) */
  pending: '#D99A32',
  warning: '#D99A32',
  warningSoft: '#FDF6E9',

  /** Overdue / Suspended / Rejected / Danger (#C6534B) */
  overdue: '#C6534B',
  error: '#C6534B',
  errorSoft: '#FAEDEC',

  /** Disputed / Complaint Open (#D97736) */
  disputed: '#D97736',
  disputedSoft: '#FCF1E8',

  // Convenience Semantic Aliases used by Mobile & Admin components
  primaryOlive: '#1B7A4E',
  deepForestOlive: '#0F4C31',
  softSage: '#68B692',
  softTint: '#D1ECE0',
  warmIvory: '#F4F8F6',
  cardWhite: '#FFFFFF',
  charcoalText: '#16241D',
  mutedText: '#5C6F65',
  borderNeutral: '#DCE7E1',
  successBg: '#E6F5EC',
  warningBg: '#FDF6E9',
  danger: '#C6534B',
  dangerBg: '#FAEDEC',
  debitPurchase: '#D97736',
  creditPayment: '#16804A',
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  sizes: {
    heroFigure: 40,
    h1: 32,
    h2: 24,
    h3: 20,
    bodyLarge: 16,
    body: 14,
    caption: 12,
    overline: 11,
  },
  lineHeights: {
    heroFigure: 58,
    h1: 40,
    h2: 32,
    h3: 28,
    bodyLarge: 24,
    body: 20,
    caption: 16,
  },
} as const;

export const SPACING = {
  gridUnit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const LAYOUT = {
  cardRadius: 14,
  inputRadius: 12,
  buttonRadius: 12,
  touchTargetHeight: 48,
  inputHeight: 50,
  desktopFrame: { width: 1440, height: 1024 },
  tabletFrame: { width: 1024, height: 1024 },
  mobileFrame: { width: 390, height: 844 },
  mobileCompactFrame: { width: 360, height: 844 },
  safeAreas: { top: 44, bottom: 34 },
  adminSidebarWidth: 240,
  adminSidebarTabletWidth: 80,
} as const;

export const CURRENCY = {
  code: 'LKR',
  symbol: 'Rs.',
  locale: 'en-LK',
} as const;
