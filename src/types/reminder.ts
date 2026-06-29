export type ReminderStatus = 'pending' | 'completed' | 'dismissed'

export type BuiltinSound = 'default' | 'chime' | 'bell' | 'digital' | 'gentle'

export type SoundOption =
  | { type: 'builtin'; name: BuiltinSound }
  | { type: 'custom'; uri: string; fileName: string; duration: number }

export type Category = 'Personal' | 'Work' | 'Health' | 'Social'

export interface Reminder {
  id: string
  title: string
  description?: string
  scheduledAt: string       // ISO timestamp
  sound: SoundOption
  status: ReminderStatus
  category: Category
  createdAt: string
  notificationId?: string       // main notification at scheduledAt
  earlyNotificationId?: string  // 5-min early alert
}
