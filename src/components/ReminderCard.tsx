import React, { useCallback, useRef } from 'react'
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
  Work: '#3B82F6',
  Health: '#10B981',
  Social: '#F59E0B',
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
  const opacity = useSharedValue(1)
  const isCompleted = reminder.status === 'completed'
  const isDismissed = reminder.status === 'dismissed'
  const isOverdue: boolean =
    reminder.status === 'pending' &&
    new Date(reminder.scheduledAt).getTime() <= Date.now()

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
    if (isCompleted || isDismissed) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onEdit(reminder.id)
  }

  const handleComplete = () => {
    if (isCompleted || isDismissed) return
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
      {/* Delete action revealed on swipe */}
      <Animated.View style={[styles.deleteAction, deleteRevealStyle]}>
        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleTap}
            style={styles.cardInner}
          >
            {/* Category dot */}
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: CATEGORY_COLORS[reminder.category] },
              ]}
            />

            {/* Content */}
            <View style={styles.content}>
              <Text
                style={[
                  styles.title,
                  isOverdue && { color: colors.negative },
                  (isCompleted || isDismissed) && styles.titleDone,
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
              <Text style={styles.time}>
                {formatReminderDateTime(reminder.scheduledAt)}
                {isOverdue && (
                  <Text style={{ color: colors.negative }}> · Overdue</Text>
                )}
              </Text>
            </View>

            {/* Right action */}
            <TouchableOpacity
              onPress={handleComplete}
              style={styles.rightAction}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isCompleted ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.positive}
                />
              ) : isDismissed ? (
                <Ionicons
                  name="remove-circle-outline"
                  size={22}
                  color={colors.textMuted}
                />
              ) : (
                <Ionicons
                  name="ellipse-outline"
                  size={22}
                  color={colors.textMuted}
                />
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    flexShrink: 0,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    gap: 3,
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
  time: {
    ...typography.caption,
    marginTop: 2,
  },
  rightAction: {
    flexShrink: 0,
  },
})
