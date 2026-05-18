// src/components/ui/TraceCard.tsx
// Agent trace log card with purple accent matching Stitch design
// Shows phase, confidence, tool used, decision, state transitions

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from './theme';

interface TraceCardProps {
  phaseNumber: number;
  phaseName: string;
  confidence?: number;
  toolUsed?: string;
  content: string;
  stateBefore?: string;
  stateAfter?: string;
  agentName?: string;
  warnings?: string[];
}

const phaseIcons: Record<string, string> = {
  observation: '👁️',
  understanding: '🧠',
  tool_call: '⚙️',
  reasoning: '💭',
  decision: '✅',
  action: '🚀',
  recovery: '🔄',
  evaluation: '📊',
  result: '📋',
};

export const TraceCard: React.FC<TraceCardProps> = ({
  phaseNumber,
  phaseName,
  confidence,
  toolUsed,
  content,
  stateBefore,
  stateAfter,
  agentName,
  warnings,
}) => {
  const icon = phaseIcons[phaseName.toLowerCase()] || '📋';

  return (
    <View style={styles.card}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.phaseCircle}>
              <Text style={styles.phaseIcon}>{icon}</Text>
            </View>
            <View>
              <Text style={styles.phaseLabel}>PHASE {phaseNumber}</Text>
              <Text style={styles.phaseName}>{phaseName}</Text>
            </View>
          </View>
          {confidence !== undefined && (
            <View style={styles.confBadge}>
              <Text style={styles.confText}>
                Conf: {Math.round(confidence * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Tool used */}
        {toolUsed && toolUsed !== 'none' && (
          <View style={styles.toolRow}>
            <Text style={styles.toolIcon}>⚡</Text>
            <Text style={styles.toolText}>{toolUsed}</Text>
          </View>
        )}

        {/* Agent name */}
        {agentName && (
          <Text style={styles.agentLabel}>{agentName}</Text>
        )}

        {/* Content */}
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{content}</Text>
        </View>

        {/* State transition */}
        {(stateBefore || stateAfter) && (
          <View style={styles.stateRow}>
            {stateBefore && (
              <View style={styles.stateCol}>
                <Text style={styles.stateLabel}>State Before</Text>
                <Text style={styles.stateValue}>{stateBefore}</Text>
              </View>
            )}
            {stateAfter && (
              <View style={styles.stateCol}>
                <Text style={styles.stateLabel}>State After</Text>
                <Text style={styles.stateValue}>{stateAfter}</Text>
              </View>
            )}
          </View>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <View style={styles.warningsBox}>
            {warnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>⚠️ {w}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.tertiaryMuted,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.tertiaryDark,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phaseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tertiaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseIcon: {
    fontSize: 16,
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.tertiaryDark,
    textTransform: 'uppercase',
  },
  phaseName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confBadge: {
    backgroundColor: colors.tertiaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  confText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.tertiaryDark,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  toolIcon: {
    fontSize: 12,
  },
  toolText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.tertiary,
  },
  agentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  contentBox: {
    backgroundColor: colors.tertiaryLight,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  stateRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  stateCol: {
    flex: 1,
  },
  stateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  warningsBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    lineHeight: 18,
  },
});

export default TraceCard;
