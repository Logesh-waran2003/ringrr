import React, { useMemo } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useReminders } from '@/hooks/useReminders'
import { ReminderCard } from '@/components/ReminderCard'
import { EmptyState } from '@/components/EmptyState'
import { colors, spacing, typography, radius } from '@/constants/theme'
import { getGreeting } from '@/utils/date'
import type { Reminder } from '@/types/reminder'

type Group = { title: string; data: Reminder[]; accent?: string }

export default function RemindersScreen() {
  const router = useRouter()
  const {
    loading,
    overdue,
    todayItems,
    tomorrowItems,
    laterItems,
    pending,
    history,
    upcoming24h,
    markComplete,
    deleteReminder,
    refresh,
  } = useReminders()

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  const completedToday = useMemo(() => {
    const today = new Date().toDateString()
    return history.filter(
      (r) => new Date(r.scheduledAt).toDateString() === today
    ).length
  }, [history])

  const upNext = useMemo(() => {
    const cutoff = Date.now() + 2 * 60 * 60 * 1000
    return upcoming24h.find(
      (r) => new Date(r.scheduledAt).getTime() <= cutoff
    ) ?? null
  }, [upcoming24h])

  const groups = useMemo<Group[]>(() => {
    const g: Group[] = []
    if (overdue.length)       g.push({ title: 'Overdue',   data: overdue,       accent: colors.negative })
    if (todayItems.length)    g.push({ title: 'Today',     data: todayItems,    accent: colors.primary })
    if (tomorrowItems.length) g.push({ title: 'Tomorrow',  data: tomorrowItems })
    if (laterItems.length)    g.push({ title: 'Upcoming',  data: laterItems })
    return g
  }, [overdue, todayItems, tomorrowItems, laterItems])

  if (loading) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(350)} style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{pending.length}</Text>
            <Text style={styles.statLabel}>pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{completedToday}</Text>
            <Text style={styles.statLabel}>done today</Text>
          </View>
          {upNext && (
            <>
              <View style={styles.statDivider} />
              <View style={[styles.stat, { flex: 2 }]}>
                <Text style={[styles.statLabel, { color: colors.primary }]} numberOfLines={1}>
                  up next
                </Text>
                <Text style={[styles.statNum, { fontSize: 13, color: colors.primary }]} numberOfLines={1}>
                  {upNext.title}
                </Text>
              </View>
            </>
          )}
        </View>
      </Animated.View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map((group, gi) => (
            <Animated.View
              key={group.title}
              entering={FadeInDown.delay(gi * 50).springify()}
              style={styles.group}
            >
              <View style={styles.groupHeaderRow}>
                {group.accent && (
                  <View style={[styles.groupDot, { backgroundColor: group.accent }]} />
                )}
                <Text style={[
                  styles.groupHeader,
                  group.accent ? { color: group.accent } : null,
                ]}>
                  {group.title}
                </Text>
                <Text style={styles.groupCount}>{group.data.length}</Text>
              </View>

              {group.data.map((reminder, index) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  index={index}
                  onComplete={markComplete}
                  onDelete={deleteReminder}
                  onEdit={(id) => router.push({ pathname: '/edit', params: { id } })}
                />
              ))}
            </Animated.View>
          ))
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
    gap: spacing.sm,
  },
  greeting: {
    ...typography.h1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: {
    gap: 1,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
    flexGrow: 1,
  },
  group: { marginBottom: spacing.lg },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.3,
    flex: 1,
  },
  groupCount: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
})
