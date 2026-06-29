export const colors = {
  bg: '#0F0D0A',
  surface: '#1A1714',
  surfaceElevated: '#252119',
  border: '#2C271F',
  primary: '#F59E0B',
  primaryLight: '#FCD34D',
  primarySubtle: 'rgba(245,158,11,0.12)',
  positive: '#10B981',
  negative: '#F97316',
  textPrimary: '#FAF7F2',
  textSecondary: '#A8998A',
  textMuted: '#5C5145',
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
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 }
