/**
 * Returns time-aware greeting based on hour of day.
 */
export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Formats a reminder's scheduledAt for display.
 * Today → "Today at 3:00 PM"
 * Tomorrow → "Tomorrow at 9:00 AM"
 * Other → "Mon, 30 Jun · 3:00 PM"
 */
export function formatReminderDateTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(date, now)) return `Today at ${timeStr}`
  if (sameDay(date, tomorrow)) return `Tomorrow at ${timeStr}`

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return `${dateStr} · ${timeStr}`
}

export function isOverdue(isoString: string): boolean {
  return new Date(isoString).getTime() <= Date.now()
}

export function isToday(isoString: string): boolean {
  const d = new Date(isoString)
  const n = new Date()
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  )
}

export function isTomorrow(isoString: string): boolean {
  const d = new Date(isoString)
  const t = new Date()
  t.setDate(t.getDate() + 1)
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  )
}

/** Generates a random ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
