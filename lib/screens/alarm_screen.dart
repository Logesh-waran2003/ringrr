import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:ringrr/data/reminder_provider.dart';
import 'package:ringrr/models/reminder.dart';
import 'package:ringrr/services/alarm_ringer.dart';
import 'package:ringrr/services/alarm_service.dart';
import 'package:ringrr/theme/app_theme.dart';

class AlarmScreen extends StatefulWidget {
  final Reminder reminder;
  const AlarmScreen({super.key, required this.reminder});

  @override
  State<AlarmScreen> createState() => _AlarmScreenState();
}

class _AlarmScreenState extends State<AlarmScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    // ponytail: slower 2s breathe for restrained, confident feel
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    AlarmRinger.start();
    Future.delayed(const Duration(milliseconds: 800), () {
      FlutterTts().speak('Reminder: ${widget.reminder.title}. ${widget.reminder.description}');
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    AlarmRinger.stop();
    super.dispose();
  }

  void _snooze() {
    AlarmRinger.stop();
    AlarmService.stopForegroundAlarm();
    final state = ReminderProvider.of(context);
    state.update(widget.reminder.copyWith(
      scheduledAt: DateTime.now().add(const Duration(minutes: 5)),
    ));
    Navigator.of(context).pop();
  }

  void _dismiss() {
    AlarmRinger.stop();
    AlarmService.stopForegroundAlarm();
    final state = ReminderProvider.of(context);
    state.dismiss(widget.reminder.id);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final time = DateFormat('h:mm').format(now);
    final ampm = DateFormat('a').format(now);
    final date = DateFormat('EEEE, MMMM d').format(now).toUpperCase();

    return PopScope(
      canPop: false, // Can't back out of alarm — must dismiss or snooze
      child: Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const SizedBox(height: 48),
              // RINGING indicator with pulsing dot
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedBuilder(
                    animation: _pulseCtrl,
                    builder: (context, child) {
                      final t = _pulseCtrl.value;
                      return Opacity(
                        opacity: 0.6 + t * 0.4,
                        child: child,
                      );
                    },
                    child: Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'RINGING',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ],
              ),
              const Spacer(flex: 2),
              // Time — breathing opacity
              AnimatedBuilder(
                animation: _pulseCtrl,
                builder: (context, child) {
                  return Opacity(
                    opacity: 0.85 + (_pulseCtrl.value * 0.15),
                    child: child,
                  );
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      time,
                      style: const TextStyle(
                        fontFamily: AppTheme.displayFont,
                        fontSize: 80,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        height: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      ampm,
                      style: const TextStyle(
                        fontFamily: AppTheme.displayFont,
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                date,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted,
                  letterSpacing: 2.5,
                ),
              ),
              const SizedBox(height: 40),
              // Reminder info
              Text(
                widget.reminder.title,
                style: const TextStyle(
                  fontFamily: AppTheme.displayFont,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              if (widget.reminder.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  widget.reminder.description,
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ],
              const Spacer(flex: 3),
              // Buttons
              SizedBox(
                width: double.infinity,
                height: 52,
                child: GestureDetector(
                  onTap: _dismiss,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Center(
                      child: Text(
                        'Dismiss',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: GestureDetector(
                  onTap: _snooze,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.border, width: 1.5),
                    ),
                    child: const Center(
                      child: Text(
                        'Snooze 5 min',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    ));
  }
}
