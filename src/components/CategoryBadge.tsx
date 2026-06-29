import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, typography } from '@/constants/theme'
import type { Category } from '@/types/reminder'

const CATEGORY_COLORS: Record<Category, string> = {
  Personal: '#8B5CF6',
  Work: '#3B82F6',
  Health: '#10B981',
  Social: '#F59E0B',
}

interface CategoryBadgeProps {
  category: Category
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category]
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}20` }]}>
      <Text style={[styles.label, { color }]}>{category}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: {
    ...typography.label,
    fontSize: 11,
  },
})
