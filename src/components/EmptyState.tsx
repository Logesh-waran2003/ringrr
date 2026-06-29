import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography } from '@/constants/theme'

export function EmptyState() {
  const translateY = useSharedValue(0)

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    )
  }, [])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View entering={FadeIn.delay(200)} style={styles.container}>
      <Animated.View style={[styles.iconWrap, floatStyle]}>
        <Ionicons name="alarm-outline" size={64} color={colors.primary} />
      </Animated.View>
      <Text style={styles.title}>No reminders yet</Text>
      <Text style={styles.subtitle}>Tap + to add your first reminder</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 100,
    height: 100,
    backgroundColor: colors.primarySubtle,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
})
