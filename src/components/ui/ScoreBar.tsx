// src/components/ui/ScoreBar.tsx
// Teal horizontal score visualization bar matching Stitch design
// 8px tall rounded track with fill

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from './theme';

interface ScoreBarProps {
  label: string;
  value: number; // 0-100
  detail?: string;
  color?: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  label,
  value,
  detail,
  color = colors.scoreFill,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}{detail ? ` (${detail})` : ''}
        </Text>
        <Text style={styles.value}>{Math.round(clampedValue)}%</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clampedValue}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.scoreTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default ScoreBar;
