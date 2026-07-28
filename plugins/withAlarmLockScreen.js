/**
 * Expo config plugin — adds showWhenLocked + turnScreenOn to MainActivity
 * so the alarm UI appears over the Android lock screen.
 *
 * Applied automatically during `expo prebuild` / `expo run:android`.
 */
const { withAndroidManifest } = require('@expo/config-plugins')

module.exports = function withAlarmLockScreen(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults
    const mainApplication = manifest.manifest.application?.[0]

    if (!mainApplication) {
      console.warn('[withAlarmLockScreen] No <application> tag found in AndroidManifest')
      return cfg
    }

    const activities = mainApplication.activity ?? []

    // Match both short name (.MainActivity) and fully-qualified name
    const mainActivity = activities.find(
      (a) =>
        a.$?.['android:name'] === '.MainActivity' ||
        a.$?.['android:name']?.endsWith('.MainActivity')
    )

    if (!mainActivity) {
      console.warn('[withAlarmLockScreen] MainActivity not found in AndroidManifest')
      return cfg
    }

    // These two attributes are required for the alarm UI to surface over the
    // lock screen without the user having to manually unlock first.
    mainActivity.$['android:showWhenLocked'] = 'true'
    mainActivity.$['android:turnScreenOn'] = 'true'

    return cfg
  })
}
