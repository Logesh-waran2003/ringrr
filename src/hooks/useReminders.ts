import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import type { Reminder } from '@/types/reminder'
import {
  loadReminders,
  saveReminders,
  addReminder as storageAdd,
  updateReminder as storageUpdate,
  deleteReminder as storageDelete,
} from '@/services/storage'
import {
  scheduleReminderNotifications,
  cancelReminderNotifications,
  reRegisterAllNotifications,
  requestNotificationPermission,
} from '@/services/notificationService'
import { cleanupCustomSound } from '@/services/soundStorage'

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const appStateRef = useRef(AppState.currentState)

  useEffect(() => {
    ;(async () => {
      try {
        const loaded = await loadReminders()
        const reRegistered = await reRegisterAllNotifications(loaded)
        const updated = loaded.map((r) => {
          const ids = reRegistered.get(r.id)
          if (!ids) return r
          return {
            ...r,
            notificationId: ids.notificationId,
            earlyNotificationId: ids.earlyNotificationId ?? undefined,
          }
        })
        setReminders(updated)
        await saveReminders(updated)
      } catch (e) {
        setError('Failed to load reminders')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        loadReminders().then(setReminders).catch(console.error)
      }
      appStateRef.current = next
    })
    return () => sub.remove()
  }, [])

  const refresh = useCallback(async () => {
    try {
      const loaded = await loadReminders()
      setReminders(loaded)
    } catch (e) {
      console.error('[useReminders] refresh failed:', e)
    }
  }, [])

  const addReminder = useCallback(async (reminder: Reminder): Promise<void> => {
    try {
      const granted = await requestNotificationPermission()
      if (!granted) {
        throw new Error('Notification permission is required to set reminders. Please enable it in Settings.')
      }
      const { notificationId, earlyNotificationId } =
        await scheduleReminderNotifications(reminder)
      const withIds: Reminder = {
        ...reminder,
        notificationId,
        earlyNotificationId: earlyNotificationId ?? undefined,
      }
      const updated = await storageAdd(withIds)
      setReminders(updated)
    } catch (e: any) {
      throw new Error(e?.message ?? 'Failed to save reminder')
    }
  }, [])

  const updateReminder = useCallback(
    async (reminder: Reminder): Promise<void> => {
      try {
        const existing = reminders.find((r) => r.id === reminder.id)
        if (existing) await cancelReminderNotifications(existing)

        let updated = { ...reminder }
        if (
          reminder.status === 'pending' &&
          new Date(reminder.scheduledAt).getTime() > Date.now()
        ) {
          const { notificationId, earlyNotificationId } =
            await scheduleReminderNotifications(reminder)
          updated = {
            ...updated,
            notificationId,
            earlyNotificationId: earlyNotificationId ?? undefined,
          }
        }
        const next = await storageUpdate(updated)
        setReminders(next)
      } catch (e: any) {
        throw new Error(e?.message ?? 'Failed to update reminder')
      }
    },
    [reminders]
  )

  const deleteReminder = useCallback(
    async (id: string): Promise<void> => {
      try {
        const reminder = reminders.find((r) => r.id === id)
        if (reminder) await cancelReminderNotifications(reminder)
        const next = await storageDelete(id)
        setReminders(next)
        // Clean up custom sound file if no remaining alarm still references it
        if (reminder?.sound.type === 'custom') {
          await cleanupCustomSound(reminder.sound.uri, next)
        }
      } catch (e: any) {
        throw new Error(e?.message ?? 'Failed to delete reminder')
      }
    },
    [reminders]
  )

  const markComplete = useCallback(
    async (id: string): Promise<void> => {
      const r = reminders.find((r) => r.id === id)
      if (!r) return
      await updateReminder({ ...r, status: 'completed' })
    },
    [reminders, updateReminder]
  )

  const markDismissed = useCallback(
    async (id: string): Promise<void> => {
      const r = reminders.find((r) => r.id === id)
      if (!r) return
      await updateReminder({ ...r, status: 'dismissed' })
    },
    [reminders, updateReminder]
  )

  const now = Date.now()
  const pending = reminders.filter((r) => r.status === 'pending')
  const history = reminders.filter(
    (r) => r.status === 'completed' || r.status === 'dismissed'
  )
  const overdue = pending.filter(
    (r) => new Date(r.scheduledAt).getTime() <= now
  )
  const upcoming = pending.filter(
    (r) => new Date(r.scheduledAt).getTime() > now
  )

  const sortedUpcoming = [...upcoming].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )

  const todayItems = sortedUpcoming.filter((r) => {
    const d = new Date(r.scheduledAt)
    const t = new Date()
    return d.toDateString() === t.toDateString()
  })

  const tomorrowItems = sortedUpcoming.filter((r) => {
    const d = new Date(r.scheduledAt)
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return d.toDateString() === t.toDateString()
  })

  const laterItems = sortedUpcoming.filter((r) => {
    const d = new Date(r.scheduledAt)
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return d.toDateString() !== t.toDateString() && d.toDateString() !== new Date().toDateString()
  })

  const upcoming24h = sortedUpcoming.filter(
    (r) => new Date(r.scheduledAt).getTime() <= now + 24 * 60 * 60 * 1000
  )

  return {
    reminders,
    loading,
    error,
    pending,
    history,
    overdue,
    upcoming,
    todayItems,
    tomorrowItems,
    laterItems,
    upcoming24h,
    addReminder,
    updateReminder,
    deleteReminder,
    markComplete,
    markDismissed,
    refresh,
  }
}
