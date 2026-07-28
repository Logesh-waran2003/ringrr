package com.logesh.ringrr

import android.app.AlarmManager
import android.app.KeyguardManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.logesh.ringrr/alarm_ringer"
    private var pendingAlarmReminderId: String? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "startRinging" -> {
                    AlarmRinger.start(applicationContext)
                    result.success(null)
                }
                "stopRinging" -> {
                    AlarmRinger.stop()
                    result.success(null)
                }
                "stopForegroundAlarm" -> {
                    AlarmForegroundService.stop(applicationContext)
                    clearLockScreenFlags()
                    result.success(null)
                }
                "scheduleNativeAlarm" -> {
                    val id = call.argument<Int>("id") ?: 0
                    val timeMs = call.argument<Long>("timeMs") ?: 0L
                    val reminderId = call.argument<String>("reminderId") ?: ""
                    val title = call.argument<String>("title") ?: "Reminder"
                    scheduleAlarm(id, timeMs, reminderId, title)
                    result.success(null)
                }
                "cancelNativeAlarm" -> {
                    val id = call.argument<Int>("id") ?: 0
                    cancelAlarm(id)
                    result.success(null)
                }
                "getPendingAlarmId" -> {
                    result.success(pendingAlarmReminderId)
                    pendingAlarmReminderId = null
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun scheduleAlarm(id: Int, timeMs: Long, reminderId: String, title: String) {
        // Save metadata so the receiver can look it up
        val prefs = getSharedPreferences("alarm_metadata", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("alarm_${id}_id", reminderId)
            .putString("alarm_${id}_title", title)
            .apply()

        val intent = Intent(this, AlarmReceiver::class.java).apply {
            putExtra("alarm_id", id)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            this, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setAlarmClock(
                    AlarmManager.AlarmClockInfo(timeMs, pendingIntent),
                    pendingIntent
                )
            } else {
                // Fallback: inexact but will still fire
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeMs, pendingIntent)
            }
        } else {
            alarmManager.setAlarmClock(
                AlarmManager.AlarmClockInfo(timeMs, pendingIntent),
                pendingIntent
            )
        }
    }

    private fun cancelAlarm(id: Int) {
        val intent = Intent(this, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            this, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(pendingIntent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleAlarmIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleAlarmIntent(intent)
    }

    private fun handleAlarmIntent(intent: Intent?) {
        val reminderId = intent?.getStringExtra("alarm_reminder_id")
        val isLocked = intent?.getBooleanExtra("alarm_locked", false) ?: false

        if (reminderId != null && reminderId.isNotEmpty()) {
            // Show over lock screen
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true)
                setTurnScreenOn(true)
                val km = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                km.requestDismissKeyguard(this, null)
            } else {
                @Suppress("DEPRECATION")
                window.addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                )
            }

            pendingAlarmReminderId = reminderId
            flutterEngine?.dartExecutor?.binaryMessenger?.let { messenger ->
                MethodChannel(messenger, CHANNEL).invokeMethod("alarmFired", reminderId)
            }
        }
    }

    private fun clearLockScreenFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(false)
            setTurnScreenOn(false)
        } else {
            @Suppress("DEPRECATION")
            window.clearFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
    }
}
