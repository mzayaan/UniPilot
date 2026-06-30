import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BorderRadius, Spacing, Typography } from '../../lib/theme';

interface BadgeProps {
  label: string;
  color: string;
  small?: boolean;
}

export function Badge({ label, color, small = false }: BadgeProps) {
  return (
    <View style={[
      styles.badge,
      { backgroundColor: color + '22', borderColor: color + '55' },
      small && styles.small,
    ]}>
      <Text style={[styles.label, { color }, small && styles.smallLabel]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  smallLabel: {
    fontSize: Typography.xs,
  },
});
