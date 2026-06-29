import React, { useCallback } from 'react'
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '@/constants/theme'
import type { Reminder, Category } from '@/types/reminder'
import { formatReminderDateTime } from '@/utils/date'

const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#8B5CF6',
  Work:     '#3B82F6',
  Health:   '#10B981',
  Social:   '#F59E0B',
}

const SWIPE_THRESHOLD = -80

interface ReminderCardProps {
  reminder: Reminder
  index: number
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}

export function ReminderCard({
  reminder,
  index,
  onComplete,
  onDelete,
  onEdit,
}: ReminderCardProps) {
  const translateX = useSharedValue(0)
  const opacity    = useSharedValue(1)

  const isCompleted = reminder.status === 'completed'
  const isDismissed = reminder.status === 'dismissed'
  const isDone      = isCompleted || isDismissed
  const isOverdue   = reminder.status === 'pending' &&
    new Date(reminder.scheduledAt).getTime() <= Date.now()

  const accentColor = CATEGORY_COLORS[reminder.category]

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete Reminder', `Delete "${reminder.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onDelete)(reminder.id)
          })
        },
      },
    ])
  }, [reminder.id, reminder.title])

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -120)
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-100)
      } else {
        translateX.value = withSpring(0)
      }
    })

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }))

  const deleteRevealStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
  }))

  const handleTap = () => {
    if (translateX.value < -20) {
      translateX.value = withSpring(0)
      return
    }
    if (isDone) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onEdit(reminder.id)
  }

  const handleComplete = () => {
    if (isDone) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('Complete Reminder', `Mark "${reminder.title}" as done?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => onComplete(reminder.id) },
    ])
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={styles.wrapper}
    >
      {/* Swipe-to-delete background */}
      <Animated.View style={[styles.deleteAction, deleteRevealStyle]}>
        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, isOverdue && styles.cardOverdue, cardStyle]}>
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: isOverdue ? colors.negative : accentColor }]} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleTap}
            style={styles.cardInner}
          >
            {/* Content */}
            <View style={styles.content}>
              <Text
                style={[
                  styles.title,
                  isDone && styles.titleDone,
                ]}
                numberOfLines={2}
              >
                {reminder.title}
              </Text>

              {reminder.description ? (
                <Text style={styles.description} numberOfLines={1}>
                  {reminder.description}
                </Text>
              ) : null}

              <View style={styles.metaRow}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={isOverdue ? colors.negative : colors.textMuted}
                  style={{ marginTop: 1 }}
                />
                <Text style={[styles.time, isOverdue && styles.timeOverdue]}>
                  {formatReminderDateTime(reminder.scheduledAt)}
                  {isOverdue ? '  · Overdue' : ''}
                </Text>

                <View style={[styles.categoryPill, { borderColor: accentColor + '50' }]}>
                  <Text style={[styles.categoryLabel, { color: accentColor }]}>
                    {reminder.category}
                  </Text>
                </View>
              </View>
            </View>

            {/* Complete button */}
            <TouchableOpacity
              onPress={handleComplete}
              style={styles.checkBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.positive} />
              ) : isDismissed ? (
                <Ionicons name="remove-circle-outline" size={24} color={colors.textMuted} />
              ) : (
                <View style={styles.checkCircle} />
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.negative,
    borderRadius: radius.lg,
  },
  deleteBtn: {
    padding: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardOverdue: {
    backgroundColor: '#1E1410',
    borderColor: colors.negative + '40',
  },
  accentBar: {
    width: 3,
    borderRadius: 0,
    flexShrink: 0,
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.h3,
    lineHeight: 22,
  },
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  time: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  timeOverdue: {
    color: colors.negative,
    fontWeight: '600',
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  checkBtn: {
    flexShrink: 0,
    padding: spacing.xs,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
})
