import 'package:flutter/material.dart';

class AppColors {
  static const bg = Color(0xFF000000);
  static const surface = Color(0xFF0A0A0C);
  static const surfaceElevated = Color(0xFF111114);
  static const border = Color(0xFF1A1A1E);
  static const primary = Color(0xFFE5252A);
  static const positive = Color(0xFF2ECC71);
  static const negative = Color(0xFFE5252A); // same as primary — red is the urgency color
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFFB0B3BE);
  static const textMuted = Color(0xFF5C5F6E);
  // Category colors removed — categories are text-only now
  static const personal = Color(0xFF5C5F6E);
  static const work = Color(0xFF5C5F6E);
  static const health = Color(0xFF5C5F6E);
  static const social = Color(0xFF5C5F6E);
}

class AppTheme {
  static const displayFont = 'InstrumentSans';

  static ThemeData get dark => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.bg,
    fontFamily: '.SF UI Text', // system sans
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      surface: AppColors.surface,
      error: AppColors.negative,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.bg,
      elevation: 0,
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontFamily: displayFont, color: AppColors.textPrimary, fontSize: 72, fontWeight: FontWeight.w700, height: 1),
      headlineLarge: TextStyle(fontFamily: displayFont, color: AppColors.textPrimary, fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.5),
      headlineMedium: TextStyle(fontFamily: displayFont, color: AppColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w600),
      titleLarge: TextStyle(fontFamily: displayFont, color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w600),
      titleMedium: TextStyle(fontFamily: displayFont, color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(color: AppColors.textPrimary, fontSize: 15),
      bodyMedium: TextStyle(color: AppColors.textSecondary, fontSize: 13),
      bodySmall: TextStyle(color: AppColors.textMuted, fontSize: 11),
      labelSmall: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 1.5),
    ),
  );
}
