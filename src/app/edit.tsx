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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import DateTimePickerModal from '@react-native-community/datetimepicker'
import { useReminders } from '@/hooks/useReminders'
import { detectConflicts } from '@/services/conflictDetection'
import { colors, radius, spacing, typography, CATEGORY_COLORS } from '@/constants/theme'
import type { Category, Reminder, BuiltinSound, SoundOption } from '@/types/reminder'
import { pickCustomSound } from '@/services/soundStorage'

const CATEGORIES: Category[] = ['Personal', 'Work', 'Health', 'Social']
const SOUNDS: { name: BuiltinSound; label: string }[] = [
  { name: 'default', label: 'Default' },
  { name: 'chime',   label: 'Chime' },
  { name: 'bell',    label: 'Bell' },
  { name: 'digital', label: 'Digital' },
  { name: 'gentle',  label: 'Gentle' },
]

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function EditScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { reminders, loading, updateReminder, deleteReminder } = useReminders()
  const reminder = reminders.find((r) => r.id === id)

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
  const [soundOption, setSoundOption] = useState<SoundOption>({ type: 'builtin', name: 'default' })
  const [saving, setSaving] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [conflicts, setConflicts] = useState<Reminder[]>([])
  const [initialized, setInitialized] = useState(false)

  // Populate fields once reminder data loads
  useEffect(() => {
    if (initialized || !reminder) return
    setTitle(reminder.title)
    setDescription(reminder.description ?? '')
    setDate(new Date(reminder.scheduledAt))
    setCategory(reminder.category)
    setSoundOption(reminder.sound.type === 'builtin'
      ? { type: 'builtin', name: reminder.sound.name }
      : reminder.sound
    )
    setInitialized(true)
  }, [reminder, initialized])

  useEffect(() => {
    if (loading) return
    if (!reminder) { router.back(); return }
  }, [reminder, loading])

  useEffect(() => {
    if (!date) return
    setConflicts(detectConflicts(date.toISOString(), reminders, id))
  }, [date, reminders, id])

  useEffect(() => {
    if (title.trim().length > 0) setTitleError('')
  }, [title])

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
    if (!reminder) return
    if (!title.trim()) { setTitleError('Title is required'); return }
    if (date.getTime() <= Date.now()) {
      Alert.alert('Past Time', 'Please choose a future date and time.')
      return
    }
    setSaving(true)
    try {
      const updated: Reminder = {
        ...reminder,
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt: date.toISOString(),
        sound: soundOption,
        category,
      }
      await updateReminder(updated)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update reminder')
    } finally {
      setSaving(false)
    }
  }, [reminder, title, description, date, category, soundOption, updateReminder])

  const handleSave = useCallback(() => {
    if (conflicts.length > 0) {
      Alert.alert(
        'Scheduling Conflict',
        `Conflicts with: ${conflicts.map((c) => `"${c.title}" at ${formatTime(new Date(c.scheduledAt))}`).join(', ')}.\n\nProceed anyway?`,
        [
          { text: 'Reschedule', style: 'cancel' },
          { text: 'Update Anyway', onPress: doSave },
        ]
      )
    } else {
      doSave()
    }
  }, [conflicts, doSave])

  const handleDelete = () => {
    Alert.alert('Delete Reminder', `Delete "${reminder?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!id) return
          await deleteReminder(id)
          router.back()
        },
      },
    ])
  }

  if (!reminder) return null

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit reminder</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={17} color={colors.negative} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {conflicts.length > 0 && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.conflictBanner}>
              <Ionicons name="warning-outline" size={15} color={colors.negative} />
              <Text style={styles.conflictText}>
                Conflicts with {conflicts.map((c) => `"${c.title}" (${formatTime(new Date(c.scheduledAt))})`).join(', ')}
              </Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <TextInput
              style={[styles.titleInput, titleError ? styles.inputError : null]}
              placeholder="What do you need to do?"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
              maxLength={100}
            />
            {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Text style={styles.fieldLabel}>When</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.pickerBtn, { flex: 1 }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.pickerBtnText}>{formatDate(date)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerBtn, styles.timeBtn]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.pickerBtnText}>{formatTime(date)}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    category === cat && { backgroundColor: CATEGORY_COLORS[cat] + '20', borderColor: CATEGORY_COLORS[cat] },
                  ]}
                  onPress={() => { setCategory(cat); Haptics.selectionAsync() }}
                >
                  <Text style={[styles.categoryPillText, category === cat && { color: CATEGORY_COLORS[cat] }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Text style={styles.fieldLabel}>Sound</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundRow}>
              {SOUNDS.map((s) => (
                <TouchableOpacity
                  key={s.name}
                  style={[
                    styles.soundPill,
                    soundOption.type === 'builtin' && soundOption.name === s.name && styles.soundPillActive,
                  ]}
                  onPress={() => { setSoundOption({ type: 'builtin', name: s.name }); Haptics.selectionAsync() }}
                >
                  <Ionicons
                    name="musical-note-outline"
                    size={12}
                    color={soundOption.type === 'builtin' && soundOption.name === s.name ? '#000' : colors.textSecondary}
                  />
                  <Text style={[
                    styles.soundPillText,
                    soundOption.type === 'builtin' && soundOption.name === s.name && styles.soundPillTextActive,
                  ]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Custom Song chip */}
              <TouchableOpacity
                style={[styles.soundPill, soundOption.type === 'custom' && styles.soundPillActive]}
                onPress={async () => {
                  Haptics.selectionAsync()
                  try {
                    const picked = await pickCustomSound()
                    if (picked) {
                      setSoundOption({ type: 'custom', uri: picked.uri, fileName: picked.fileName, duration: 0 })
                    }
                  } catch (e: any) {
                    Alert.alert('Cannot Use File', e?.message ?? 'Failed to pick audio file.')
                  }
                }}
              >
                <Ionicons
                  name="musical-notes-outline"
                  size={12}
                  color={soundOption.type === 'custom' ? '#000' : colors.textSecondary}
                />
                <Text style={[styles.soundPillText, soundOption.type === 'custom' && styles.soundPillTextActive]}>
                  {soundOption.type === 'custom' ? soundOption.fileName : 'Custom Song'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.fieldLabel}>
              Note <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>
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

        <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.saveWrap}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Update reminder'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePickerModal value={date} mode="date" display="spinner" minimumDate={new Date()} onChange={handleDateChange} themeVariant="dark" />
      )}
      {showTimePicker && (
        <DateTimePickerModal value={date} mode="time" display="spinner" onChange={handleTimeChange} themeVariant="dark" />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.negative + '15', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, fontWeight: '500', color: colors.textSecondary },
  scroll: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  conflictBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    backgroundColor: colors.negative + '15', borderWidth: 1,
    borderColor: colors.negative + '35', borderRadius: radius.md, padding: spacing.md,
  },
  conflictText: { ...typography.caption, color: colors.negative, flex: 1 },
  titleInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    ...typography.h2, fontSize: 20, color: colors.textPrimary,
  },
  inputError: { borderColor: colors.negative },
  errorText: { ...typography.caption, color: colors.negative, marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.sm },
  optionalLabel: { fontSize: 12, fontWeight: '400', color: colors.textMuted },
  dateTimeRow: { flexDirection: 'row', gap: spacing.sm },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  timeBtn: { flexShrink: 0 },
  pickerBtnText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  categoryPillText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  soundRow: { gap: spacing.sm, paddingRight: spacing.sm },
  soundPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  soundPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  soundPillText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  soundPillTextActive: { color: '#000' },
  noteInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    ...typography.body, color: colors.textPrimary, minHeight: 88,
  },
  saveWrap: { padding: spacing.lg, paddingTop: 0 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.full, height: 52, alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
})
