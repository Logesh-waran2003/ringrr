import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'

import { useReminders } from '@/hooks/useReminders'
import { loadReminders } from '@/services/storage'
import { colors, spacing, radius, typography } from '@/constants/theme'
import { formatReminderDateTime } from '@/utils/date'
import type { Reminder } from '@/types/reminder'

// Alarm-specific palette — slightly different from main app bg
const ALARM_BG = '#0D1E1E'
const ALARM_SURFACE = '#122020'
const TEAL = '#00C9C8'

/** Formats an ISO string to "8:00" style (no leading zero on hour) */
function formatAlarmTime(iso: string): { time: string; period: string } {
  const date = new Date(iso)
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return { time: `${hour12}:${minutes}`, period }
}

/** Formats an ISO string to "TUESDAY, OCT 24" style */
function formatAlarmDate(iso: string): string {
  const date = new Date(iso)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = date.getDate()
  return `${weekday}, ${month} ${day}`
}

/** Formats current time as "10:42 AM" */
function formatCurrentTime(): string {
  const now = new Date()
  return now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function AlarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { markDismissed, updateReminder } = useReminders()

  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [currentTime, setCurrentTime] = useState(formatCurrentTime())
  const [loading, setLoading] = useState(true)

  // Load reminder from storage
  useEffect(() => {
    if (!id) {
      router.back()
      return
    }
    ;(async () => {
      try {
        // Test mode — show a mock reminder without hitting storage
        if (id === '__test__') {
          setReminder({
            id: '__test__',
            title: 'Test Alarm',
            description: 'This is how your alarm looks and sounds',
            scheduledAt: new Date().toISOString(),
            category: 'Personal',
            status: 'pending',
            sound: { type: 'builtin', name: 'default' },
            notificationId: null,
            earlyNotificationId: null,
          } as any)
          setLoading(false)
          return
        }
        const all = await loadReminders()
        const found = all.find((r) => r.id === id) ?? null
        if (!found) {
          console.warn('[AlarmScreen] Reminder not found (may have been deleted):', id)
          router.back()
          return
        }
        setReminder(found)
      } catch (e) {
        console.error('[AlarmScreen] Failed to load reminder:', e)
        router.back()
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // Tick the status-bar clock every 30 s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatCurrentTime())
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  const handleSnooze = async () => {
    if (!reminder) return
    try {
      const snoozeDate = new Date(Date.now() + 5 * 60 * 1000)
      // Update the reminder's scheduledAt in storage — the hook's updateReminder
      // will cancel old notifications and reschedule with the correct alarm channel
      await updateReminder({
        ...reminder,
        scheduledAt: snoozeDate.toISOString(),
        status: 'pending',
      })
    } catch (e) {
      // Fallback: schedule notification directly if hook update fails
      // (e.g. reminder was deleted while alarm screen was open)
      console.warn('[AlarmScreen] Snooze via hook failed, scheduling directly:', e)
      try {
        const snoozeDate = new Date(Date.now() + 5 * 60 * 1000)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.description ?? 'Snoozed reminder',
            sound: true,
            data: { reminderId: reminder.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: snoozeDate,
            channelId: 'nudge-alarms-v2-default',
          } as Notifications.DateTriggerInput,
        })
      } catch (fallbackErr) {
        console.warn('[AlarmScreen] Snooze fallback also failed:', fallbackErr)
      }
    }
    router.back()
  }

  const handleDismiss = async () => {
    if (!reminder) return
    try {
      await markDismissed(reminder.id)
    } catch (e) {
      console.warn('[AlarmScreen] Dismiss failed:', e)
    }
    router.back()
  }

  if (loading || !reminder) return null

  const { time, period } = formatAlarmTime(reminder.scheduledAt)
  const dateLabel = formatAlarmDate(reminder.scheduledAt)

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Status bar row ── */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Ionicons name="notifications" size={12} color={TEAL} />
          <Text style={styles.ringingLabel}>RINGING</Text>
        </View>
        <Text style={styles.statusTime}>{currentTime}</Text>
      </View>

      {/* ── Bell icon ── */}
      <View style={styles.bellWrapper}>
        {/* Outer concentric ring */}
        <View style={styles.bellRingOuter} />
        {/* Inner concentric ring */}
        <View style={styles.bellRingInner} />
        {/* Filled circle with icon */}
        <View style={styles.bellCircle}>
          <Ionicons name="notifications" size={32} color={TEAL} />
        </View>
      </View>

      {/* ── Time display ── */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{time}</Text>
        <Text style={styles.periodText}>{period}</Text>
      </View>

      {/* ── Date ── */}
      <Text style={styles.dateText}>{dateLabel}</Text>

      {/* ── Reminder card ── */}
      <View style={styles.card}>
        {/* Left accent bar */}
        <View style={styles.cardAccent} />
        {/* Card content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {reminder.title}
          </Text>
          {!!reminder.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {reminder.description}
            </Text>
          )}
          <View style={styles.cardFooter}>
            <Ionicons name="repeat-outline" size={12} color={TEAL} />
            <Text style={styles.cardCategory}>{reminder.category}</Text>
          </View>
        </View>
      </View>

      {/* ── Spacer ── */}
      <View style={{ flex: 1 }} />

      {/* ── Snooze button ── */}
      <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze} activeOpacity={0.8}>
        <Ionicons name="alarm-outline" size={18} color="#fff" style={styles.snoozeBtnIcon} />
        <Text style={styles.snoozeBtnText}>Snooze 5 min</Text>
      </TouchableOpacity>

      {/* ── Dismiss button ── */}
      <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.8}>
        <Text style={styles.dismissBtnText}>✕  Dismiss</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ALARM_BG,
    alignItems: 'center',
    paddingHorizontal: 0,
  },

  // ── Status row ──
  statusRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ringingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEAL,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statusTime: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },

  // ── Bell ──
  bellWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  bellRingOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: TEAL + '40',
  },
  bellRingInner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: TEAL + '60',
  },
  bellCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ALARM_SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Time ──
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '700',
    color: TEAL,
    lineHeight: 76,
    letterSpacing: -2,
  },
  periodText: {
    fontSize: 20,
    fontWeight: '600',
    color: TEAL,
    marginTop: 10,
    marginLeft: 4,
  },

  // ── Date ──
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEAL,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xl,
  },

  // ── Card ──
  card: {
    flexDirection: 'row',
    width: '100%',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: ALARM_SURFACE,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  cardAccent: {
    width: 4,
    backgroundColor: TEAL,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    marginLeft: -spacing.md, // pull flush to card edge
    marginRight: spacing.md,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDescription: {
    fontSize: 13,
    color: '#aaaaaa',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: TEAL,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Snooze button ──
  snoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    alignSelf: 'stretch',
    height: 52,
    borderRadius: radius.full,
    backgroundColor: TEAL,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  snoozeBtnIcon: {
    position: 'absolute',
    left: spacing.lg,
  },
  snoozeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1E1E',
  },

  // ── Dismiss button ──
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    alignSelf: 'stretch',
    height: 52,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    marginBottom: spacing.md,
  },
  dismissBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
})
