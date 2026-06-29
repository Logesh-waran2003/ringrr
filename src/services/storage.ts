import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Reminder } from '@/types/reminder'

const REMINDERS_KEY = 'nudge:reminders:v2'

/**
 * Load all reminders from persistent storage.
 * Returns an empty array on first launch or parse failure.
 */
export async function loadReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Reminder[]
  } catch (e) {
    console.error('[storage] loadReminders failed:', e)
    return []
  }
}

/**
 * Persist the full reminders array.
 */
export async function saveReminders(reminders: Reminder[]): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders))
  } catch (e) {
    console.error('[storage] saveReminders failed:', e)
    throw new Error('Failed to save reminders. Please try again.')
  }
}

/**
 * Add a single reminder. Loads, appends, saves.
 */
export async function addReminder(reminder: Reminder): Promise<Reminder[]> {
  const existing = await loadReminders()
  const updated = [...existing, reminder]
  await saveReminders(updated)
  return updated
}

/**
 * Update a reminder by id. Throws if not found.
 */
export async function updateReminder(updated: Reminder): Promise<Reminder[]> {
  const existing = await loadReminders()
  const idx = existing.findIndex((r) => r.id === updated.id)
  if (idx === -1) throw new Error(`Reminder ${updated.id} not found`)
  const next = [...existing]
  next[idx] = updated
  await saveReminders(next)
  return next
}

/**
 * Delete a reminder by id.
 */
export async function deleteReminder(id: string): Promise<Reminder[]> {
  const existing = await loadReminders()
  const updated = existing.filter((r) => r.id !== id)
  await saveReminders(updated)
  return updated
}
