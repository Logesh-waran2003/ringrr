import React, { useMemo } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { useReminders } from '@/hooks/useReminders'
import { EmptyState } from '@/components/EmptyState'
import { colors, spacing, radius } from '@/constants/theme'
import { getGreeting } from '@/utils/date'
import type { Reminder, Category } from '@/types/reminder'

// ── Category accent colours ──────────────────────────────────────────────────
const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#8B5CF6',
  Work:     '#3B82F6',
  Health:   colors.positive,
  Social:   '#F59E0B',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTimePill(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatHeaderDate(): string {
  const now = new Date()
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' })
  const date    = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${weekday}, ${date}`
}

// ── Test Alarm helper ─────────────────────────────────────────────────────────
async function fireTestAlarm() {
  // Schedule notification 5s from now — tests DND bypass + sound
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Test Alarm',
      body: 'This is how your alarm sounds',
      sound: true,
      sticky: true,
      data: { reminderId: '__test__' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + 5000),
      channelId: 'nudge-alarms-v2',
    } as Notifications.DateTriggerInput,
  })
}

// ── Timeline Card ─────────────────────────────────────────────────────────────
interface TimelineCardProps {
  reminder: Reminder
  index:    number
  onComplete: (id: string) => void
  onEdit:     (id: string) => void
}

function TimelineCard({ reminder, index, onComplete, onEdit }: TimelineCardProps) {
  const accent = CATEGORY_COLORS[reminder.category] ?? colors.primary
  const isOverdue = new Date(reminder.scheduledAt).getTime() < Date.now() && reminder.status === 'pending'

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.timelineCard}
        onPress={() => onEdit(reminder.id)}
      >
        {/* Left accent bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: isOverdue ? colors.negative : accent }]} />

        <View style={styles.cardBody}>
          {/* Time pill */}
          <View style={[styles.timePill, isOverdue && styles.timePillOverdue]}>
            <Text style={[styles.timePillText, isOverdue && styles.timePillTextOverdue]}>
              {formatTimePill(reminder.scheduledAt)}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {reminder.title}
          </Text>

          {/* Description */}
          {!!reminder.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {reminder.description}
            </Text>
          )}

          {/* Footer: complete button only */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => onComplete(reminder.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter()
  const {
    loading,
    overdue,
    todayItems,
    tomorrowItems,
    laterItems,
    pending,
    history,
    refresh,
    markComplete,
    deleteReminder,
  } = useReminders()

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  // Completed today count
  const completedToday = useMemo(() => {
    const today = new Date().toDateString()
    return history.filter(
      (r) => new Date(r.scheduledAt).toDateString() === today
    ).length
  }, [history])

  // Flat timeline: merge all groups, sort by scheduledAt
  const timeline = useMemo<Reminder[]>(() => {
    return [...overdue, ...todayItems, ...tomorrowItems, ...laterItems].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
  }, [overdue, todayItems, tomorrowItems, laterItems])

  // Donut ring progress
  const totalToday   = todayItems.length + completedToday
  const completionPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  if (loading) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar ──────────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="menu" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.brandName}>Ringr</Text>

          <View style={styles.topBarRight}>
            {/* Test alarm button */}
            <TouchableOpacity
              style={styles.testAlarmBtn}
              onPress={async () => {
                await fireTestAlarm()
                router.push({ pathname: '/alarm', params: { id: '__test__' } })
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              <Text style={styles.testAlarmLabel}>Test</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarBtn}>
              <Ionicons name="person-circle" size={32} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Dashboard header ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.dashHeader}>
          <Text style={styles.dashLabel}>DASHBOARD OVERVIEW</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.dateText}>{formatHeaderDate()}</Text>
        </Animated.View>

        {/* ── Progress + Stats row ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.progressRow}>
          {/* Donut ring */}
          <View style={styles.donutWrap}>
            <View style={styles.donutRing}>
              <Text style={styles.donutPct}>{completionPct}%</Text>
              <Text style={styles.donutCompleted}>Completed</Text>
              <Text style={styles.donutGoal}>Daily Goal</Text>
            </View>
          </View>

          {/* Stat tiles */}
          <View style={styles.statTiles}>
            {/* Upcoming */}
            <View style={styles.statTile}>
              <View style={styles.statTileIcon}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.statTileLabel}>Upcoming</Text>
              <Text style={styles.statTileNum}>{pending.length}</Text>
            </View>

            {/* Done Today */}
            <View style={styles.statTile}>
              <View style={styles.statTileIcon}>
                <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.statTileLabel}>Done Today</Text>
              <Text style={styles.statTileNum}>{completedToday}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Your Timeline ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Timeline</Text>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Timeline cards */}
        {timeline.length === 0 ? (
          <EmptyState />
        ) : (
          timeline.map((reminder, index) => (
            <TimelineCard
              key={reminder.id}
              reminder={reminder}
              index={index}
              onComplete={markComplete}
              onEdit={(id) => router.push({ pathname: '/edit', params: { id } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },

  // Top bar
  topBar: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop:      spacing.sm,
    paddingBottom:   spacing.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize:    22,
    fontWeight:  '700',
    color:       colors.primary,
    letterSpacing: -0.3,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  testAlarmBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    backgroundColor: colors.primarySubtle,
    borderRadius:   radius.full,
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  testAlarmLabel: {
    fontSize:   11,
    fontWeight: '600',
    color:      colors.primary,
    letterSpacing: 0.3,
  },

  // Dashboard header
  dashHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.lg,
    gap:               4,
  },
  dashLabel: {
    fontSize:      10,
    fontWeight:    '600',
    color:         colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom:  spacing.xs,
  },
  greeting: {
    fontSize:      28,
    fontWeight:    '700',
    color:         colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight:    34,
  },
  dateText: {
    fontSize:   13,
    fontWeight: '400',
    color:      colors.textMuted,
    marginTop:  2,
  },

  // Progress row
  progressRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.lg,
    gap:               spacing.md,
    marginBottom:      spacing.lg,
  },

  // Donut
  donutWrap: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  donutRing: {
    width:          120,
    height:         120,
    borderRadius:   60,
    borderWidth:    10,
    borderColor:    colors.primary,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  donutPct: {
    fontSize:   22,
    fontWeight: '700',
    color:      colors.textPrimary,
    lineHeight: 26,
  },
  donutCompleted: {
    fontSize:   10,
    fontWeight: '500',
    color:      colors.textSecondary,
    marginTop:  2,
  },
  donutGoal: {
    fontSize:   9,
    fontWeight: '400',
    color:      colors.textMuted,
  },

  // Stat tiles
  statTiles: {
    flex: 1,
    gap:  spacing.sm,
  },
  statTile: {
    backgroundColor: colors.surfaceElevated,
    borderRadius:    radius.md,
    padding:         spacing.md,
    flex:            1,
    gap:             4,
  },
  statTileIcon: {
    width:          32,
    height:         32,
    borderRadius:   radius.sm,
    backgroundColor: colors.primarySubtle,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   2,
  },
  statTileLabel: {
    fontSize:   11,
    fontWeight: '500',
    color:      colors.textMuted,
    letterSpacing: 0.3,
  },
  statTileNum: {
    fontSize:   24,
    fontWeight: '700',
    color:      colors.textPrimary,
    lineHeight: 28,
  },

  // Section header
  sectionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom:      spacing.md,
  },
  sectionTitle: {
    fontSize:   17,
    fontWeight: '600',
    color:      colors.textPrimary,
  },
  viewAllText: {
    fontSize:      11,
    fontWeight:    '600',
    color:         colors.primary,
    letterSpacing: 0.8,
  },

  // Timeline card
  timelineCard: {
    flexDirection:     'row',
    marginHorizontal:  spacing.lg,
    marginBottom:      spacing.sm,
    borderRadius:      radius.md,
    backgroundColor:   colors.surfaceElevated,
    borderWidth:       1,
    borderColor:       colors.border,
    overflow:          'hidden',
  },
  cardAccentBar: {
    width:           3,
    borderTopLeftRadius:    radius.md,
    borderBottomLeftRadius: radius.md,
  },
  cardBody: {
    flex:    1,
    padding: spacing.md,
    gap:     6,
  },
  timePill: {
    alignSelf:         'flex-start',
    backgroundColor:   colors.border,
    borderRadius:      radius.full,
    paddingHorizontal: 10,
    paddingVertical:   3,
  },
  timePillOverdue: {
    backgroundColor: 'rgba(249,115,22,0.2)',
  },
  timePillText: {
    fontSize:      11,
    fontWeight:    '600',
    color:         colors.textSecondary,
    letterSpacing: 0.2,
  },
  timePillTextOverdue: {
    color: colors.negative,
  },
  cardTitle: {
    fontSize:   15,
    fontWeight: '600',
    color:      colors.textPrimary,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize:   13,
    fontWeight: '400',
    color:      colors.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:       2,
  },
  categoryChip: {
    borderWidth:       1,
    borderRadius:      radius.full,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  categoryChipText: {
    fontSize:   10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  completeBtn: {
    padding: 2,
  },
})
