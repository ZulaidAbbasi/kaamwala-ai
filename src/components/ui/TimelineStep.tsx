// src/components/ui/TimelineStep.tsx
// Vertical timeline node for booking/follow-up/recovery timelines

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from './theme';

interface TimelineStepProps {
  title: string;
  description?: string;
  time?: string;
  status: 'completed' | 'active' | 'upcoming' | 'failed';
  isLast?: boolean;
}

export const TimelineStep: React.FC<TimelineStepProps> = ({
  title,
  description,
  time,
  status,
  isLast = false,
}) => {
  const dotColor =
    status === 'completed' ? colors.success :
    status === 'active' ? colors.primary :
    status === 'failed' ? colors.error :
    colors.border;

  const lineColor = status === 'completed' ? colors.success : colors.border;

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        <View style={[styles.dot, { backgroundColor: dotColor }]}>
          {status === 'completed' && <Text style={styles.check}>✓</Text>}
          {status === 'active' && <View style={styles.activePulse} />}
          {status === 'failed' && <Text style={styles.failX}>✕</Text>}
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[
            styles.title,
            status === 'upcoming' && styles.titleMuted,
            status === 'failed' && styles.titleError,
          ]}>
            {title}
          </Text>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 60,
  },
  indicator: {
    alignItems: 'center',
    width: 32,
    marginRight: spacing.md,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  check: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  failX: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  content: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  titleMuted: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  titleError: {
    color: colors.error,
  },
  time: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
});

export default TimelineStep;
