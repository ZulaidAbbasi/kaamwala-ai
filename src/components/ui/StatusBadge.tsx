// src/components/ui/StatusBadge.tsx
// Rounded pill badge for status indicators
// Variants: success, warning, error, info, ai, neutral

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from './theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'ai' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: colors.successLight, text: colors.success, border: colors.successBorder },
  warning: { bg: colors.warningLight, text: colors.warning, border: colors.warningBorder },
  error:   { bg: colors.errorLight,   text: colors.error,   border: colors.errorBorder },
  info:    { bg: colors.infoLight,    text: colors.info,     border: colors.infoBorder },
  ai:      { bg: colors.tertiaryLight, text: colors.tertiaryDark, border: colors.tertiaryMuted },
  neutral: { bg: '#F3F4F6',           text: '#4B5563',       border: '#E5E7EB' },
};

const icons: Record<string, string> = {
  check: '✓', shield: '🛡️', brain: '🧠', map: '📍', fire: '🔥',
  warn: '⚠️', cloud: '☁️', lock: '🔒', trace: '📋', spark: '✨',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'md',
}) => {
  const style = variantStyles[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.container,
      { backgroundColor: style.bg, borderColor: style.border },
      isSmall && styles.containerSm,
    ]}>
      {icon && icons[icon] && (
        <Text style={[styles.icon, isSmall && styles.iconSm]}>{icons[icon]}</Text>
      )}
      <Text style={[
        styles.label,
        { color: style.text },
        isSmall && styles.labelSm,
      ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 6,
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  icon: {
    fontSize: 14,
  },
  iconSm: {
    fontSize: 11,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
});

export default StatusBadge;
