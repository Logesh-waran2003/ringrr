import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ringrr/data/reminder_provider.dart';
import 'package:ringrr/models/reminder.dart';
import 'package:ringrr/screens/create_reminder_sheet.dart';
import 'package:ringrr/theme/app_theme.dart';

class ReminderCard extends StatefulWidget {
  final Reminder reminder;
  final bool isOverdue;
  final bool showDate;
  final int index;

  const ReminderCard({
    super.key,
    required this.reminder,
    this.isOverdue = false,
    this.showDate = false,
    this.index = 0,
  });

  @override
  State<ReminderCard> createState() => _ReminderCardState();
}

class _ReminderCardState extends State<ReminderCard> with SingleTickerProviderStateMixin {
  late final AnimationController _entryCtrl;
  late final Animation<double> _fadeIn;
  late final Animation<Offset> _slideIn;
  double _pressScale = 1.0;
  bool _completing = false;
  bool _exiting = false;

  static const _categoryAbbr = {
    ReminderCategory.personal: 'PER',
    ReminderCategory.work: 'WRK',
    ReminderCategory.health: 'HTH',
    ReminderCategory.social: 'SOC',
  };

  @override
  void initState() {
    super.initState();
    _entryCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _fadeIn = CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut);
    _slideIn = Tween<Offset>(begin: const Offset(0, 0.05), end: Offset.zero)
        .animate(CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOutCubic));

    // ponytail: stagger via Future.delayed — ceiling: if 50+ items, last card waits 2s. Upgrade: use SliverAnimatedList.
    Future.delayed(Duration(milliseconds: widget.index * 40), () {
      if (mounted) _entryCtrl.forward();
    });
  }

  @override
  void dispose() {
    _entryCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('h:mm a').format(widget.reminder.scheduledAt);

    return AnimatedOpacity(
      opacity: _exiting ? 0.0 : 1.0,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: _exiting ? const Offset(-0.3, 0) : Offset.zero,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        child: FadeTransition(
      opacity: _fadeIn,
      child: SlideTransition(
        position: _slideIn,
        // ponytail: Listener doesn't compete in gesture arena, so press visual works alongside Dismissible drag
        child: Listener(
          onPointerDown: (_) => setState(() => _pressScale = 0.97),
          onPointerUp: (_) => setState(() => _pressScale = 1.0),
          onPointerCancel: (_) => setState(() => _pressScale = 1.0),
          child: AnimatedScale(
            scale: _pressScale,
            duration: const Duration(milliseconds: 100),
            curve: Curves.easeOut,
            child: Dismissible(
              key: Key(widget.reminder.id),
              direction: DismissDirection.endToStart,
              onDismissed: (_) {
                final deletedReminder = widget.reminder;
                final state = ReminderProvider.of(context);
                state.delete(deletedReminder.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      '"${deletedReminder.title}" deleted',
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                    duration: const Duration(seconds: 4),
                    backgroundColor: const Color(0xFF1A1A1E),
                    behavior: SnackBarBehavior.floating,
                    margin: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    action: SnackBarAction(
                      label: 'Undo',
                      textColor: AppColors.primary,
                      onPressed: () => state.add(deletedReminder),
                    ),
                  ),
                );
              },
              background: Container(
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 20),
                color: AppColors.primary.withValues(alpha: 0.15),
                child: const Icon(Icons.delete_outline, color: AppColors.primary, size: 20),
              ),
              child: GestureDetector(
                onTap: () => showEditReminderSheet(context, widget.reminder),
                behavior: HitTestBehavior.opaque,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: const BoxDecoration(
                    border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
                  ),
                  child: Row(
                    children: [
                      // Time
                      SizedBox(
                        width: 64,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              timeStr,
                              style: TextStyle(
                                fontFamily: AppTheme.displayFont,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: widget.isOverdue ? AppColors.primary : AppColors.textSecondary,
                              ),
                            ),
                            if (widget.showDate)
                              Text(
                                DateFormat('EEE, MMM d').format(widget.reminder.scheduledAt),
                                style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Content
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.reminder.title,
                              style: const TextStyle(
                                fontFamily: AppTheme.displayFont,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (widget.reminder.description.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                widget.reminder.description,
                                style: const TextStyle(fontSize: 12.5, color: AppColors.textMuted),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Category abbreviation
                      Text(
                        _categoryAbbr[widget.reminder.category] ?? '',
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMuted,
                          letterSpacing: 0.8,
                          fontFamily: 'monospace',
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Complete button with red flash
                      GestureDetector(
                        onTap: () {
                          setState(() => _completing = true);
                          // Flash red for 250ms, then slide out for 250ms, then mark complete
                          Future.delayed(const Duration(milliseconds: 250), () {
                            if (!mounted) return;
                            setState(() => _exiting = true);
                          });
                          Future.delayed(const Duration(milliseconds: 500), () {
                            if (!mounted) return;
                            // ignore: use_build_context_synchronously
                            final state = ReminderProvider.of(context);
                            state.markComplete(widget.reminder.id);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    '"${widget.reminder.title}" completed',
                                    style: const TextStyle(color: Colors.white, fontSize: 13),
                                  ),
                                  duration: const Duration(seconds: 4),
                                  backgroundColor: const Color(0xFF1A1A1E),
                                  behavior: SnackBarBehavior.floating,
                                  margin: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  action: SnackBarAction(
                                    label: 'Undo',
                                    textColor: AppColors.primary,
                                    onPressed: () {
                                      state.update(widget.reminder.copyWith(
                                        status: ReminderStatus.pending,
                                        completedAt: null,
                                      ));
                                    },
                                  ),
                                ),
                              );
                            }
                          });
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          curve: Curves.easeOut,
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _completing ? AppColors.primary : Colors.transparent,
                            border: Border.all(
                              color: _completing ? AppColors.primary : AppColors.border,
                              width: 1.5,
                            ),
                          ),
                          child: Icon(
                            Icons.check,
                            size: 14,
                            color: _completing ? Colors.white : AppColors.textMuted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      ),
      ),
    );
  }
}
