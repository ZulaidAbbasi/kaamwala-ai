// src/components/ui/ActionButton.tsx
// Large thumb-friendly button matching Stitch design
// Variants: primary, secondary, danger, ghost, ai

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, radius, spacing } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const variantConfig: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: colors.primary, text: colors.textOnPrimary },
  secondary: { bg: 'transparent', text: colors.primary, border: colors.primary },
  danger:    { bg: colors.error, text: '#FFFFFF' },
  ghost:     { bg: 'transparent', text: colors.textSecondary },
  ai:        { bg: colors.tertiaryDark, text: colors.textOnTertiary },
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
}) => {
  const config = variantConfig[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: config.bg },
        config.border && { borderWidth: 1.5, borderColor: config.border },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={config.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Text style={[styles.icon, { color: config.text }]}>{icon}</Text>}
          <Text style={[styles.label, { color: config.text }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ActionButton;
