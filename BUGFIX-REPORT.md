# BUGFIX-REPORT.md — Ringrr (Nudge) Full Audit

## Fixed

### Bug #1 — Notification Sound Not Playing (Priority)

**Symptom:** When a reminder fires, the notification popup appears but no sound plays.

**Root Cause (TWO issues):**
1. **Silent placeholder WAV files.** All four files in `assets/sounds/` (bell.wav, chime.wav, digital.wav, gentle.wav) were 8044-byte dummy files — valid WAV headers (8-bit, mono, 8000Hz) but the data section was entirely zeros. No audible audio content whatsoever.
2. **Android channel architecture mismatch.** On Android 8+, notification sound is determined by the *channel*, not the individual notification payload. The app created a single channel (`nudge-alarms-v2`) with `sound: 'default'`, but set per-notification `content.sound` to filenames like `'chime.wav'`. Android ignores the per-notification sound and uses the channel's. Even if the channel played system default sound, the user's selected custom sound would never play.

**Fix Applied:**
- Generated real audio WAV files (44.1kHz, 16-bit PCM, 1.5-2s duration) with distinct tones: bell (chord decay), chime (ascending notes), digital (electronic beeps), gentle (soft sustained chord).
- Rewrote `src/services/notificationService.ts` to create **one channel per sound** (`nudge-alarm-default`, `nudge-alarm-chime`, `nudge-alarm-bell`, `nudge-alarm-digital`, `nudge-alarm-gentle`). Each channel has the correct sound file baked into its configuration.
- Notifications are now scheduled to the channel matching the user's selected sound.
- iOS: `content.sound` is still set to the filename (iOS reads it from the notification content, not the channel).

**Files Changed:** `assets/sounds/*.wav`, `src/services/notificationService.ts`

**Verification Steps:**
1. Build the app with `npx expo run:android` (dev build required — sound files must be bundled via the expo-notifications plugin).
2. Create a reminder with each sound option (Default, Chime, Bell, Digital, Gentle).
3. Wait for each to fire — confirm distinct sounds play.
4. Test with app in foreground AND background.
5. On Android, check Settings > Apps > Nudge > Notifications — should see separate channels per sound.

---

### Bug #2 — Snooze Doesn't Update Reminder State

**Symptom:** Tapping "Snooze 5 min" on the alarm screen schedules a new notification but doesn't update the reminder's `scheduledAt` in storage. The reminder still appears at its original time in the timeline.

**Root Cause:** `handleSnooze()` in `alarm.tsx` only called `Notifications.scheduleNotificationAsync()` directly — it never called `updateReminder()` from the hook to persist the new time.

**Fix Applied:** Snooze now calls `updateReminder()` from the `useReminders` hook, which:
- Updates `scheduledAt` to 5 minutes from now
- Cancels old notifications
- Schedules new notification via the correct alarm channel
- Persists to AsyncStorage

Added fallback: if the hook update fails (e.g., reminder was deleted while alarm was showing), it falls back to scheduling a raw notification with `channelId: 'nudge-alarm-default'`.

**Files Changed:** `src/app/alarm.tsx`

**Verification:** Snooze a reminder → check Home timeline → reminder should show new time (5min from now), not original time.

---

### Bug #3 — CATEGORY_COLORS Duplicated Across 8+ Files

**Symptom:** The same color map was hardcoded in 8 different files, making it error-prone to update and inconsistent (one file used `colors.positive` for Health while others used `'#10B981'` directly).

**Fix Applied:** Added `CATEGORY_COLORS` export to `src/constants/theme.ts` and updated all 8 files to import it from there. Removed all local definitions.

