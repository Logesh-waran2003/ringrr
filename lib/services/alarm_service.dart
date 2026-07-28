import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ringrr/data/reminder_repository.dart';
import 'package:ringrr/models/reminder.dart';
import 'package:ringrr/screens/alarm_screen.dart';
import 'package:ringrr/services/navigator_key.dart';

/// Alarm service that schedules alarms via native Android AlarmManager.
/// Flow: Dart scheduleAlarm → native AlarmManager.setAlarmClock →
/// AlarmReceiver → AlarmForegroundService (rings + wakes + launches app)
class AlarmService {
  static const _channel = MethodChannel('com.logesh.ringrr/alarm_ringer');

  static Future<void> init() async {
    // Nothing to init — native AlarmManager doesn't need initialization
  }

  /// Schedule alarm via native Android AlarmManager (setAlarmClock)
  static Future<void> scheduleAlarm(Reminder reminder) async {
    if (reminder.scheduledAt.isBefore(DateTime.now())) return;

    try {
      await _channel.invokeMethod('scheduleNativeAlarm', {
        'id': reminder.id.hashCode,
        'timeMs': reminder.scheduledAt.millisecondsSinceEpoch,
        'reminderId': reminder.id,
        'title': reminder.title,
      });
      debugPrint('[AlarmService] Scheduled: ${reminder.title} at ${reminder.scheduledAt}');
    } catch (e) {
      debugPrint('[AlarmService] Failed to schedule: $e');
    }
  }

  /// Cancel a scheduled alarm
  static Future<void> cancelAlarm(String reminderId) async {
    try {
      await _channel.invokeMethod('cancelNativeAlarm', {
        'id': reminderId.hashCode,
      });
    } catch (e) {
      debugPrint('[AlarmService] Failed to cancel: $e');
    }
  }

  /// Stop the foreground ringing service
  static Future<void> stopForegroundAlarm() async {
    try {
      await _channel.invokeMethod('stopForegroundAlarm');
    } catch (e) {
      debugPrint('[AlarmService] Failed to stop foreground: $e');
    }
  }

  /// Handle when the app is launched/brought to front by an alarm intent
  static Future<void> handleAlarmIntent(String reminderId) async {
    final reminder = await ReminderRepository().getById(reminderId);
    if (reminder == null) return;

    navigatorKey.currentState?.push(
      MaterialPageRoute<void>(builder: (_) => AlarmScreen(reminder: reminder)),
    );
  }
}
