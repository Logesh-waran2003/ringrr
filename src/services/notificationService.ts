import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { Reminder, BuiltinSound } from '@/types/reminder'

// NOTE: setNotificationHandler is called in useNotificationHandler (root layout hook).
// Do not duplicate it here.

/**
 * Channel architecture (Android 8+):
 * On Android, notification sound is a property of the CHANNEL, not individual
 * notifications. To support multiple alarm sounds, we create one channel per
 * sound. Each channel has the sound baked in at creation time.
 *
 * Channel IDs (v2 — bumped to bust Android's cached stale channel config):
 *   - nudge-alarms-v2-default  → system default sound
 *   - nudge-alarms-v2-chime    → chime.wav
 *   - nudge-alarms-v2-bell     → bell.wav
 *   - nudge-alarms-v2-digital  → digital.wav
 *   - nudge-alarms-v2-gentle   → gentle.wav
 *   - nudge-early-v2           → early alert (system default, HIGH importance)
 *
 * Android caches channel settings (importance, bypassDnd, lockscreenVisibility)
 * after first creation and ignores subsequent setNotificationChannelAsync calls
 * on the same ID. Bumping the prefix forces Android to treat these as brand-new
 * channels with the correct settings.
 */

const CHANNEL_PREFIX = 'nudge-alarms-v2-'
const ANDROID_EARLY_CHANNEL_ID = 'nudge-early-v2'

/** Sound filename map — these must exist in assets/sounds/ and be listed in app.json plugin config */
const BUILTIN_SOUND_FILES: Record<BuiltinSound, string | null> = {
  default: null,          // use system default
  chime: 'chime.wav',
  bell: 'bell.wav',
  digital: 'digital.wav',
  gentle: 'gentle.wav',
}

/** Get the Android channel ID for a given sound */
function getChannelId(sound: BuiltinSound): string {
  return `${CHANNEL_PREFIX}${sound}`
}

/**
 * Set up Android notification channels. Call once on app launch.
 *
 * Creates one channel per sound option (so Android uses the correct sound
 * for each notification) plus one early-alert channel.
 *
 * Channels are deleted and recreated to ensure updated settings always apply
 * (Android caches channel settings after first creation).
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return

  const sounds: BuiltinSound[] = ['default', 'chime', 'bell', 'digital', 'gentle']

  // Delete new v2 channels (so updated settings always apply on reinstall/update)
  for (const s of sounds) {
    await Notifications.deleteNotificationChannelAsync(getChannelId(s))
  }
  await Notifications.deleteNotificationChannelAsync(ANDROID_EARLY_CHANNEL_ID)

  // Also delete legacy v1 channels (nudge-alarm-*) to keep Android Settings tidy
  const OLD_PREFIX = 'nudge-alarm-'
  for (const s of sounds) {
    await Notifications.deleteNotificationChannelAsync(`${OLD_PREFIX}${s}`)
  }

  // Create one alarm channel per sound
  for (const s of sounds) {
    const soundFile = BUILTIN_SOUND_FILES[s]
    const channelId = getChannelId(s)
    const label = s === 'default' ? 'Default' : s.charAt(0).toUpperCase() + s.slice(1)

    await Notifications.setNotificationChannelAsync(channelId, {
      name: `Alarm — ${label}`,
      description: `Alarms with ${label} sound — bypasses Do Not Disturb`,
      importance: Notifications.AndroidImportance.MAX,
      sound: soundFile ?? 'default',   // null → 'default' for system sound
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#00C9C8',
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
      enableVibrate: true,
    })
  }

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

  // Determine sound settings
  const soundName: BuiltinSound =
    reminder.sound.type === 'builtin' ? reminder.sound.name : 'default'
  const soundFile = BUILTIN_SOUND_FILES[soundName]
  const channelId = getChannelId(soundName)

  // Main notification — uses the per-sound channel for correct audio
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.description ?? 'Time for your reminder',
      // On iOS, sound file in content determines what plays.
      // On Android <8, this also matters. On Android 8+, channel sound wins.
      sound: soundFile ?? 'default',
      data: { reminderId: reminder.id },
      sticky: true,
      ...(Platform.OS === 'android' && {
        priority: 'max',
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledAt,
      channelId,
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
        sound: 'default',
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
