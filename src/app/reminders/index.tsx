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
import Animated, { FadeIn } from 'react-native-reanimated'
import { useReminders } from '@/hooks/useReminders'
import { ReminderCard } from '@/components/ReminderCard'
import { EmptyState } from '@/components/EmptyState'
import { FAB } from '@/components/FAB'
import { UpcomingPanel } from '@/components/UpcomingPanel'
import { colors, spacing, typography } from '@/constants/theme'
import { getGreeting } from '@/utils/date'
import type { Reminder } from '@/types/reminder'

type Group = { title: string; data: Reminder[] }

export default function RemindersScreen() {
  const router = useRouter()
  const {
    reminders,
    loading,
    overdue,
    todayItems,
    tomorrowItems,
    laterItems,
    upcoming24h,
    pending,
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

  const groups = useMemo<Group[]>(() => {
    const g: Group[] = []
    if (overdue.length) g.push({ title: 'OVERDUE', data: overdue })
    if (todayItems.length) g.push({ title: 'TODAY', data: todayItems })
    if (tomorrowItems.length) g.push({ title: 'TOMORROW', data: tomorrowItems })
    if (laterItems.length) g.push({ title: 'UPCOMING', data: laterItems })
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
        <View>
          <Text style={typography.h1}>{getGreeting()}</Text>
          <Text style={styles.subheading}>
            {pending.length === 0
              ? 'Nothing pending'
              : `${pending.length} reminder${pending.length === 1 ? '' : 's'} pending`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/history')}
          style={styles.historyBtn}
        >
          <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Upcoming 24h panel */}
      {upcoming24h.length > 0 && (
        <UpcomingPanel reminders={upcoming24h} />
      )}

      {/* Main list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupHeader}>{group.title}</Text>
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
            </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  subheading: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  historyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    flexGrow: 1,
  },
  group: { marginBottom: spacing.lg },
  groupHeader: {
    ...typography.label,
    marginBottom: spacing.sm,
    paddingLeft: 2,
    color: colors.textMuted,
  },
})
