import 'package:flutter_test/flutter_test.dart';
import 'package:ringrr/main.dart';
import 'package:ringrr/data/reminder_state.dart';

void main() {
  testWidgets('App renders', (tester) async {
    await tester.pumpWidget(RingrrApp(state: ReminderState()));
    expect(find.byType(RingrrApp), findsOneWidget);
  });
}
