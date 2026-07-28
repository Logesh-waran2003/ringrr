import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ringrr/data/reminder_provider.dart';
import 'package:ringrr/models/reminder.dart';
import 'package:ringrr/theme/app_theme.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = ReminderProvider.of(context);
    final completed = state.completedReminders;
    final dismissed = state.dismissedReminders;
    final history = [...completed, ...dismissed]
      ..sort((a, b) => (b.completedAt ?? b.createdAt).compareTo(a.completedAt ?? a.createdAt));

    final doneCount = completed.length;
    final totalDone = history.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(22, 72, 22, 110),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'History',
            style: TextStyle(
              fontFamily: AppTheme.displayFont,
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '$totalDone completed',
            style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
          ),
          const SizedBox(height: 28),

          if (history.isEmpty)
            _EmptyHistory()
          else ...[
            // Stats row
            Row(
              children: [
                _HistoryStat(
                  value: '$doneCount',
                  label: 'COMPLETED',
                ),
                const SizedBox(width: 28),
                _HistoryStat(
                  value: '${dismissed.length}',
                  label: 'DISMISSED',
                ),
                const SizedBox(width: 28),
                _HistoryStat(
                  value: totalDone > 0 ? '${(doneCount / totalDone * 100).round()}%' : '0%',
                  label: 'RATE',
                  isHighlight: true,
                ),
              ],
            ),
            const SizedBox(height: 28),
            // List
            ...history.map((r) => _HistoryRow(reminder: r)),
          ],
        ],
      ),
    );
  }
}

class _HistoryStat extends StatelessWidget {
  final String value;
  final String label;
  final bool isHighlight;

  const _HistoryStat({required this.value, required this.label, this.isHighlight = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            fontFamily: AppTheme.displayFont,
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.2),
        ),
      ],
    );
  }
}

class _HistoryRow extends StatelessWidget {
  final Reminder reminder;
  const _HistoryRow({required this.reminder});

  @override
  Widget build(BuildContext context) {
    final state = ReminderProvider.of(context);
    final isDone = reminder.status == ReminderStatus.completed;
    final dateStr = DateFormat('MMM d, h:mm a').format(reminder.completedAt ?? reminder.scheduledAt);

    return Dismissible(
      key: Key('h_${reminder.id}'),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => state.delete(reminder.id),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppColors.primary.withValues(alpha: 0.1),
        child: const Icon(Icons.delete_outline, color: AppColors.primary, size: 18),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reminder.title,
                    style: TextStyle(
                      fontFamily: AppTheme.displayFont,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                      decoration: isDone ? TextDecoration.lineThrough : null,
                      decorationColor: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    dateStr,
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.textMuted.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                isDone ? 'Done' : 'Skipped',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.only(top: 80),
        child: Column(
          children: [
            Text(
              'No history yet',
              style: TextStyle(
                fontFamily: AppTheme.displayFont,
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Completed reminders will appear here',
              style: TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
