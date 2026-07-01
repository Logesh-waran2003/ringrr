import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

/**
 * Sets up the notification tap handler — opens the app to the relevant
 * reminder detail when the user taps a notification.
 * Call this once in the root layout.
 */
export function useNotificationHandler() {
  const router = useRouter()

  useEffect(() => {
    // Foreground notification display
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })

    // Tap handler — fired when user taps notification
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const reminderId = response.notification.request.content.data?.reminderId as
        | string
        | undefined
      if (reminderId) {
        router.push({ pathname: '/alarm', params: { id: reminderId } })
      }
    })

    return () => sub.remove()
  }, [])
}
