package com.logesh.ringrr

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class AlarmForegroundService : Service() {
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val reminderId = intent.getStringExtra(EXTRA_REMINDER_ID) ?: ""
                val title = intent.getStringExtra(EXTRA_TITLE) ?: "Reminder"
                startAlarm(reminderId, title)
            }
            ACTION_STOP -> stopAlarm()
        }
        return START_NOT_STICKY
    }

    private fun startAlarm(reminderId: String, title: String) {
        // Acquire wake lock to keep CPU alive
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "ringrr:alarm"
        ).apply { acquire(5 * 60 * 1000L) } // 5 min max

        // Create notification channel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Alarm", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                setSound(null, null) // We play our own sound
                enableVibration(true)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }

        // Full screen intent to launch app
        val fullScreenIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("alarm_reminder_id", reminderId)
        }
        val pendingIntent = PendingIntent.getActivity(
            this, reminderId.hashCode(), fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Build foreground notification (required for foreground service)
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText("Tap to open alarm")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(pendingIntent, true)
            .setOngoing(true)
            .setAutoCancel(false)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        // Start ringing
        AlarmRinger.start(applicationContext)

        // Turn screen on and launch the activity with alarm flags
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("alarm_reminder_id", reminderId)
            putExtra("alarm_locked", true)
        }
        startActivity(launchIntent)
    }

    private fun stopAlarm() {
        AlarmRinger.stop()
        wakeLock?.release()
        wakeLock = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        AlarmRinger.stop()
        wakeLock?.release()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START = "com.logesh.ringrr.START_ALARM"
        const val ACTION_STOP = "com.logesh.ringrr.STOP_ALARM"
        const val EXTRA_REMINDER_ID = "reminder_id"
        const val EXTRA_TITLE = "title"
        const val CHANNEL_ID = "ringrr_alarm_service"
        const val NOTIFICATION_ID = 42

        fun start(context: Context, reminderId: String, title: String) {
            val intent = Intent(context, AlarmForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_REMINDER_ID, reminderId)
                putExtra(EXTRA_TITLE, title)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, AlarmForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
