import React from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useReminders } from '@/hooks/useReminders'
import { colors, radius, spacing, typography, CATEGORY_COLORS } from '@/constants/theme'
import { formatReminderDateTime } from '@/utils/date'
import type { Category } from '@/types/reminder'

export default function HistoryScreen() {
  const router = useRouter()
  const { history, deleteReminder } = useReminders()

  const sorted = [...history].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  )

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Remove from History', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteReminder(id) },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No history yet</Text>
          </View>
        ) : (
          sorted.map((reminder, index) => (
            <Animated.View
              key={reminder.id}
              entering={FadeInDown.delay(index * 40).springify()}
              style={styles.card}
            >
              <View
                style={[styles.dot, { backgroundColor: CATEGORY_COLORS[reminder.category] }]}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{reminder.title}</Text>
                <Text style={styles.cardMeta}>
                  {formatReminderDateTime(reminder.scheduledAt)}
                  {'  ·  '}
                  <Text
                    style={{
                      color:
                        reminder.status === 'completed' ? colors.positive : colors.textMuted,
                    }}
                  >
                    {reminder.status === 'completed' ? 'Completed' : 'Dismissed'}
                  </Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(reminder.id, reminder.title)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: typography.h3,
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  cardContent: { flex: 1 },
  cardTitle: { ...typography.body, color: colors.textMuted, textDecorationLine: 'line-through' },
  cardMeta: { ...typography.caption, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: 120 },
  emptyText: { ...typography.body, color: colors.textMuted },
})
