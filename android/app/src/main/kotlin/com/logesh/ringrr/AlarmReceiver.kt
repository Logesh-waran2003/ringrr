package com.logesh.ringrr

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences

/**
 * Receives alarm broadcasts from AndroidAlarmManager and starts the
 * foreground service to ring + wake + launch the alarm UI.
 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getIntExtra("alarm_id", -1)
        if (alarmId == -1) return

        // Look up reminder info from shared preferences
        val prefs = context.getSharedPreferences("alarm_metadata", Context.MODE_PRIVATE)
        val reminderId = prefs.getString("alarm_${alarmId}_id", "") ?: ""
        val title = prefs.getString("alarm_${alarmId}_title", "Reminder") ?: "Reminder"

        AlarmForegroundService.start(context, reminderId, title)
    }
}
