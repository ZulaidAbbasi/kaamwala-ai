// src/components/AgentTracePanel.tsx
// Visual agent trace timeline — designed for demo video readability
// Shows the full agentic decision trail for judges

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { TraceSummary, PHASE_META, AgentPhase } from '../types/agentTrace';
import * as Clipboard from 'expo-clipboard';

interface AgentTracePanelProps {
  traces: TraceSummary[];
  workflowId: string;
  isSample?: boolean;
}

export default function AgentTracePanel({ traces, workflowId, isSample }: AgentTracePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalLatency = traces.reduce((sum, t) => sum + t.latencyMs, 0);

  const handleExport = useCallback(async () => {
    const exportData = JSON.stringify(
      {
        workflowId,
        exportedAt: new Date().toISOString(),
        totalSteps: traces.length,
        totalLatencyMs: totalLatency,
        traces,
      },
      null,
      2
    );

    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(exportData);
        Alert.alert('Copied', 'Trace JSON copied to clipboard.');
      } catch {
        Alert.alert('Export', 'Could not copy to clipboard.');
      }
    } else {
      try {
        await Clipboard.setStringAsync(exportData);
        Alert.alert('Copied', 'Trace JSON copied to clipboard.');
      } catch {
        await Share.share({ message: exportData, title: `Agent Traces — ${workflowId}` });
      }
    }
  }, [traces, workflowId, totalLatency]);

  const toggleExpand = (traceId: string) => {
    setExpandedId(expandedId === traceId ? null : traceId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🤖 Agent Trace Log</Text>
          {isSample && (
            <View style={styles.sampleBadge}>
              <Text style={styles.sampleText}>📋 SAMPLE DATA — for UI testing</Text>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{traces.length}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{(totalLatency / 1000).toFixed(1)}s</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {traces.map((trace, index) => {
          const meta = PHASE_META[trace.phase] || PHASE_META.action;
          const isExpanded = expandedId === trace.traceId;
          const isLast = index === traces.length - 1;

          return (
            <TouchableOpacity
              key={trace.traceId}
              style={styles.traceCard}
              onPress={() => toggleExpand(trace.traceId)}
              activeOpacity={0.7}
            >
              {/* Timeline connector */}
              <View style={styles.connectorCol}>
                <View style={[styles.dot, { backgroundColor: meta.color }]}>
                  <Text style={styles.dotIcon}>{meta.icon}</Text>
                </View>
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                {/* Phase badge + agent name */}
                <View style={styles.cardHeader}>
                  <View style={[styles.phaseBadge, { backgroundColor: meta.color + '25', borderColor: meta.color }]}>
                    <Text style={[styles.phaseText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text style={styles.agentName}>{trace.agentName}</Text>
                  <Text style={styles.latency}>{trace.latencyMs}ms</Text>
                </View>

                {/* Decision summary */}
                <Text style={styles.decision} numberOfLines={isExpanded ? undefined : 2}>
                  {trace.decision || trace.observation}
                </Text>

                {/* Tool used */}
                {trace.toolUsed ? (
                  <View style={styles.toolRow}>
                    <Text style={styles.toolIcon}>🔧</Text>
                    <Text style={styles.toolText}>{trace.toolUsed}</Text>
                  </View>
                ) : null}

                {/* Confidence bar */}
                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>Confidence</Text>
                  <View style={styles.confidenceBarBg}>
                    <View
                      style={[
                        styles.confidenceBarFill,
                        {
                          width: `${Math.round(trace.confidence * 100)}%`,
                          backgroundColor: trace.confidence >= 0.8 ? '#34A853' : trace.confidence >= 0.5 ? '#FBBC04' : '#EA4335',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceValue}>{Math.round(trace.confidence * 100)}%</Text>
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <View style={styles.expandedSection}>
                    {trace.observation ? (
                      <DetailRow label="Observation" value={trace.observation} />
                    ) : null}
                    {trace.reasoningSummary ? (
                      <DetailRow label="Reasoning" value={trace.reasoningSummary} />
                    ) : null}
                    {trace.actionTaken ? (
                      <DetailRow label="Action" value={trace.actionTaken} />
                    ) : null}
                    {trace.toolResultSummary ? (
                      <DetailRow label="Tool Result" value={trace.toolResultSummary} />
                    ) : null}
                    {trace.estimatedCost && trace.estimatedCost !== 'N/A' ? (
                      <DetailRow label="Est. Cost" value={trace.estimatedCost} />
                    ) : null}
                    {trace.warnings.length > 0 && (
                      <DetailRow label="⚠ Warnings" value={trace.warnings.join('\n')} isWarning />
                    )}
                    {trace.errorMessage ? (
                      <DetailRow label="❌ Error" value={trace.errorMessage} isError />
                    ) : null}
                    {trace.recoveryAction ? (
                      <DetailRow label="🔄 Recovery" value={trace.recoveryAction} />
                    ) : null}
                  </View>
                )}

                {/* Expand hint */}
                <Text style={styles.expandHint}>
                  {isExpanded ? '▲ Collapse' : '▼ Tap for details'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Export button */}
      <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
        <Text style={styles.exportText}>📤 Export Trace JSON</Text>
      </TouchableOpacity>
    </View>
  );
}

function DetailRow({ label, value, isWarning, isError }: { label: string; value: string; isWarning?: boolean; isError?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          isWarning && { color: '#FBBC04' },
          isError && { color: '#EA4335' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  sampleBadge: {
    marginTop: 6,
    backgroundColor: '#FBBC04' + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FBBC04' + '40',
  },
  sampleText: {
    fontSize: 11,
    color: '#FBBC04',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 11,
    color: '#8888AA',
    marginTop: 2,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  traceCard: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  connectorCol: {
    width: 40,
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotIcon: {
    fontSize: 14,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: -2,
  },
  cardContent: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  phaseText: {
    fontSize: 11,
    fontWeight: '700',
  },
  agentName: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  latency: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  decision: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toolIcon: {
    fontSize: 12,
  },
  toolText: {
    fontSize: 11,
    color: '#8888AA',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    width: 60,
  },
  confidenceBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
  },
  confidenceBarFill: {
    height: 4,
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 10,
    color: '#64748B',
    width: 30,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  expandedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  detailRow: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  expandHint: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
  exportButton: {
    margin: 12,
    padding: 14,
    backgroundColor: '#4285F4',
    borderRadius: 10,
    alignItems: 'center',
  },
  exportText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
