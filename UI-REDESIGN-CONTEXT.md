# Ringrr (Nudge) — Complete Codebase Context for UI Redesign

## Executive Summary

**What:** A React Native (Expo) reminder/alarm app targeting iOS & Android.
**Identity Crisis:** Repo is "ringrr", app.json calls it "Nudge", home screen brand says "Ringr". Pick one.
**Stack:** Expo SDK 56, React 19.2, React Native 0.85, TypeScript 6, Expo Router (file-based), Reanimated 4.3, Gesture Handler 2.31
**State:** AsyncStorage only (no backend, no cloud sync)
**Theme:** Dark luxury — deep navy background with teal (#00C9C8) as primary accent

---

## Architecture & File Map

```
src/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root: GestureHandlerRootView + Stack navigator
│   ├── index.tsx                 # Redirect → /(tabs)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tabs with custom TabBar
│   │   ├── index.tsx             # HOME: Dashboard with donut ring + timeline cards
│   │   └── history.tsx           # HISTORY TAB: completion rate + history list
│   ├── reminders/
│   │   ├── _layout.tsx           # Nested stack
│   │   └── index.tsx             # REMINDERS LIST: grouped (overdue/today/tomorrow/later) + swipe cards + FAB
│   ├── create.tsx                # CREATE: modal slide-up form
│   ├── edit.tsx                  # EDIT: modal slide-up form (mirrors create)
│   ├── alarm.tsx                 # ALARM: full-screen when notification fires
│   └── history.tsx               # HISTORY STANDALONE: simpler version (accessible from /reminders)
├── components/
│   ├── TabBar.tsx                # Custom bottom tab bar with center FAB
│   ├── ReminderCard.tsx          # Swipe-to-delete card (used in /reminders)
│   ├── FAB.tsx                   # Floating action button (animated)
│   ├── EmptyState.tsx            # "Nothing scheduled" placeholder
│   ├── DateTimePicker.tsx        # Wrapper around @react-native-community/datetimepicker
│   ├── CategoryBadge.tsx         # Pill badge showing category (unused in active screens)
│   └── UpcomingPanel.tsx         # Horizontal scroll of upcoming 24h reminders (unused)
├── hooks/
│   ├── useReminders.ts           # Core state: load, add, update, delete, mark complete/dismissed
│   └── useNotificationHandler.ts # Foreground display + tap routing to alarm screen
├── services/
│   ├── notificationService.ts    # Channel setup, schedule/cancel, re-register on launch
│   ├── storage.ts                # AsyncStorage CRUD (key: nudge:reminders:v2)
│   └── conflictDetection.ts      # ±5min scheduling conflict check
├── constants/
│   └── theme.ts                  # Colors, typography, spacing, radius, CATEGORY_COLORS
├── types/
│   └── reminder.ts               # Reminder interface, SoundOption, Category, Status types
├── utils/
│   └── date.ts                   # Greeting, date formatting, isOverdue, generateId
└── global.css                    # CSS variable declarations (web target)
```

---

## Data Model

```typescript
type ReminderStatus = 'pending' | 'completed' | 'dismissed'
type BuiltinSound = 'default' | 'chime' | 'bell' | 'digital' | 'gentle'
type SoundOption = 
  | { type: 'builtin'; name: BuiltinSound }
  | { type: 'custom'; uri: string; fileName: string; duration: number }
type Category = 'Personal' | 'Work' | 'Health' | 'Social'

interface Reminder {
  id: string                    // Date.now() + 7 random chars
  title: string                 // max 100 chars
  description?: string          // max 500 chars
  scheduledAt: string           // ISO timestamp
  sound: SoundOption
  status: ReminderStatus
  category: Category
  createdAt: string
  notificationId?: string       // main notification
  earlyNotificationId?: string  // 5-min early alert
}
```

---

## Design System (Current)

### Color Palette
```
bg:               #0D0E16      (deep navy-black)
surface:          #161820      (card base)
surfaceElevated:  #1C1E2A      (elevated cards)
border:           #2A2B3A      (subtle borders)
primary:          #00C9C8      (teal — CTAs, accents, brand)
primaryLight:     #4EDDDC      (hover/highlight)
primarySubtle:    rgba(0,201,200,0.12)  (icon backgrounds)
positive:         #10B981      (green — completed)
negative:         #F97316      (orange — overdue/errors)
textPrimary:      #FFFFFF
textSecondary:    #C4C4D4
textMuted:        #5A5B6E
```

### Category Colors
```
Personal: #8B5CF6  (purple)
Work:     #3B82F6  (blue)
Health:   #10B981  (green)
Social:   #F59E0B  (amber)
```

### Typography Scale
- h1: 28px / 700 / -0.5 letter-spacing
- h2: 22px / 600 / -0.3 letter-spacing
- h3: 17px / 600
- body: 15px / 400
- caption: 13px / 400 / textSecondary
- label: 12px / 600 / textMuted / 0.5 letter-spacing / uppercase

### Spacing: xs=4, sm=8, md=16, lg=24, xl=32, xxl=48
### Radius: sm=8, md=12, lg=16, xl=24, full=999

### Alarm Screen Palette (separate from main app)
```
ALARM_BG:      #0D1E1E   (darker teal-tinted background)
ALARM_SURFACE: #122020   (card surfaces on alarm)
TEAL:          #00C9C8   (same primary, but more prominent)
```

---

## Screen Descriptions & Current UI Patterns

### 1. HOME SCREEN — `(tabs)/index.tsx`
- Top bar: Brand name "Ringr" center-aligned (empty spacers on sides)
- Dashboard header: "DASHBOARD OVERVIEW" label, time-based greeting, full date
- Progress row: Left = donut ring (120px, shows daily completion %), Right = 2 stat tiles (Upcoming count, Done Today count)
- Timeline section: "Your Timeline" header + "VIEW ALL" link → /reminders
- Timeline cards: Left accent bar (category/overdue color) + time pill + title + description + footer (trash + checkmark icons)
- Animations: FadeInDown with staggered delays, springify()
- Empty state: "Nothing scheduled / Tap + to add a reminder"

### 2. REMINDERS LIST — `reminders/index.tsx`
- Greeting header with pending count + "up next" pill
- History button (top right, circle with clock icon)
- Grouped sections: Overdue → Today → Tomorrow → Upcoming
- Cards: swipe-to-delete (Gesture Handler pan), accent bar, time pill with icon, title, description, checkmark circle
- FAB (bottom right, teal, 60px)

### 3. CREATE SCREEN — `create.tsx` (modal, slides from bottom)
- Header: back arrow, "New Reminder", avatar circle placeholder
- "IDENTIFY" section label → massive title input (34px, teal colored text)
- Category dots: colored circles with labels, inline row
- TIME/DATE cards: 2 cards side by side, tap to open native picker. Time shows HH:MM with AM/PM. Date shows day number with month.
- "ACOUSTIC AURA" label + "Preview Sound" link → horizontal sound chips (pill shape, border highlight when active)
- "FREQUENCY" label → "Once" (static, no repeat implemented)
- "NOTE" label → multiline text input
- CTA: Full-width pill button "Set Reminder" with white circle + checkmark icon on right

### 4. EDIT SCREEN — `edit.tsx` (modal, slides from bottom)
- Header: close (X) button, "Edit reminder" title, delete (trash) button in red circle
- Title: text input (20px, surfaceElevated background)
- When: date + time picker buttons inline
- Category: pill buttons (border highlight when active, filled bg with 20% opacity)
- Sound: horizontal pills (filled teal bg when active, dark text)
- Note: multiline input
- CTA: "Update reminder" full-width pill button

### 5. ALARM SCREEN — `alarm.tsx` (fullscreen modal, fade animation)
- Dark teal background (#0D1E1E)
- Status row: "RINGING" label with bell icon (left), current time (right)
- Bell animation: 3 concentric circles (outer ring, inner ring, filled center with bell icon)
- Time display: HUGE time (72px, teal), AM/PM suffix
- Date: uppercase weekday + month + day (letter-spacing 2.5)
- Reminder card: accent bar + title + description + category label
- Spacer
- Snooze button: full teal pill "Snooze 5 min" with alarm icon
- Dismiss button: outline pill "✕ Dismiss"

### 6. HISTORY TAB — `(tabs)/history.tsx`
- Header: "History" title + subtitle count
- Cards: category dot + title (strikethrough) + date/time + Done/Dismissed pill + trash icon
- Summary card (after 3+ items): completion rate (large %), progress bar, completed/dismissed counts

### 7. HISTORY STANDALONE — `history.tsx`
- Simpler version with back navigation
- Same card structure but uses `colors.surface` bg instead of `surfaceElevated`
- Larger category dots (10px vs 8px)

### 8. CUSTOM TAB BAR — `components/TabBar.tsx`
- 2 tabs: Reminders (alarm icon) + History (clock icon)
- Center: elevated FAB (56px, -28px margin top to pop above bar)
- Dark surface background with top border

---

## Navigation Flow
```
/ (index.tsx) → Redirect to /(tabs)
/(tabs)/index     → Home Dashboard
/(tabs)/history   → History Tab
/reminders        → Grouped Reminders List (via "VIEW ALL")
/create           → Modal: New Reminder
/edit?id=xxx      → Modal: Edit Reminder
/alarm?id=xxx     → Fullscreen: Alarm (from notification tap)
/history          → Standalone History (from /reminders screen)
```

---

## Notification System
- **Android**: One channel per sound (nudge-alarm-default, nudge-alarm-chime, etc.) — MAX importance, bypass DnD
- **iOS**: Sound file set in notification content
- **Early alert**: 5 minutes before, HIGH importance channel
- **On launch**: All pending notifications are cancelled and re-registered
- **Foreground**: Shows alert + plays sound
- **Tap**: Routes to `/alarm?id=reminderId`

---

## Known Issues & Decisions Needed

### Structural Problems
1. **Two competing home screens**: Dashboard (donut + timeline) vs Reminders list (grouped + swipe). User sees dashboard first, reminders list via "VIEW ALL".
2. **Two history screens**: Tab version (richer, with summary card) vs standalone (simpler, with back button). Different styling.
3. **Unused components**: CategoryBadge, UpcomingPanel, DateTimePicker wrapper — built but not integrated.

### UX Gaps
4. **No onboarding** — new users see empty state with no guidance
5. **No settings screen** — can't change notification preferences, theme, or manage sounds
6. **No sound preview** — "Preview Sound" just shows an alert (no expo-av library installed)
7. **Donut ring is CSS hack** — partial border coloring doesn't accurately represent progress. Needs SVG.
8. **No recurring reminders** — "FREQUENCY: Once" is hardcoded, no repeat logic
9. **No data backup/export** — uninstall = data loss

### Visual Inconsistencies
10. **Create vs Edit screen**: Different styling approaches (Create has big teal title input, acoustic aura labels; Edit has standard form fields with labels)
11. **Avatar circle** in Create header has no function
12. **Brand identity** not resolved (Ringrr/Nudge/Ringr)

---

## What You Should Design (UI Redesign Goals)

I want a **world-class, production-grade mobile UI** for this reminder app. The redesign should:

1. **Unify the experience** — one clear home screen, one history, consistent card/form patterns
2. **Premium dark theme** — keep the dark luxury aesthetic but make it more sophisticated (glass morphism, gradients, depth)
3. **Micro-interactions** — leverage Reanimated 4 for delightful transitions, card interactions, button feedback
4. **Modern patterns** — think Linear, Arc Browser, Raycast-level polish
5. **Clear information hierarchy** — most important info (next reminder, time) prominent; secondary info (categories, notes) available but not competing
6. **Alarm screen that feels urgent** — pulsing animations, visual urgency without being annoying
7. **Create/edit form** that's fast — minimize taps, smart defaults, inline editing where possible
8. **Consistent component library** — every card, button, pill, input follows the same design system

### Technical Constraints
- React Native (no web-only CSS features)
- Expo SDK 56 (can use expo-linear-gradient, expo-blur if needed)
- Reanimated 4.3 for animations
- Gesture Handler 2.31 for interactions
- No external UI libraries currently installed (can add react-native-svg, etc.)
- Dark mode only (no light mode support needed)
- Portrait only

### Available Libraries (already installed)
- react-native-reanimated (complex animations, shared values, layout animations)
- react-native-gesture-handler (pan, tap, pinch gestures)
- @expo/vector-icons (Ionicons currently used)
- expo-haptics (tactile feedback)
- expo-status-bar

### Can Add If Needed
- react-native-svg (for proper donut charts, custom shapes)
- expo-linear-gradient (gradient backgrounds, cards)
- expo-blur (glassmorphism effects)
- @shopify/react-native-skia (advanced graphics — only if truly needed)
- lottie-react-native (complex animated illustrations)

---

## App.json Config (for reference)
```json
{
  "expo": {
    "name": "Nudge",
    "slug": "nudge-reminder",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "scheme": "nudge",
    "ios": { "supportsTablet": false, "bundleIdentifier": "com.nudgeapp.reminder" },
    "android": {
      "package": "com.nudgeapp.reminder",
      "permissions": ["RECEIVE_BOOT_COMPLETED", "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM", "VIBRATE", "POST_NOTIFICATIONS"]
    }
  }
}
```

---

## Package.json Dependencies
```json
{
  "dependencies": {
    "@expo/vector-icons": "^15.0.2",
    "@react-native-async-storage/async-storage": "~2.2.0",
    "@react-native-community/datetimepicker": "9.1.0",
    "expo": "~56.0.12",
    "expo-haptics": "~56.0.3",
    "expo-notifications": "~56.0.18",
    "expo-router": "~56.2.11",
    "react": "19.2.3",
    "react-native": "0.85.3",
    "react-native-gesture-handler": "~2.31.1",
    "react-native-reanimated": "4.3.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "4.25.2"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "typescript": "~6.0.3"
  }
}
```

---

## Current Code (Full Source for Each Screen)

### theme.ts
```typescript
import type { Category } from '@/types/reminder'

export const colors = {
  bg:               '#0D0E16',
  surface:          '#161820',
  surfaceElevated:  '#1C1E2A',
  border:           '#2A2B3A',
  primary:          '#00C9C8',
  primaryLight:     '#4EDDDC',
  primarySubtle:    'rgba(0,201,200,0.12)',
  positive:         '#10B981',
  negative:         '#F97316',
  textPrimary:      '#FFFFFF',
  textSecondary:    '#C4C4D4',
  textMuted:        '#5A5B6E',
}

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const, color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' as const },
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
export const radius  = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 }

export const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#8B5CF6',
  Work:     '#3B82F6',
  Health:   '#10B981',
  Social:   '#F59E0B',
}
```

### Reminder Type
```typescript
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
  scheduledAt: string
  sound: SoundOption
  status: ReminderStatus
  category: Category
  createdAt: string
  notificationId?: string
  earlyNotificationId?: string
}
```

---

## Design Inspiration Direction

The app should feel like:
- **Linear** (clean, minimal, fast) — for task management patterns
- **Rise alarm clock app** — for the alarm/wake experience
- **Things 3** — for the calm, focused reminder creation flow
- **Apple Weather/Fitness** — for data visualization (donut, stats)
- **Nothing Phone UI** — for the dark theme with glowing accents

The vibe: Dark, calm, confident. Not flashy or gamified. Like a luxury watch — precise, minimal, every detail intentional.
