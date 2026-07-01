import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { Reminder, BuiltinSound } from '@/types/reminder'

// NOTE: setNotificationHandler is called in useNotificationHandler (root layout hook).
// Do not duplicate it here.

const ANDROID_CHANNEL_ID = 'nudge-alarms-v2'
const ANDROID_EARLY_CHANNEL_ID = 'nudge-early-v2'

/** Sound filename map — these must exist in assets/sounds/ at build time */
const BUILTIN_SOUND_MAP: Record<BuiltinSound, string | undefined> = {
  default: undefined, // system default
  chime: 'chime.wav',
  bell: 'bell.wav',
  digital: 'digital.wav',
  gentle: 'gentle.wav',
}

/**
 * Set up Android notification channels. Call once on app launch.
 *
 * Android caches channel settings after first creation — importance, sound, and
 * vibration cannot be changed on an existing channel. We delete both channels
 * first so that updated settings (MAX importance, default sound, vibration) are
 * always applied cleanly.
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return

  // Delete existing channels so updated settings take effect.
  // deleteNotificationChannelAsync is a no-op when the channel doesn't exist.
  await Notifications.deleteNotificationChannelAsync(ANDROID_CHANNEL_ID)
  await Notifications.deleteNotificationChannelAsync(ANDROID_EARLY_CHANNEL_ID)

  // Alarm channel — bypasses DND, max importance, turns screen on
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Alarms',
    description: 'Scheduled alarms — bypasses Do Not Disturb',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',           // explicitly use system default sound
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#00C9C8',
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    enableVibrate: true,
  })

  // Early alert channel — high importance so it makes sound
  await Notifications.setNotificationChannelAsync(ANDROID_EARLY_CHANNEL_ID, {
    name: 'Early Alerts',
    description: '5-minute advance reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
  })
}

/**
 * Request notification permissions from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Schedule the main notification + 5-minute early alert for a reminder.
 * Returns { notificationId, earlyNotificationId }.
 */
export async function scheduleReminderNotifications(
  reminder: Reminder
): Promise<{ notificationId: string; earlyNotificationId: string | null }> {
  const scheduledAt = new Date(reminder.scheduledAt)
  const now = new Date()

  if (scheduledAt.getTime() <= now.getTime()) {
    throw new Error('Cannot schedule a notification in the past')
  }

  const soundFile =
    reminder.sound.type === 'builtin'
      ? BUILTIN_SOUND_MAP[reminder.sound.name]
      : undefined // custom sounds only play in-app

  // Main notification — full screen intent fires alarm screen over lock screen
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.description ?? 'Time for your reminder',
      sound: soundFile ?? true,
      data: { reminderId: reminder.id },
      sticky: true,
      ...(Platform.OS === 'android' && {
        priority: 'max',
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledAt,
      channelId: ANDROID_CHANNEL_ID,
    } as Notifications.DateTriggerInput,
  })

  // 5-minute early alert
  let earlyNotificationId: string | null = null
  const earlyTime = new Date(scheduledAt.getTime() - 5 * 60 * 1000)
  if (earlyTime.getTime() > now.getTime()) {
    earlyNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Coming up: ${reminder.title}`,
        body: 'Starts in 5 minutes',
        sound: true,
        data: { reminderId: reminder.id, early: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: earlyTime,
        channelId: ANDROID_EARLY_CHANNEL_ID,
      } as Notifications.DateTriggerInput,
    })
  }

  return { notificationId, earlyNotificationId }
}

/**
 * Cancel both notifications for a reminder.
 */
export async function cancelReminderNotifications(reminder: Reminder): Promise<void> {
  const ids = [reminder.notificationId, reminder.earlyNotificationId].filter(
    Boolean
  ) as string[]
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)))
}

/**
 * Re-register all pending reminders' notifications on app launch.
 * Clears all scheduled notifications first to avoid duplicates.
 */
export async function reRegisterAllNotifications(
  reminders: Reminder[]
): Promise<Map<string, { notificationId: string; earlyNotificationId: string | null }>> {
  // Cancel everything scheduled
  await Notifications.cancelAllScheduledNotificationsAsync()

  const results = new Map<
    string,
    { notificationId: string; earlyNotificationId: string | null }
  >()

  const pending = reminders.filter(
    (r) =>
      r.status === 'pending' &&
      new Date(r.scheduledAt).getTime() > Date.now()
  )

  for (const reminder of pending) {
    try {
      const ids = await scheduleReminderNotifications(reminder)
      results.set(reminder.id, ids)
    } catch (e) {
      console.warn(`[notifications] Could not re-register ${reminder.id}:`, e)
    }
  }

  return results
}
