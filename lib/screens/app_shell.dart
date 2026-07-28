import 'package:flutter/material.dart';
import 'package:ringrr/screens/create_reminder_sheet.dart';
import 'package:ringrr/screens/history_screen.dart';
import 'package:ringrr/screens/home_screen.dart';
import 'package:ringrr/theme/app_theme.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;
  double _fabScale = 1.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 150),
        child: _currentIndex == 0
            ? const HomeScreen(key: ValueKey('home'))
            : const HistoryScreen(key: ValueKey('history')),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.bg,
          border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 56,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _NavTab(
                  icon: Icons.access_time_rounded,
                  selected: _currentIndex == 0,
                  onTap: () => setState(() => _currentIndex = 0),
                ),
                // FAB with press state — scale 0.92 per Emil Kowalski rules (deeper for primary action)
                GestureDetector(
                  onTapDown: (_) => setState(() => _fabScale = 0.92),
                  onTapUp: (_) {
                    setState(() => _fabScale = 1.0);
                    showCreateReminderSheet(context);
                  },
                  onTapCancel: () => setState(() => _fabScale = 1.0),
                  child: AnimatedScale(
                    scale: _fabScale,
                    duration: const Duration(milliseconds: 100),
                    curve: Curves.easeOut,
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add, color: Colors.white, size: 24),
                    ),
                  ),
                ),
                _NavTab(
                  icon: Icons.check_circle_outline_rounded,
                  selected: _currentIndex == 1,
                  onTap: () => setState(() => _currentIndex = 1),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _NavTab({required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 56,
        height: 56,
        child: Icon(
          icon,
          color: selected ? AppColors.textPrimary : AppColors.textMuted,
          size: 24,
        ),
      ),
    );
  }
}
