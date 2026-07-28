import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:ringrr/theme/app_theme.dart';

class AnalogClock extends StatefulWidget {
  final double size;
  final List<DateTime> reminderTimes;
  const AnalogClock({super.key, this.size = 140, this.reminderTimes = const []});

  @override
  State<AnalogClock> createState() => _AnalogClockState();
}

class _AnalogClockState extends State<AnalogClock>
    with SingleTickerProviderStateMixin {
  late final AnimationController _secondCtrl;
  late Timer _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _secondCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _now = DateTime.now());
      _secondCtrl.forward(from: 0);
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _secondCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _secondCtrl,
      builder: (context, _) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _ClockPainter(
            time: _now,
            secondAnimation: CurvedAnimation(
              parent: _secondCtrl,
              curve: Curves.easeOutCubic,
            ).value,
            reminderTimes: widget.reminderTimes,
          ),
        );
      },
    );
  }
}

class _ClockPainter extends CustomPainter {
  final DateTime time;
  final double secondAnimation;
  final List<DateTime> reminderTimes;

  _ClockPainter({required this.time, required this.secondAnimation, this.reminderTimes = const []});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Tick marks
    for (int i = 0; i < 12; i++) {
      final angle = (i * 30) * pi / 180 - pi / 2;
      final isCardinal = i % 3 == 0;
      final tickLength = isCardinal ? 12.0 : 8.0;
      final tickWidth = isCardinal ? 1.5 : 1.0;
      final tickColor = isCardinal ? AppColors.textMuted : AppColors.border;

      final outerPoint = Offset(
        center.dx + (radius - 4) * cos(angle),
        center.dy + (radius - 4) * sin(angle),
      );
      final innerPoint = Offset(
        center.dx + (radius - 4 - tickLength) * cos(angle),
        center.dy + (radius - 4 - tickLength) * sin(angle),
      );

      canvas.drawLine(
        outerPoint,
        innerPoint,
        Paint()
          ..color = tickColor
          ..strokeWidth = tickWidth
          ..strokeCap = StrokeCap.round,
      );
    }

    // Hour hand
    final hourAngle =
        ((time.hour % 12) + time.minute / 60) * 30 * pi / 180 - pi / 2;
    _drawHand(canvas, center, hourAngle, radius * 0.4, 3, AppColors.textPrimary);

    // Minute hand
    final minuteAngle =
        (time.minute + time.second / 60) * 6 * pi / 180 - pi / 2;
    _drawHand(canvas, center, minuteAngle, radius * 0.55, 2, AppColors.textPrimary);

    // Second hand — smooth tick via easeOutCubic animation
    final secondAngle = (time.second) * 6 * pi / 180 - pi / 2;
    _drawHand(canvas, center, secondAngle, radius * 0.62, 1, AppColors.primary);

    // Reminder position dots on rim
    for (final time in reminderTimes) {
      final hour = time.hour % 12;
      final minute = time.minute;
      final angle = ((hour + minute / 60.0) * 30.0) * pi / 180 - pi / 2;
      final dotRadius = 3.5;
      final dotPosition = Offset(
        center.dx + (radius - 18) * cos(angle),
        center.dy + (radius - 18) * sin(angle),
      );
      canvas.drawCircle(dotPosition, dotRadius, Paint()..color = AppColors.primary.withValues(alpha: 0.7));
    }

    // Center dot
    canvas.drawCircle(center, 3, Paint()..color = AppColors.primary);
  }

  void _drawHand(Canvas canvas, Offset center, double angle, double length,
      double width, Color color) {
    final end = Offset(
      center.dx + length * cos(angle),
      center.dy + length * sin(angle),
    );
    canvas.drawLine(
      center,
      end,
      Paint()
        ..color = color
        ..strokeWidth = width
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_ClockPainter old) => true;
}
