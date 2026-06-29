import React, { useEffect } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors, radius } from '@/constants/theme'

interface FABProps {
  onPress: () => void
}

export function FAB({ onPress }: FABProps) {
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 })
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withSpring(0.9, { duration: 100 }, () => {
      scale.value = withSpring(1)
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Animated.View style={[styles.fab, animStyle]}>
      <TouchableOpacity onPress={handlePress} style={styles.touch} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  touch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