**Files Changed:** `src/constants/theme.ts`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/history.tsx`, `src/app/create.tsx`, `src/app/edit.tsx`, `src/app/history.tsx`, `src/components/ReminderCard.tsx`, `src/components/CategoryBadge.tsx`, `src/components/UpcomingPanel.tsx`

---

### Bug #4 — Non-Functional UI Elements

**Symptom:** Hamburger menu, avatar icon, and "VIEW ALL" link had no handlers — tapping them did nothing.

**Fix Applied:**
- **Menu button:** Removed (no menu exists). Replaced with invisible spacer for layout balance.
- **Avatar button:** Removed (no profile/settings exists).
- **"VIEW ALL":** Now navigates to `/reminders` (the grouped reminder list view).

**Files Changed:** `src/app/(tabs)/index.tsx`

---

### Bug #5 — "Preview Sound" Button Non-Functional

**Symptom:** The "Preview Sound" link in the Create screen only fired a haptic — no audio played.

**Root Cause:** No audio playback library in the project (expo-av not installed). The button was a stub.

**Fix Applied:** Changed to show an informative alert: "Sound previews play when notifications fire. Select a sound and test with a reminder." This is honest about the limitation.

**Files Changed:** `src/app/create.tsx`

---

### Bug #6 — Test Alarm Button in Production UI

**Symptom:** A "Test" button with a bell icon was visible in the top bar of the Home screen — a developer tool exposed to end users.

**Fix Applied:** Removed the button and its associated `fireTestAlarm()` function entirely. The alarm screen still supports `id='__test__'` for dev testing via deep link if needed.

**Files Changed:** `src/app/(tabs)/index.tsx`

---

### Bug #7 — No Delete/Complete Actions on Home Timeline Cards

**Symptom:** Home timeline cards only had a complete (checkmark) button. Users had to navigate to Edit screen to delete a reminder.

**Fix Applied:** Added a trash icon button to each timeline card's footer. Tapping it shows a confirmation alert before deleting. Both complete and delete are now available directly from the Home screen.

**Files Changed:** `src/app/(tabs)/index.tsx`

---

### Bug #8 — Donut Ring Shows Static Full Circle

**Symptom:** The progress donut always showed a full teal border regardless of completion percentage — visually misleading.

**Fix Applied:** The donut ring now uses `colors.border` (muted) as its base border color and dynamically applies `colors.primary` (teal) based on `completionPct`. At 0% it's fully muted, at 50%+ the right side fills in, at 100% it's fully teal. The percentage text inside was already correct.

**Files Changed:** `src/app/(tabs)/index.tsx`

---

### Bug #9 — Edit Screen CTA Button Inconsistent With Create

**Symptom:** Create screen uses a pill-shaped CTA (`borderRadius: 999`, `height: 52`). Edit screen used a rounded rectangle (`borderRadius: 16`, `paddingVertical`). Same semantic action, different shape.

**Fix Applied:** Changed edit's save button to `borderRadius: 999` (full pill) and `height: 52` to match create.

**Files Changed:** `src/app/edit.tsx`

---

### Bug #10 — Misleading "High Priority" Text

**Symptom:** Below the Create screen CTA, "• High Priority" text appeared, but no priority system exists — all reminders are equal.

**Fix Applied:** Removed the text and its associated style.

**Files Changed:** `src/app/create.tsx`

---

### Bug #11 — Snooze Used Non-Existent Channel ID

**Symptom:** The snooze notification referenced `channelId: 'nudge-reminders'` which was never created. On Android, this would either fail silently or use the system fallback "Miscellaneous" channel (low importance, possibly no sound).

**Fix Applied:** Snooze now uses the hook's `updateReminder()` which schedules via `scheduleReminderNotifications()` — using the correct per-sound channel. Fallback uses `'nudge-alarm-default'`.

**Files Changed:** `src/app/alarm.tsx`

---

## Fixed but Needs Manual Device Testing to Confirm

| # | Bug | Why manual testing needed |
|---|-----|--------------------------|
| 1 | Notification sound plays correctly | Requires built native app (EAS Build) on physical device. Expo Go won't test custom channels. |
| 2 | Per-sound channels created correctly | Need to check Android Settings > App > Notifications after first launch |
| 3 | Donut ring visual matches percentage | Need to see rendered output on device — CSS partial-border approach may need SVG for pixel-perfect arcs |
| 4 | Snooze reschedules correctly | Need to trigger alarm, snooze, verify new notification fires 5 min later |

---

## Found but NOT Fixed — Needs a Product Decision

### 1. Two Competing Home Screens
**What:** `src/app/(tabs)/index.tsx` (dashboard with donut + timeline) and `src/app/reminders/index.tsx` (grouped list with swipe-to-delete cards + FAB) are both complete implementations.

**Current state:** The app routes to the dashboard. The reminders list is accessible via "VIEW ALL" link (after my fix).

**Decision needed:** Keep both? Remove one? Merge features? The reminders list has swipe-to-delete which is better UX; the dashboard has stats which are nice. Could combine.

### 2. Two History Screens
**What:** `src/app/(tabs)/history.tsx` (tab, with summary card + completion rate) and `src/app/history.tsx` (standalone, simpler, with back button). They have different styling (surfaceElevated vs surface bg, different dot sizes).

**Decision needed:** Delete the standalone one? The tab version is richer. The standalone is reachable via `/history` route from the reminders screen.

### 3. Identity Crisis (ringrr vs Nudge vs Ringr)
**What:** Repository is "ringrr", `app.json` names the app "Nudge", the Home screen brand text says "Ringr". 

**Decision needed:** Pick one name and apply it everywhere.

### 4. No Audio Playback Library for Sound Preview
**What:** "Preview Sound" cannot actually play audio because there's no playback library in the project.

**Decision needed:** Add `expo-av` (~1.2MB) to enable in-app sound preview? Or is the current alert sufficient?

### 5. Unused Shared Components
**What:** `CategoryBadge`, `UpcomingPanel`, and `DateTimePicker` wrapper components are built but not used by any active screen.

**Decision needed:** Remove dead code, or integrate them into screens where they'd add value?

### 6. No Data Backup/Export
**What:** All data is in AsyncStorage. Uninstalling loses everything. No cloud sync, no export.

**Decision needed:** Is this acceptable for v1, or should we add at minimum a JSON export feature?

---

## Edge Cases & Race Conditions Audited (No Fix Needed)

| Item | Assessment |
|------|------------|
| AsyncStorage race between read/write | **Low risk.** All writes go through `saveReminders()` which saves the full array atomically. The hook serializes operations. Two rapid operations could theoretically interleave, but in practice user actions are seconds apart. |
| Notification re-registration on every app open | **Correct behavior.** Cancels all → re-schedules future ones. Prevents duplicate notifications. Slightly wasteful but safe. |
| Alarm screen loads from storage independently | **Correct for this use case.** The alarm screen opens from a notification tap when the app may not have state loaded. Reading from storage is the right approach. Added warning log for "not found" case. |
| Conflict detection ±5min math | **Correct.** Uses `Math.abs(diff) <= 5 * 60 * 1000`. Works across midnight, same day, different days. Edge case: two reminders exactly 5 minutes apart are flagged — this is by design (inclusive window). |
| `generateId()` collision risk | **Negligible.** `Date.now()` + 7 random chars. Would need sub-millisecond identical timestamps AND matching random to collide. |
