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
import { colors, radius, spacing, typography, CATEGORY_COLORS } from '@/constants/theme'
import type { Reminder, Category } from '@/types/reminder'
import { formatReminderDateTime } from '@/utils/date'

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

  const accentColor = isOverdue ? colors.negative : CATEGORY_COLORS[reminder.category]

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
        <Animated.View style={[styles.card, isDone && styles.cardDone, cardStyle]}>
          {/* Category / overdue accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleTap}
            style={styles.cardInner}
          >
            {/* Main content */}
            <View style={styles.content}>
              {/* Time pill — always dark, no color bleed */}
              <View style={[styles.timePill, isOverdue && styles.timePillOverdue]}>
                <Ionicons
                  name="time-outline"
                  size={10}
                  color={isOverdue ? colors.negative : colors.textMuted}
                  style={{ marginTop: 1 }}
                />
                <Text style={[styles.timePillText, isOverdue && styles.timePillTextOverdue]}>
                  {formatReminderDateTime(reminder.scheduledAt)}
                  {isOverdue ? ' · Overdue' : ''}
                </Text>
              </View>

              <Text
                style={[styles.title, isDone && styles.titleDone]}
                numberOfLines={2}
              >
                {reminder.title}
              </Text>

              {reminder.description ? (
                <Text style={styles.description} numberOfLines={1}>
                  {reminder.description}
                </Text>
              ) : null}
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
                <View style={[styles.checkCircle, { borderColor: accentColor + '60' }]} />
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
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardDone: {
    opacity: 0.55,
  },
  accentBar: {
    width: 3,
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
    gap: 5,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timePillOverdue: {
    backgroundColor: colors.negative + '18',
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.1,
  },
  timePillTextOverdue: {
    color: colors.negative,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
  },
})
