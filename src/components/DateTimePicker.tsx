import React, { useState } from 'react'
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import RNDateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '@/constants/theme'

interface DateTimePickerProps {
  label: string
  value: Date
  mode: 'date' | 'time'
  onChange: (date: Date) => void
}

export function DateTimePicker({ label, value, mode, onChange }: DateTimePickerProps) {
  const [show, setShow] = useState(false)

  const formatted =
    mode === 'date'
      ? value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const handleChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (selected) onChange(selected)
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShow(true)}
        activeOpacity={0.75}
      >
        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={18}
          color={colors.primary}
        />
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{formatted}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{label}</Text>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <RNDateTimePicker
                value={value}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                themeVariant="dark"
                textColor={colors.textPrimary}
                style={{ backgroundColor: colors.surfaceElevated }}
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <RNDateTimePicker
            value={value}
            mode={mode}
            display="default"
            onChange={handleChange}
            themeVariant="dark"
          />
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  label: {
    ...typography.label,
    marginBottom: 2,
  },
  value: {
    ...typography.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.h3,
  },
  doneText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
})
