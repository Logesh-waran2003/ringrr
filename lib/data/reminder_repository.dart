import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ringrr/models/reminder.dart';

class ReminderRepository {
  static final ReminderRepository _instance = ReminderRepository._();
  factory ReminderRepository() => _instance;
  ReminderRepository._();

  static const _key = 'reminders';

  Future<List<Reminder>> getAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    return raw.map((e) => Reminder.fromJson(jsonDecode(e) as Map<String, dynamic>)).toList();
  }

  Future<void> save(Reminder reminder) async {
    final all = await getAll();
    all.add(reminder);
    await _persist(all);
  }

  Future<void> update(Reminder reminder) async {
    final all = await getAll();
    final idx = all.indexWhere((r) => r.id == reminder.id);
    if (idx != -1) {
      all[idx] = reminder;
      await _persist(all);
    }
  }

  Future<void> delete(String id) async {
    final all = await getAll();
    all.removeWhere((r) => r.id == id);
    await _persist(all);
  }

  Future<Reminder?> getById(String id) async {
    final all = await getAll();
    try {
      return all.firstWhere((r) => r.id == id);
    } on StateError {
      return null;
    }
  }

  Future<void> _persist(List<Reminder> reminders) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, reminders.map((r) => jsonEncode(r.toJson())).toList());
  }
}
