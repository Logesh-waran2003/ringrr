import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ringrr/data/reminder_provider.dart';
import 'package:ringrr/data/reminder_repository.dart';
import 'package:ringrr/data/reminder_state.dart';
import 'package:ringrr/models/reminder.dart';
import 'package:ringrr/screens/app_shell.dart';
import 'package:ringrr/services/alarm_ringer.dart';
import 'package:ringrr/services/alarm_service.dart';
import 'package:ringrr/services/navigator_key.dart';
import 'package:ringrr/theme/app_theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  await AlarmService.init();
  AlarmRinger.init(); // Listen for alarm intents from native
  await _seedIfEmpty();

  final state = ReminderState();
  await state.load();

  runApp(RingrrApp(state: state));

  // Check if app was launched by an alarm
  WidgetsBinding.instance.addPostFrameCallback((_) async {
    final pendingId = await AlarmRinger.getPendingAlarmId();
    if (pendingId != null && pendingId.isNotEmpty) {
      await AlarmService.handleAlarmIntent(pendingId);
    }
  });
}

Future<void> _seedIfEmpty() async {
  final prefs = await SharedPreferences.getInstance();
  if (prefs.getStringList('reminders')?.isNotEmpty ?? false) return;

  final now = DateTime.now();
  final repo = ReminderRepository();

  final seeds = [
    Reminder(
      id: '1', title: 'Submit expense report', description: 'Q3 travel receipts to finance',
      category: ReminderCategory.work, scheduledAt: now.add(const Duration(hours: 2)),
      createdAt: now,
    ),
    Reminder(
      id: '2', title: 'Take vitamins', description: 'Morning supplements',
      category: ReminderCategory.health, scheduledAt: now.add(const Duration(hours: 4)),
      createdAt: now,
    ),
    Reminder(
      id: '3', title: 'Call mom', description: 'Check in about the weekend',
      category: ReminderCategory.personal, scheduledAt: now.add(const Duration(hours: 6)),
      createdAt: now,
    ),
    Reminder(
      id: '4', title: 'Team standup notes', description: 'Write up async summary',
      category: ReminderCategory.work, scheduledAt: now.add(const Duration(hours: 24, minutes: 30)),
      createdAt: now,
    ),
    Reminder(
      id: '5', title: 'Water the plants', description: 'Living room + balcony',
      category: ReminderCategory.health, scheduledAt: now.add(const Duration(hours: 26)),
      createdAt: now,
    ),
    Reminder(
      id: '6', title: 'Book dentist appointment', description: 'Annual cleaning',
      category: ReminderCategory.health, scheduledAt: now.add(const Duration(days: 4)),
      createdAt: now,
    ),
    Reminder(
      id: '7', title: 'Plan weekend trip', description: 'Look at cabins near the lake',
      category: ReminderCategory.social, scheduledAt: now.add(const Duration(days: 6)),
      createdAt: now,
    ),
  ];

  for (final r in seeds) {
    await repo.save(r);
  }
}

class RingrrApp extends StatelessWidget {
  final ReminderState state;

  const RingrrApp({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    return ReminderProvider(
      state: state,
      child: MaterialApp(
        navigatorKey: navigatorKey,
        title: 'Ringrr',
        theme: AppTheme.dark,
        debugShowCheckedModeBanner: false,
        home: const AppShell(),
      ),
    );
  }
}
