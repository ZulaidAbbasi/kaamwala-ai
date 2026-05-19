// src/components/ui/theme.ts
// KaamWala AI Design System — Based on Google Stitch design
// Color palette, typography, spacing, shadows

export const colors = {
  // Primary — Deep Emerald
  primary: '#10B981',
  primaryDark: '#064E3B',
  primaryLight: '#065F46',
  primaryMuted: '#0B513D',

  // Secondary — Teal
  secondary: '#06B6D4',
  secondaryLight: 'rgba(6,182,212,0.15)',
  secondaryMuted: '#0D9488',

  // Tertiary — Purple (AI/Agentic)
  tertiary: '#8B5CF6',
  tertiaryDark: '#7C3AED',
  tertiaryLight: 'rgba(139,92,246,0.12)',
  tertiaryMuted: 'rgba(139,92,246,0.2)',

  // Surfaces — Dark mode
  background: '#0B0F1A',
  surface: 'rgba(255,255,255,0.06)',
  surfaceContainer: 'rgba(255,255,255,0.04)',
  surfaceContainerHigh: 'rgba(255,255,255,0.08)',

  // Text — Light on dark
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',
  textOnTertiary: '#FFFFFF',

  // Status
  success: '#10B981',
  successLight: 'rgba(16,185,129,0.15)',
  successBorder: 'rgba(16,185,129,0.3)',

  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.12)',
  warningBorder: 'rgba(245,158,11,0.3)',

  error: '#F43F5E',
  errorLight: 'rgba(244,63,94,0.12)',
  errorBorder: 'rgba(244,63,94,0.3)',

  info: '#3B82F6',
  infoLight: 'rgba(59,130,246,0.12)',
  infoBorder: 'rgba(59,130,246,0.3)',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',

  // Score bars
  scoreTrack: 'rgba(255,255,255,0.06)',
  scoreFill: '#06B6D4',

  // Accent
  amber: '#F59E0B',
  amberLight: 'rgba(245,158,11,0.12)',
} as const;

export const typography = {
  headlineLg: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.24,
    color: colors.textPrimary,
  },
  headlineMd: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  headlineSm: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  labelSm: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
  },
  mono: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
    fontFamily: 'monospace',
    color: colors.textPrimary,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
};
