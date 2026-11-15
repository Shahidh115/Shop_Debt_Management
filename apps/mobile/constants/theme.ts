import { COLORS } from '@shopledger/shared';

export const MOBILE_THEME = {
  colors: COLORS,
  radius: {
    card: 14,
    input: 10,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
  },
  minTouchTarget: 48,
} as const;

