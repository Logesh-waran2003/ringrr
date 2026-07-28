import 'package:flutter/widgets.dart';
import 'package:ringrr/data/reminder_state.dart';

class ReminderProvider extends InheritedNotifier<ReminderState> {
  const ReminderProvider({
    super.key,
    required ReminderState state,
    required super.child,
  }) : super(notifier: state);

  static ReminderState of(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<ReminderProvider>()!
        .notifier!;
  }
}
