// src/components/ui/WarningBox.tsx
// Info/warning/error/safety callout box matching Stitch design
// 4px left border accent with tinted background

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from './theme';

type BoxVariant = 'info' | 'warning' | 'error' | 'safety' | 'ai';

interface WarningBoxProps {
  message: string;
  variant?: BoxVariant;
  title?: string;
  icon?: string;
}

const variantConfig: Record<BoxVariant, { bg: string; border: string; text: string; icon: string }> = {
  info:    { bg: colors.infoLight,     border: colors.info,    text: colors.info,    icon: 'ℹ️' },
  warning: { bg: colors.warningLight,  border: colors.warning, text: colors.warning, icon: '⚠️' },
  error:   { bg: colors.errorLight,    border: colors.error,   text: colors.error,   icon: '🚨' },
  safety:  { bg: colors.successLight,  border: colors.success, text: colors.success, icon: '🛡️' },
  ai:      { bg: colors.tertiaryLight, border: colors.tertiaryDark, text: colors.tertiaryDark, icon: '🧠' },
};

export const WarningBox: React.FC<WarningBoxProps> = ({
  message,
  variant = 'info',
  title,
  icon,
}) => {
  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderLeftColor: config.border }]}>
      <View style={styles.row}>
        <Text style={styles.icon}>{displayIcon}</Text>
        <View style={styles.textCol}>
          {title && (
            <Text style={[styles.title, { color: config.text }]}>{title}</Text>
          )}
          <Text style={[styles.message, { color: config.text }]}>{message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  icon: {
    fontSize: 18,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
});

export default WarningBox;
