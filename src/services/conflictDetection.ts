import type { Reminder } from '@/types/reminder'

/** 5-minute conflict window in milliseconds */
const CONFLICT_WINDOW_MS = 5 * 60 * 1000

/**
 * Pure function — detects pending reminders within ±5 minutes of a target time.
 *
 * @param scheduledAt - ISO string of the proposed reminder time
 * @param existingReminders - All reminders to check against
 * @param excludeId - ID to exclude (for edit flow — don't conflict with self)
 * @returns Array of conflicting reminders (empty = no conflict)
 */
export function detectConflicts(
  scheduledAt: string,
  existingReminders: Reminder[],
  excludeId?: string
): Reminder[] {
  const targetMs = new Date(scheduledAt).getTime()

  return existingReminders.filter((r) => {
    if (r.status !== 'pending') return false
    if (excludeId && r.id === excludeId) return false
    const diff = Math.abs(new Date(r.scheduledAt).getTime() - targetMs)
    return diff <= CONFLICT_WINDOW_MS
  })
}

/**
 * Returns true if scheduledAt is in the past.
 */
export function isPastTime(scheduledAt: string): boolean {
  return new Date(scheduledAt).getTime() <= Date.now()
}

/**
 * Returns reminders due in the next 24 hours, sorted ascending.
 */
export function getUpcoming24h(reminders: Reminder[]): Reminder[] {
  const now = Date.now()
  const cutoff = now + 24 * 60 * 60 * 1000
  return reminders
    .filter(
      (r) =>
        r.status === 'pending' &&
        new Date(r.scheduledAt).getTime() > now &&
        new Date(r.scheduledAt).getTime() <= cutoff
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
}
