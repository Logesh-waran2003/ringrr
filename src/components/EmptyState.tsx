import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { colors, spacing, typography } from '@/constants/theme'

export function EmptyState() {
  return (
    <Animated.View entering={FadeIn.delay(150)} style={styles.container}>
      <Text style={styles.dash}>—</Text>
      <Text style={styles.title}>Nothing scheduled</Text>
      <Text style={styles.subtitle}>Tap + to add a reminder</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: spacing.xs,
  },
  dash: {
    fontSize: 32,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontWeight: '300',
  },
  title: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
})
