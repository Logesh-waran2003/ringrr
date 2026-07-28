import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import type { Reminder } from '@/types/reminder'

const SOUNDS_DIR = (FileSystem.documentDirectory ?? '') + 'alarm_sounds/'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export async function ensureSoundsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SOUNDS_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SOUNDS_DIR, { intermediates: true })
  }
}

/**
 * Opens the document picker for audio files, validates the selection,
 * copies it to persistent app storage, and returns the permanent URI + filename.
 * Returns null if the user cancels.
 * Throws a user-friendly Error if validation or copy fails.
 */
export async function pickCustomSound(): Promise<{ uri: string; fileName: string } | null> {
  await ensureSoundsDir()

  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
  })

  // User cancelled
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null
  }

  const asset = result.assets[0]

  // Validate size if the picker provided it
  if (asset.size !== undefined && asset.size !== null && asset.size > MAX_FILE_SIZE) {
    throw new Error(
      `File is too large (max 20 MB). Selected file is ${(asset.size / 1024 / 1024).toFixed(1)} MB.`
    )
  }

  // Double-check size via file system in case picker didn't provide it
  if (!asset.size) {
    const info = await FileSystem.getInfoAsync(asset.uri, { size: true })
    if (info.exists && (info as any).size > MAX_FILE_SIZE) {
      throw new Error('File is too large (max 20 MB).')
    }
    if (!info.exists) {
      throw new Error('Could not access the selected file. Please try again.')
    }
  }

  // Derive extension from original filename
  const originalName = asset.name ?? 'audio'
  const ext = originalName.includes('.')
    ? originalName.split('.').pop()?.toLowerCase() ?? 'mp3'
    : 'mp3'

  // Unique destination filename
  const uniqueName = `alarm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const destUri = SOUNDS_DIR + uniqueName

  try {
    await FileSystem.copyAsync({ from: asset.uri, to: destUri })
  } catch (e: any) {
    throw new Error(
      'Failed to copy audio file. The file may be DRM-protected or corrupted.'
    )
  }

  return { uri: destUri, fileName: originalName }
}

/**
 * Deletes the file at soundUri from storage, but ONLY if no other reminder
 * in allReminders (the list after the target reminder was removed) still
 * references it. Safe to call even if the file no longer exists.
 */
export async function cleanupCustomSound(
  soundUri: string,
  allReminders: Reminder[]
): Promise<void> {
  const stillUsed = allReminders.some(
    (r) => r.sound.type === 'custom' && r.sound.uri === soundUri
  )
  if (stillUsed) return

  try {
    const info = await FileSystem.getInfoAsync(soundUri)
    if (info.exists) {
      await FileSystem.deleteAsync(soundUri, { idempotent: true })
    }
  } catch (e) {
    console.warn('[soundStorage] Failed to delete custom sound file:', e)
  }
}
