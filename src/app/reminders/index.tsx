import React, { useMemo } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useReminders } from '@/hooks/useReminders'
import { ReminderCard } from '@/components/ReminderCard'
import { EmptyState } from '@/components/EmptyState'
import { FAB } from '@/components/FAB'
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
    upcoming24h,
    markComplete,
    markDismissed,
    deleteReminder,
    refresh,
  } = useReminders()

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  // Next reminder within 2 hours for the inline pill
  const upNextReminder = useMemo(() => {
    const cutoff = Date.now() + 2 * 60 * 60 * 1000
    return upcoming24h.find(
      (r) => new Date(r.scheduledAt).getTime() <= cutoff
    ) ?? null
  }, [upcoming24h])

  const groups = useMemo<Group[]>(() => {
    const g: Group[] = []
    if (overdue.length)    g.push({ title: 'Overdue',  data: overdue,      accent: colors.negative })
    if (todayItems.length) g.push({ title: 'Today',    data: todayItems,   accent: colors.primary })
    if (tomorrowItems.length) g.push({ title: 'Tomorrow', data: tomorrowItems })
    if (laterItems.length) g.push({ title: 'Upcoming', data: laterItems })
    return g
  }, [overdue, todayItems, tomorrowItems, laterItems])

  const handleEdit = (id: string) => {
    router.push({ pathname: '/edit', params: { id } })
  }

  if (loading) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subheading}>
              {pending.length === 0
                ? 'Nothing pending'
                : `${pending.length} reminder${pending.length === 1 ? '' : 's'} pending`}
            </Text>
            {upNextReminder && (
              <View style={styles.upNextPill}>
                <Ionicons name="time-outline" size={11} color={colors.primary} />
                <Text style={styles.upNextText} numberOfLines={1}>
                  {upNextReminder.title}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/history')}
          style={styles.historyBtn}
        >
          <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main list */}
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
              entering={FadeInDown.delay(gi * 60).springify()}
              style={styles.group}
            >
              <View style={styles.groupHeaderRow}>
                {group.accent && (
                  <View style={[styles.groupAccentBar, { backgroundColor: group.accent }]} />
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
                  onEdit={handleEdit}
                />
              ))}
            </Animated.View>
          ))
        )}
      </ScrollView>

      <FAB onPress={() => router.push('/create')} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerLeft: { flex: 1, gap: 4 },
  greeting: {
    ...typography.h1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  subheading: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  upNextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 160,
  },
  upNextText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  historyBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    flexGrow: 1,
  },
  group: { marginBottom: spacing.xl },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupAccentBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.2,
    flex: 1,
  },
  groupCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
})
