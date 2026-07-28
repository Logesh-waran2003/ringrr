import 'package:flutter/material.dart';
import 'package:ringrr/theme/app_theme.dart';

enum ReminderCategory {
  personal,
  work,
  health,
  social;

  Color get color => switch (this) {
    ReminderCategory.personal => AppColors.personal,
    ReminderCategory.work => AppColors.work,
    ReminderCategory.health => AppColors.health,
    ReminderCategory.social => AppColors.social,
  };

  String get label => switch (this) {
    ReminderCategory.personal => 'Personal',
    ReminderCategory.work => 'Work',
    ReminderCategory.health => 'Health',
    ReminderCategory.social => 'Social',
  };
}

enum ReminderStatus { pending, completed, dismissed }

class Reminder {
  final String id;
  final String title;
  final String description;
  final ReminderCategory category;
  final String sound;
  final DateTime scheduledAt;
  final ReminderStatus status;
  final DateTime createdAt;
  final DateTime? completedAt;

  const Reminder({
    required this.id,
    required this.title,
    this.description = '',
    required this.category,
    this.sound = 'default',
    required this.scheduledAt,
    this.status = ReminderStatus.pending,
    required this.createdAt,
    this.completedAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'category': category.name,
    'sound': sound,
    'scheduledAt': scheduledAt.toIso8601String(),
    'status': status.name,
    'createdAt': createdAt.toIso8601String(),
    'completedAt': completedAt?.toIso8601String(),
  };

  factory Reminder.fromJson(Map<String, dynamic> json) => Reminder(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String? ?? '',
    category: ReminderCategory.values.byName(json['category'] as String),
    sound: json['sound'] as String? ?? 'default',
    scheduledAt: DateTime.parse(json['scheduledAt'] as String),
    status: ReminderStatus.values.byName(json['status'] as String),
    createdAt: DateTime.parse(json['createdAt'] as String),
    completedAt: json['completedAt'] != null
        ? DateTime.parse(json['completedAt'] as String)
        : null,
  );

  Reminder copyWith({
    String? id,
    String? title,
    String? description,
    ReminderCategory? category,
    String? sound,
    DateTime? scheduledAt,
    ReminderStatus? status,
    DateTime? createdAt,
    DateTime? completedAt,
  }) => Reminder(
    id: id ?? this.id,
    title: title ?? this.title,
    description: description ?? this.description,
    category: category ?? this.category,
    sound: sound ?? this.sound,
    scheduledAt: scheduledAt ?? this.scheduledAt,
    status: status ?? this.status,
    createdAt: createdAt ?? this.createdAt,
    completedAt: completedAt ?? this.completedAt,
  );
}
