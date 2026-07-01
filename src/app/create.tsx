import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import DateTimePickerModal from '@react-native-community/datetimepicker'
import { useReminders } from '@/hooks/useReminders'
import { detectConflicts } from '@/services/conflictDetection'
import { generateId } from '@/utils/date'
import { colors, radius, spacing, typography } from '@/constants/theme'
import type { Category, Reminder, BuiltinSound, SoundOption } from '@/types/reminder'

const CATEGORIES: Category[] = ['Personal', 'Work', 'Health', 'Social']
const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#8B5CF6',
  Work:     '#3B82F6',
  Health:   '#10B981',
  Social:   '#F59E0B',
}
const SOUNDS: { name: BuiltinSound; label: string }[] = [
  { name: 'default', label: 'Default' },
  { name: 'chime',   label: 'Chime' },
  { name: 'bell',    label: 'Bell' },
  { name: 'digital', label: 'Digital' },
  { name: 'gentle',  label: 'Gentle' },
]

function padTwo(n: number): string {
  return n.toString().padStart(2, '0')
}
function formatTimeDisplay(d: Date): { time: string; ampm: string } {
  const h = d.getHours()
  const m = d.getMinutes()
  return {
    time: `${padTwo(h)}:${padTwo(m)}`,
    ampm: h >= 12 ? 'PM' : 'AM',
  }
}
function formatDateDisplay(d: Date): { day: string; month: string } {
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}
function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function CreateScreen() {
  const router = useRouter()
  const { reminders, addReminder } = useReminders()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return d
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [category, setCategory] = useState<Category>('Personal')
  const [sound, setSound] = useState<BuiltinSound>('default')
  const [saving, setSaving] = useState(false)
  const [conflicts, setConflicts] = useState<Reminder[]>([])

  useEffect(() => {
    if (!date) return
    setConflicts(detectConflicts(date.toISOString(), reminders))
  }, [date, reminders])

  const handleDateChange = (_: any, selected?: Date) => {
    setShowDatePicker(false)
    if (selected) {
      const merged = new Date(selected)
      merged.setHours(date.getHours(), date.getMinutes(), 0, 0)
      setDate(merged)
    }
  }

  const handleTimeChange = (_: any, selected?: Date) => {
    setShowTimePicker(false)
    if (selected) {
      const merged = new Date(date)
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
      setDate(merged)
    }
  }

  const doSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter what needs to be done.')
      return
    }
    if (date.getTime() <= Date.now()) {
      Alert.alert('Past Time', 'Please choose a future date and time.')
      return
    }
    setSaving(true)
    try {
      const soundOption: SoundOption = { type: 'builtin', name: sound }
      const reminder: Reminder = {
        id: generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt: date.toISOString(),
        sound: soundOption,
        status: 'pending',
        category,
        createdAt: new Date().toISOString(),
      }
      await addReminder(reminder)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save reminder')
    } finally {
      setSaving(false)
    }
  }, [title, description, date, category, sound, addReminder])

  const handleSave = useCallback(() => {
    if (conflicts.length > 0) {
      const names = conflicts
        .map((c) => `"${c.title}" at ${formatTime(new Date(c.scheduledAt))}`)
        .join(', ')
      Alert.alert(
        'Scheduling Conflict',
        `This conflicts with: ${names}.\n\nProceed anyway?`,
        [
          { text: 'Reschedule', style: 'cancel' },
          { text: 'Add Anyway', onPress: doSave },
        ]
      )
    } else {
      doSave()
    }
  }, [conflicts, doSave])

  const { time: timeDisplay, ampm } = formatTimeDisplay(date)
  const { day: dayDisplay, month: monthDisplay } = formatDateDisplay(date)

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Reminder</Text>
          {/* Avatar placeholder — teal border circle */}
          <View style={styles.avatarCircle} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Conflict banner ── */}
          {conflicts.length > 0 && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.conflictBanner}>
              <Ionicons name="warning" size={16} color="#F97316" />
              <Text style={styles.conflictText}>
                Conflicts with{' '}
                {conflicts
                  .map((c) => `"${c.title}" (${formatTime(new Date(c.scheduledAt))})`)
                  .join(', ')}
              </Text>
            </Animated.View>
          )}

          {/* ── IDENTIFY label ── */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <Text style={styles.sectionLabel}>IDENTIFY</Text>
          </Animated.View>

          {/* ── Title input ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <TextInput
              style={styles.titleInput}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
              maxLength={100}
            />
          </Animated.View>

          {/* ── Category dots ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryDotWrap}
                onPress={() => { setCategory(cat); Haptics.selectionAsync() }}
                hitSlop={6}
              >
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: CATEGORY_COLORS[cat] },
                    category !== cat && styles.categoryDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.categoryDotLabel,
                    category === cat && { color: CATEGORY_COLORS[cat] },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* ── TIME / DATE cards ── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.timeDateRow}>
            {/* TIME card */}
            <TouchableOpacity
              style={styles.timeCard}
              onPress={() => { setShowTimePicker(true); Haptics.selectionAsync() }}
              activeOpacity={0.75}
            >
              <Text style={styles.cardLabel}>TIME</Text>
              <Text style={styles.timeValue}>{timeDisplay}</Text>
              <Text style={styles.cardSubLabel}>{ampm}</Text>
            </TouchableOpacity>

            {/* DATE card */}
            <TouchableOpacity
              style={styles.timeCard}
              onPress={() => { setShowDatePicker(true); Haptics.selectionAsync() }}
              activeOpacity={0.75}
            >
              <Text style={styles.cardLabel}>DATE</Text>
              <Text style={styles.timeValue}>{dayDisplay}</Text>
              <Text style={styles.cardSubLabel}>{monthDisplay}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── ACOUSTIC AURA row ── */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.acousticRow}>
            <Text style={styles.sectionLabel}>ACOUSTIC AURA</Text>
            <TouchableOpacity onPress={() => Haptics.selectionAsync()}>
              <Text style={styles.previewLink}>Preview Sound</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Sound chips ── */}
          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.soundRow}
            >
              {SOUNDS.map((s) => (
                <TouchableOpacity
                  key={s.name}
                  style={[styles.soundChip, sound === s.name && styles.soundChipActive]}
                  onPress={() => { setSound(s.name); Haptics.selectionAsync() }}
                >
                  <Text style={[styles.soundChipText, sound === s.name && styles.soundChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── FREQUENCY ── */}
          <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.frequencyBlock}>
            <Text style={styles.sectionLabel}>FREQUENCY</Text>
            <Text style={styles.frequencyValue}>Once</Text>
          </Animated.View>

          {/* ── NOTE ── */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.sectionLabel}>NOTE</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={500}
            />
          </Animated.View>
        </ScrollView>

        {/* ── CTA button ── */}
        <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, saving && styles.ctaBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>{saving ? 'Saving…' : 'Set Reminder'}</Text>
            <View style={styles.ctaIcon}>
              <Ionicons name="checkmark" size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.priorityText}>
            <Text style={{ color: colors.primary }}>•</Text>
            {'  High Priority'}
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePickerModal
          value={date}
          mode="date"
          display="spinner"
          minimumDate={new Date()}
          onChange={handleDateChange}
          themeVariant="dark"
        />
      )}
      {showTimePicker && (
        <DateTimePickerModal
          value={date}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          themeVariant="dark"
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  avatarCircle: {
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },

  scroll: { flex: 1 },
  form: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },

  // Conflict banner
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#3D1212',
    borderRadius: 8,
    padding: 12,
  },
  conflictText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },

  // Section labels
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  // Title input
  titleInput: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.primary,
    padding: 0,
    margin: 0,
    lineHeight: 42,
  },

  // Category dots
  categoryRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  categoryDotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryDotInactive: {
    opacity: 0.35,
  },
  categoryDotLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // TIME / DATE cards
  timeDateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 50,
    letterSpacing: -1,
  },
  cardSubLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },

  // Acoustic aura row
  acousticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  // Sound chips
  soundRow: { gap: 8, paddingBottom: 2 },
  soundChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soundChipActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceElevated,
  },
  soundChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  soundChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Frequency
  frequencyBlock: { gap: 4 },
  frequencyValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Note input
  noteInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 88,
    marginTop: 8,
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 12,
    gap: 10,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 8,
  },
  ctaBtnDisabled: { opacity: 0.55 },
  ctaBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0E16',
  },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
})
