import 'package:flutter/services.dart';
import 'package:ringrr/services/alarm_service.dart';

class AlarmRinger {
  static const _channel = MethodChannel('com.logesh.ringrr/alarm_ringer');

  static bool _initialized = false;

  /// Initialize the method channel listener for incoming alarm intents
  static void init() {
    if (_initialized) return;
    _initialized = true;
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'alarmFired') {
        final reminderId = call.arguments as String;
        await AlarmService.handleAlarmIntent(reminderId);
      }
    });
  }

  static Future<void> start() async {
    await _channel.invokeMethod('startRinging');
  }

  static Future<void> stop() async {
    await _channel.invokeMethod('stopRinging');
  }

  /// Check if the app was launched by an alarm intent
  static Future<String?> getPendingAlarmId() async {
    return await _channel.invokeMethod<String?>('getPendingAlarmId');
  }
}
