import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors, radius, spacing, typography, CATEGORY_COLORS } from '@/constants/theme'
import { formatReminderDateTime } from '@/utils/date'
import type { Reminder, Category } from '@/types/reminder'

interface UpcomingPanelProps {
  reminders: Reminder[]
}

export function UpcomingPanel({ reminders }: UpcomingPanelProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <Text style={styles.title}>NEXT 24 HOURS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {reminders.map((r) => (
          <View key={r.id} style={styles.chip}>
            <View
              style={[
                styles.dot,
                { backgroundColor: CATEGORY_COLORS[r.category] },
              ]}
            />
            <View>
              <Text style={styles.chipTitle} numberOfLines={1}>
                {r.title}
              </Text>
              <Text style={styles.chipTime}>
                {formatReminderDateTime(r.scheduledAt)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  list: { gap: spacing.sm, paddingRight: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    maxWidth: 180,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  chipTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chipTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
})
