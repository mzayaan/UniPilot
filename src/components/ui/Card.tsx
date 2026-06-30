import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Shadow, Spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: boolean;
}

export function Card({ children, style, elevated = true, padding = true }: CardProps) {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.card, borderColor: colors.border },
      elevated && Shadow.md,
      padding && styles.padding,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  padding: {
    padding: Spacing.base,
  },
});
