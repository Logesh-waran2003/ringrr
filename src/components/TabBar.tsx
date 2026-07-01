import React from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { colors } from '@/constants/theme'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs'

const TABS = [
  { route: 'index',   icon: 'alarm-outline',   iconActive: 'alarm',   label: 'Reminders' },
  { route: 'history', icon: 'time-outline',     iconActive: 'time',    label: 'History' },
]

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pb = Math.max(insets.bottom, 8)
  const activeRoute = state.routes[state.index]?.name

  const goTo = (route: string) => {
    Haptics.selectionAsync()
    const event = navigation.emit({ type: 'tabPress', target: route, canPreventDefault: true })
    if (!event.defaultPrevented) navigation.navigate(route)
  }

  const openCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/create')
  }

  return (
    <View style={[styles.bar, { paddingBottom: pb }]}>
      {/* Reminders tab */}
      <Pressable
        style={styles.tab}
        onPress={() => goTo('index')}
        hitSlop={8}
      >
        <Ionicons
          name={activeRoute === 'index' ? 'alarm' : 'alarm-outline'}
          size={24}
          color={activeRoute === 'index' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.label, activeRoute === 'index' && styles.labelActive]}>
          Reminders
        </Text>
      </Pressable>

      {/* FAB — center */}
      <View style={styles.fabWrap}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={openCreate}
        >
          <Ionicons name="add" size={28} color="#000" />
        </Pressable>
      </View>

      {/* History tab */}
      <Pressable
        style={styles.tab}
        onPress={() => goTo('history')}
        hitSlop={8}
      >
        <Ionicons
          name={activeRoute === 'history' ? 'time' : 'time-outline'}
          size={24}
          color={activeRoute === 'history' ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.label, activeRoute === 'history' && styles.labelActive]}>
          History
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.primary,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.9,
  },
})
