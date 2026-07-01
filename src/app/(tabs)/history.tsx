import React, { useMemo } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useReminders } from '@/hooks/useReminders'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { formatReminderDateTime } from '@/utils/date'
import type { Category } from '@/types/reminder'

const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#8B5CF6', Work: '#3B82F6', Health: '#10B981', Social: '#F59E0B',
}

export default function HistoryScreen() {
  const { history, deleteReminder } = useReminders()

  const sorted = useMemo(
    () => [...history].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    ),
    [history]
  )

  const completionRate = useMemo(() => {
    if (!history.length) return 0
    return Math.round(
      (history.filter((r) => r.status === 'completed').length / history.length) * 100
    )
  }, [history])

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Remove from History', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteReminder(id) },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View entering={FadeIn.duration(350)} style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          {history.length === 0
            ? 'Completed and dismissed reminders appear here'
            : `${history.length} reminder${history.length === 1 ? '' : 's'}`}
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyDash}>—</Text>
            <Text style={styles.emptyText}>Nothing here yet</Text>
          </View>
        ) : (
          <>
            {sorted.map((reminder, index) => {
              const isDone = reminder.status === 'completed'
              return (
                <Animated.View
                  key={reminder.id}
                  entering={FadeInDown.delay(index * 35).springify()}
                  style={styles.card}
                >
                  {/* Category dot */}
                  <View
                    style={[styles.dot, { backgroundColor: CATEGORY_COLORS[reminder.category] }]}
                  />

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {reminder.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {formatReminderDateTime(reminder.scheduledAt)}
                    </Text>
                  </View>

                  {/* Status pill */}
                  <View style={[styles.pill, isDone ? styles.pillDone : styles.pillDismissed]}>
                    <Text style={[styles.pillText, isDone ? styles.pillTextDone : styles.pillTextDismissed]}>
                      {isDone ? 'Done' : 'Dismissed'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(reminder.id, reminder.title)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                </Animated.View>
              )
            })}

            {/* Summary card */}
            {history.length >= 3 && (
              <Animated.View
                entering={FadeInDown.delay(sorted.length * 35 + 80).springify()}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryLabel}>Completion rate</Text>
                <Text style={styles.summaryRate}>{completionRate}%</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${completionRate}%` as any },
                    ]}
                  />
                </View>
                <Text style={styles.summaryMeta}>
                  {history.filter((r) => r.status === 'completed').length} completed
                  {'  ·  '}
                  {history.filter((r) => r.status === 'dismissed').length} dismissed
                </Text>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
  },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, color: colors.textSecondary, fontSize: 14 },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  cardContent: { flex: 1, gap: 2 },
  cardTitle: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    fontSize: 14,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  pillDone: {
    backgroundColor: '#10B981' + '20',
  },
  pillDismissed: {
    backgroundColor: colors.border,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pillTextDone: {
    color: '#10B981',
  },
  pillTextDismissed: {
    color: colors.textMuted,
  },
  deleteBtn: {
    flexShrink: 0,
    padding: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: 120,
  },
  emptyDash: {
    fontSize: 32,
    color: colors.textMuted,
    fontWeight: '300',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  summaryCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryRate: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 46,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.positive,
    borderRadius: 2,
  },
  summaryMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
})
