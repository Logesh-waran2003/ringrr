import 'package:flutter/foundation.dart';
import 'package:ringrr/models/reminder.dart';
import 'package:ringrr/data/reminder_repository.dart';
import 'package:ringrr/services/alarm_service.dart';

class ReminderState extends ChangeNotifier {
  final _repo = ReminderRepository();
  List<Reminder> _reminders = [];

  List<Reminder> get reminders => _reminders;

  List<Reminder> get pendingReminders =>
      _reminders.where((r) => r.status == ReminderStatus.pending).toList();

  List<Reminder> get completedReminders =>
      _reminders.where((r) => r.status == ReminderStatus.completed).toList();

  List<Reminder> get dismissedReminders =>
      _reminders.where((r) => r.status == ReminderStatus.dismissed).toList();

  List<Reminder> get overdueReminders =>
      _reminders.where((r) => r.status == ReminderStatus.pending && r.scheduledAt.isBefore(DateTime.now())).toList();

  List<Reminder> get todayReminders {
    final now = DateTime.now();
    final endOfDay = DateTime(now.year, now.month, now.day + 1);
    return _reminders.where((r) =>
      r.status == ReminderStatus.pending &&
      r.scheduledAt.isAfter(now) &&
      r.scheduledAt.isBefore(endOfDay)
    ).toList();
  }

  List<Reminder> get tomorrowReminders {
    final now = DateTime.now();
    final startOfTomorrow = DateTime(now.year, now.month, now.day + 1);
    final endOfTomorrow = startOfTomorrow.add(const Duration(days: 1));
    return _reminders.where((r) =>
        r.scheduledAt.isAfter(startOfTomorrow) && r.scheduledAt.isBefore(endOfTomorrow) ||
        r.scheduledAt.isAtSameMomentAs(startOfTomorrow)).toList();
  }

  List<Reminder> get upcomingReminders {
    final now = DateTime.now();
    final endOfTomorrow = DateTime(now.year, now.month, now.day + 2);
    return _reminders.where((r) =>
        !r.scheduledAt.isBefore(endOfTomorrow)).toList();
  }

  List<Reminder> get completedToday {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    return completedReminders.where((r) =>
        r.completedAt != null && !r.completedAt!.isBefore(startOfDay)).toList();
  }

  double get completionRate {
    final done = completedToday.length;
    final pending = pendingReminders.length;
    final total = done + pending;
    if (total == 0) return 0.0;
    return done / total;
  }

  Future<void> load() async {
    _reminders = await _repo.getAll();
    notifyListeners();
  }

  Future<void> add(Reminder reminder) async {
    await _repo.save(reminder);
    _reminders.add(reminder);
    AlarmService.scheduleAlarm(reminder);
    notifyListeners();
  }

  Future<void> update(Reminder reminder) async {
    await _repo.update(reminder);
    final idx = _reminders.indexWhere((r) => r.id == reminder.id);
    if (idx != -1) _reminders[idx] = reminder;
    AlarmService.cancelAlarm(reminder.id);
    AlarmService.scheduleAlarm(reminder);
    notifyListeners();
  }

  Future<void> delete(String id) async {
    await _repo.delete(id);
    _reminders.removeWhere((r) => r.id == id);
    AlarmService.cancelAlarm(id);
    notifyListeners();
  }

  Future<void> markComplete(String id) async {
    final idx = _reminders.indexWhere((r) => r.id == id);
    if (idx == -1) return;
    final updated = _reminders[idx].copyWith(
      status: ReminderStatus.completed,
      completedAt: DateTime.now(),
    );
    await _repo.update(updated);
    _reminders[idx] = updated;
    AlarmService.cancelAlarm(id);
    notifyListeners();
  }

  Future<void> dismiss(String id) async {
    final idx = _reminders.indexWhere((r) => r.id == id);
    if (idx == -1) return;
    final updated = _reminders[idx].copyWith(status: ReminderStatus.dismissed);
    await _repo.update(updated);
    _reminders[idx] = updated;
    AlarmService.cancelAlarm(id);
    notifyListeners();
  }
}
