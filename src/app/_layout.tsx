import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'
import { useEffect } from 'react'
import { colors } from '@/constants/theme'
import {
  setupNotificationChannels,
  requestNotificationPermission,
} from '@/services/notificationService'
import { useNotificationHandler } from '@/hooks/useNotificationHandler'

export default function RootLayout() {
  useNotificationHandler()

  useEffect(() => {
    setupNotificationChannels()
    requestNotificationPermission()
  }, [])

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="reminders" />
        <Stack.Screen
          name="create"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="edit"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
})
