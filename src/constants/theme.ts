import type { Category } from '@/types/reminder'

export const colors = {
  bg:               '#0D0E16',
  surface:          '#161820',
  surfaceElevated:  '#1C1E2A',
  border:           '#2A2B3A',
  primary:          '#00C9C8',
  primaryLight:     '#4EDDDC',
  primarySubtle:    'rgba(0,201,200,0.12)',
  positive:         '#10B981',
  negative:         '#F97316',
  textPrimary:      '#FFFFFF',
  textSecondary:    '#C4C4D4',
  textMuted:        '#5A5B6E',
}

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const, color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
export const radius  = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 }

export const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#8B5CF6',
  Work:     '#3B82F6',
  Health:   '#10B981',
  Social:   '#F59E0B',
}
