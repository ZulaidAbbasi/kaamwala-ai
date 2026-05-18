// src/components/ui/MetricBar.tsx
// Before/After comparison bar for baseline comparison screen

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from './theme';

interface MetricBarProps {
  label: string;
  normalValue: number; // 0-100
  aiValue: number;     // 0-100
}

export const MetricBar: React.FC<MetricBarProps> = ({ label, normalValue, aiValue }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>App</Text>
        <View style={styles.track}>
          <View style={[styles.fillNormal, { width: `${normalValue}%` }]} />
        </View>
      </View>
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>AI</Text>
        <View style={styles.track}>
          <View style={[styles.fillAI, { width: `${aiValue}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.sm,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    width: 28,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.scoreTrack,
    overflow: 'hidden',
  },
  fillNormal: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  fillAI: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.tertiaryDark,
  },
});

export default MetricBar;
