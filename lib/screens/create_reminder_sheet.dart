import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ringrr/data/reminder_provider.dart';
import 'package:ringrr/models/reminder.dart';
import 'package:ringrr/theme/app_theme.dart';

/// Shows the create reminder bottom sheet.
Future<void> showCreateReminderSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (_) => const _ReminderSheet(),
  );
}

/// Shows the edit reminder bottom sheet.
Future<void> showEditReminderSheet(BuildContext context, Reminder reminder) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (_) => _ReminderSheet(existing: reminder),
  );
}

class _ReminderSheet extends StatefulWidget {
  final Reminder? existing;
  const _ReminderSheet({this.existing});

  @override
  State<_ReminderSheet> createState() => _ReminderSheetState();
}

class _ReminderSheetState extends State<_ReminderSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _noteCtrl;
  late ReminderCategory _category;
  late String _sound;
  late DateTime _date;
  late TimeOfDay _time;
  bool _showDeleteConfirm = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final r = widget.existing;
    _titleCtrl = TextEditingController(text: r?.title ?? '');
    _noteCtrl = TextEditingController(text: r?.description ?? '');
    _category = r?.category ?? ReminderCategory.personal;
    _sound = r?.sound ?? 'default';
    _date = r?.scheduledAt ?? DateTime.now().add(const Duration(hours: 1));
    _time = TimeOfDay.fromDateTime(r?.scheduledAt ?? DateTime.now().add(const Duration(hours: 1)));
    _titleCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  DateTime get _scheduledAt => DateTime(_date.year, _date.month, _date.day, _time.hour, _time.minute);

  bool get _hasConflict {
    final state = ReminderProvider.of(context);
    final target = _scheduledAt;
    return state.pendingReminders.any((r) {
      if (_isEdit && r.id == widget.existing!.id) return false;
      return (r.scheduledAt.difference(target).inMinutes).abs() <= 5;
    });
  }

  void _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (ctx, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: ColorScheme.dark(
            primary: AppColors.primary,
            surface: AppColors.surface,
            onSurface: AppColors.textPrimary,
            onPrimary: Colors.white,
          ),
          datePickerTheme: DatePickerThemeData(
            backgroundColor: AppColors.surface,
            surfaceTintColor: Colors.transparent,
            headerBackgroundColor: AppColors.surfaceElevated,
            headerForegroundColor: AppColors.textPrimary,
            dayForegroundColor: WidgetStateColor.resolveWith((states) =>
              states.contains(WidgetState.selected) ? Colors.white : AppColors.textPrimary),
            dayBackgroundColor: WidgetStateColor.resolveWith((states) =>
              states.contains(WidgetState.selected) ? AppColors.primary : Colors.transparent),
            todayForegroundColor: WidgetStateColor.resolveWith((states) =>
              states.contains(WidgetState.selected) ? Colors.white : AppColors.primary),
            todayBorder: const BorderSide(color: AppColors.primary),
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _date = picked);
  }

  void _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _time,
      builder: (ctx, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: ColorScheme.dark(
            primary: AppColors.primary,
            secondary: AppColors.primary,
            tertiary: AppColors.primary,
            surface: AppColors.surfaceElevated,
            onSurface: AppColors.textPrimary,
            onPrimary: Colors.white,
            primaryContainer: AppColors.primary.withValues(alpha: 0.2),
            onPrimaryContainer: AppColors.primary,
            tertiaryContainer: AppColors.primary.withValues(alpha: 0.2),
            onTertiaryContainer: AppColors.primary,
          ),
          timePickerTheme: TimePickerThemeData(
            backgroundColor: AppColors.surface,
            hourMinuteColor: AppColors.surfaceElevated,
            hourMinuteTextColor: AppColors.textPrimary,
            dayPeriodColor: WidgetStateColor.resolveWith((states) =>
              states.contains(WidgetState.selected) ? AppColors.primary.withValues(alpha: 0.2) : AppColors.surfaceElevated),
            dayPeriodTextColor: WidgetStateColor.resolveWith((states) =>
              states.contains(WidgetState.selected) ? AppColors.primary : AppColors.textMuted),
            dayPeriodBorderSide: const BorderSide(color: AppColors.border),
            dialHandColor: AppColors.primary,
            dialBackgroundColor: AppColors.surfaceElevated,
            dialTextColor: AppColors.textPrimary,
            entryModeIconColor: AppColors.textMuted,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _time = picked);
  }

  void _save() {
    final state = ReminderProvider.of(context);
    if (_isEdit) {
      state.update(widget.existing!.copyWith(
        title: _titleCtrl.text.trim(),
        description: _noteCtrl.text.trim(),
        category: _category,
        sound: _sound,
        scheduledAt: _scheduledAt,
      ));
    } else {
      state.add(Reminder(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: _titleCtrl.text.trim(),
        description: _noteCtrl.text.trim(),
        category: _category,
        sound: _sound,
        scheduledAt: _scheduledAt,
        createdAt: DateTime.now(),
      ));
    }
    Navigator.pop(context);
  }

  void _delete() {
    final state = ReminderProvider.of(context);
    state.delete(widget.existing!.id);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Color(0xFF0A0A0C),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            child: Row(
              children: [
                _circleButton(Icons.close, onTap: () => Navigator.pop(context)),
                const Spacer(),
                Text(
                  _isEdit ? 'Edit reminder' : 'New reminder',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontFamily: AppTheme.displayFont),
                ),
                const Spacer(),
                if (_isEdit)
                  _circleButton(Icons.delete_outline, negative: true, onTap: () => setState(() => _showDeleteConfirm = true))
                else
                  const SizedBox(width: 40),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 8),
          // Body
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 0, 20, bottomInset + 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Delete confirm banner
                  if (_showDeleteConfirm) ...[
                    _deleteConfirmBanner(),
                    const SizedBox(height: 16),
                  ],
                  // Title
                  _sectionLabel('Title'),
                  const SizedBox(height: 10),
                  _inputField(_titleCtrl, 'Remind me to...'),
                  const SizedBox(height: 24),
                  // Category
                  _sectionLabel('Category'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ReminderCategory.values.map((c) => _categoryChip(c)).toList(),
                  ),
                  const SizedBox(height: 24),
                  // When
                  _sectionLabel('When'),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _pillButton(DateFormat('EEE, MMM d').format(_date), _pickDate)),
                      const SizedBox(width: 10),
                      Expanded(child: _pillButton(_time.format(context), _pickTime)),
                    ],
                  ),
                  if (_hasConflict) ...[
                    const SizedBox(height: 10),
                    _conflictBanner(),
                  ],
                  const SizedBox(height: 24),
                  // Sound
                  _sectionLabel('Sound'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ['default', 'chime', 'bell', 'digital', 'gentle'].map((s) => _soundChip(s)).toList(),
                  ),
                  const SizedBox(height: 24),
                  // Note
                  _sectionLabel('Note'),
                  const SizedBox(height: 10),
                  _inputField(_noteCtrl, 'Add a detail (optional)', multiline: true),
                ],
              ),
            ),
          ),
          // CTA
          _ctaButton(bottomInset),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(
    text.toUpperCase(),
    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1.5),
  );

  Widget _circleButton(IconData icon, {VoidCallback? onTap, bool negative = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: negative ? AppColors.negative.withValues(alpha: 0.15) : AppColors.surfaceElevated,
          border: negative ? null : Border.all(color: AppColors.border),
        ),
        child: Icon(icon, size: 20, color: negative ? AppColors.negative : AppColors.textSecondary),
      ),
    );
  }

  Widget _inputField(TextEditingController ctrl, String hint, {bool multiline = false}) {
    return TextField(
      controller: ctrl,
      maxLines: multiline ? null : 1,
      minLines: multiline ? 3 : 1,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary, fontFamily: AppTheme.displayFont),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textMuted),
        filled: true,
        fillColor: AppColors.surfaceElevated,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
        constraints: multiline ? const BoxConstraints(minHeight: 80) : null,
      ),
    );
  }

  Widget _categoryChip(ReminderCategory c) {
    final selected = _category == c;
    final color = c.color;
    return GestureDetector(
      onTap: () => setState(() => _category = c),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: selected ? 0.24 : 0.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? color : color.withValues(alpha: 0.35)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 7, height: 7, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(c.label, style: TextStyle(color: selected ? color : AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _soundChip(String s) {
    final selected = _sound == s;
    final label = s[0].toUpperCase() + s.substring(1);
    return GestureDetector(
      onTap: () => setState(() => _sound = s),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.graphic_eq_rounded, size: 14, color: selected ? Colors.white : AppColors.textMuted),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pillButton(String text, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Text(text, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ),
    );
  }

  Widget _conflictBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.negative.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.negative.withValues(alpha: 0.3)),
      ),
      child: const Row(
        children: [
          Icon(Icons.warning_amber_rounded, size: 18, color: AppColors.negative),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Another reminder is scheduled within 5 minutes of this time.',
              style: TextStyle(fontSize: 12, color: AppColors.negative),
            ),
          ),
        ],
      ),
    );
  }

  Widget _deleteConfirmBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.negative.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.negative.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Text('Delete this reminder?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.negative)),
          ),
          GestureDetector(
            onTap: () => setState(() => _showDeleteConfirm = false),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Text('Cancel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
            ),
          ),
          GestureDetector(
            onTap: _delete,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: AppColors.negative, borderRadius: BorderRadius.circular(8)),
              child: const Text('Delete', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _ctaButton(double bottomInset) {
    final enabled = _titleCtrl.text.trim().isNotEmpty;
    return Container(
      padding: EdgeInsets.fromLTRB(18, 12, 18, bottomInset > 0 ? 12 : 24),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: GestureDetector(
        onTap: enabled ? _save : null,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: enabled ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
            border: enabled ? null : Border.all(color: AppColors.border),
          ),
          child: Text(
            _isEdit ? 'Update reminder' : 'Create reminder',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
            color: enabled ? Colors.white : AppColors.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}
