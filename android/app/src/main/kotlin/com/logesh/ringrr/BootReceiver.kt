package com.logesh.ringrr

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Re-schedules all pending alarms after device reboot.
 * Reads Flutter's SharedPreferences (StringSet) and registers alarms.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        // Flutter's shared_preferences stores StringList as StringSet
        val remindersRaw = prefs.getStringSet("flutter.reminders", null) ?: return

        val now = System.currentTimeMillis()
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS", Locale.US)

        for (jsonStr in remindersRaw) {
            try {
                val json = JSONObject(jsonStr)
                if (json.getString("status") != "pending") continue

                val id = json.getString("id")
                val title = json.optString("title", "Reminder")
                val scheduledAt = json.getString("scheduledAt")
                val timeMs = dateFormat.parse(scheduledAt)?.time ?: continue

                if (timeMs <= now) continue

                val alarmId = id.hashCode()

                context.getSharedPreferences("alarm_metadata", Context.MODE_PRIVATE)
                    .edit()
                    .putString("alarm_${alarmId}_id", id)
                    .putString("alarm_${alarmId}_title", title)
                    .apply()

                val alarmIntent = Intent(context, AlarmReceiver::class.java).apply {
                    putExtra("alarm_id", alarmId)
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context, alarmId, alarmIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(timeMs, pendingIntent), pendingIntent)
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeMs, pendingIntent)
                }
            } catch (_: Exception) {}
        }
    }
}
