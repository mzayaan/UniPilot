import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const { colors, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const secureEntry = isPassword ? !showPassword : props.secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <View style={[
        styles.container,
        { backgroundColor: colors.input, borderColor: error ? Colors.danger : colors.inputBorder },
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={colors.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={secureEntry}
          style={[
            styles.input,
            { color: colors.text },
            leftIcon ? styles.inputWithLeft : null,
            (rightIcon || isPassword) ? styles.inputWithRight : null,
          ]}
          placeholderTextColor={colors.placeholder}
          autoCapitalize={props.autoCapitalize ?? 'none'}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(v => !v)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginBottom: Spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  inputWithLeft: { paddingLeft: Spacing.xs },
  inputWithRight: { paddingRight: Spacing.xs },
  leftIcon: { paddingLeft: Spacing.md },
  rightIcon: { paddingRight: Spacing.md },
  error: {
    fontSize: Typography.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
});
