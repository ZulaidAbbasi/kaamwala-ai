// src/screens/FallbackRecoveryScreen.tsx
// Premium fallback recovery screen — Stitch design
// Preserves ALL existing scenario logic and backend calls

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  colors, spacing, radius, shadows, typography,
  StatusBadge, SectionCard, ActionButton, WarningBox,
  LoadingState, ProgressStepper,
} from '../components/ui';

interface RecoveryData {
  scenarioType: string;
  scenarioLabel: string;
  issueDetected: string;
  stateBefore: Record<string, any>;
  reasoning: string;
  recoveryOptions: string[];
  selectedRecovery: string;
  stateAfter: Record<string, any>;
  apologyMessage?: string;
  apologyMessageUrdu?: string;
  firestoreSaved: boolean;
  warnings: string[];
}

interface RecoveryResponse {
  success: boolean;
  workflowId: string;
  recovery: RecoveryData;
  traces: any[];
  latencyMs: number;
}

const SCENARIOS = [
  { key: 'provider_cancellation', label: 'Provider Cancels', icon: '🚫', color: colors.error },
  { key: 'no_provider_found',    label: 'No Provider Found', icon: '🔍', color: colors.warning },
  { key: 'low_confidence',       label: 'Low Confidence', icon: '❓', color: '#FF6D00' },
  { key: 'api_failure',          label: 'API Failure', icon: '⚡', color: colors.error },
  { key: 'price_dispute',        label: 'Price Dispute', icon: '💰', color: colors.warning },
  { key: 'missing_location',     label: 'Missing Location', icon: '📍', color: colors.tertiary },
];

export default function FallbackRecoveryScreen({ navigation, route }: { navigation: any; route: any }) {
  const { workflowId: passedWorkflowId, bookingId: passedBookingId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState('');
  const [result, setResult] = useState<RecoveryResponse | null>(null);
  const [error, setError] = useState('');

  const runScenario = async (scenario: string) => {
    setLoading(true);
    setActiveScenario(scenario);
    setResult(null);
    setError('');

    const wfId = passedWorkflowId || `wf_fallback_${Date.now()}`;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RESOLVE_DISPUTE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: wfId,
          scenario,
          bookingId: passedBookingId || `book_demo_${Date.now()}`,
          rawText: 'AC ki repair karwani hai jaldi',
          confidence: 0.25,
          failedApi: scenario === 'api_failure' ? 'google_places' : undefined,
          customerClaim: scenario === 'price_dispute' ? 'This is more expensive than other platforms' : undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const r = result?.recovery;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* Stepper */}
        <ProgressStepper
          steps={[
            { key: 'booked', label: 'Booked' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'recover', label: 'Recovery' },
          ]}
          currentStep={2}
        />

        {/* Header */}
        <Text style={s.title}>Fallback Recovery</Text>
        <Text style={s.subtitle}>Scenario: Provider cancelled after booking</Text>

        {/* Badges */}
        <View style={s.badgeRow}>
          <StatusBadge label="Fallback Used" variant="warning" />
          <StatusBadge label="Agent Recovered" variant="ai" />
          <StatusBadge label="Trace Logged" variant="success" />
        </View>

        {/* Scenario buttons */}
        <Text style={s.sectionLabel}>SELECT SCENARIO</Text>
        <View style={s.scenarioGrid}>
          {SCENARIOS.map(sc => (
            <TouchableOpacity
              key={sc.key}
              style={[
                s.scenarioBtn,
                activeScenario === sc.key && { backgroundColor: sc.color + '15', borderColor: sc.color },
              ]}
              onPress={() => runScenario(sc.key)}
              disabled={loading}
            >
              <Text style={s.scenarioIcon}>{sc.icon}</Text>
              <Text style={s.scenarioLabel}>{sc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading */}
        {loading && <LoadingState message="Running recovery..." submessage="AI agent analyzing fallback options" />}

        {/* Error */}
        {error !== '' && <WarningBox variant="error" title="Recovery Error" message={error} />}

        {/* Result */}
        {r && (<>
          {/* State Before */}
          <SectionCard title="⚠️ State Before" accent="warning">
            <Text style={s.stateDesc}>{r.issueDetected}</Text>
            {Object.entries(r.stateBefore).map(([k, v]) => (
              <View key={k} style={s.stateRow}>
                <Text style={s.stateKey}>{k}</Text>
                <Text style={s.stateVal}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Text>
              </View>
            ))}
          </SectionCard>

          {/* State After */}
          <SectionCard title="✅ State After" accent="success">
            <Text style={s.stateDesc}>{r.reasoning}</Text>
            {Object.entries(r.stateAfter).map(([k, v]) => (
              <View key={k} style={s.stateRow}>
                <Text style={s.stateKey}>{k}</Text>
                <Text style={[s.stateVal, { color: colors.success }]}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Text>
              </View>
            ))}
          </SectionCard>

          {/* Selected Recovery Action */}
          <SectionCard title="Selected Action" accent="ai">
            <Text style={s.selectedLabel}>SELECTED RECOVERY</Text>
            <Text style={s.selectedAction}>🔄 {r.selectedRecovery}</Text>

            {/* Recovery options */}
            {r.recoveryOptions.map((opt, i) => (
              <Text key={i} style={[
                s.optionText,
                r.selectedRecovery.includes(opt.split(' ')[0]) && s.optionSelected,
              ]}>
                {i + 1}. {opt}
              </Text>
            ))}
          </SectionCard>

          {/* Apology message */}
          {r.apologyMessage && (
            <SectionCard title="Apology Message Preview" accent="ai">
              <StatusBadge label="Preview Only — Not Sent" variant="warning" size="sm" />
              <View style={s.messageBox}>
                <Text style={s.messageText}>"{r.apologyMessage}"</Text>
              </View>
            </SectionCard>
          )}

          {/* Agentic Trace Log */}
          {result && result.traces.length > 0 && (
            <SectionCard title="🤖 Agentic Trace" accent="ai"
              badge={<StatusBadge label={`v1.0.${result.traces.length}`} variant="ai" size="sm" />}>
              {result.traces.slice(0, 5).map((t: any, i: number) => (
                <View key={i} style={s.traceRow}>
                  <Text style={s.traceText}>
                    [{t.phase}] {t.decision || t.actionTaken || t.observation}
                  </Text>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Status badges */}
          <View style={s.footerBadges}>
            {r.firestoreSaved && <StatusBadge label="Firestore Saved" variant="success" />}
            <StatusBadge label={`Scenario: ${r.scenarioType}`} variant="info" />
            <StatusBadge label="Safe Simulation" variant="warning" />
          </View>

          {/* Warnings */}
          {r.warnings.length > 0 && (
            <WarningBox variant="warning" message={r.warnings.join('\n')} />
          )}

          {/* View traces button */}
          {result && result.traces.length > 0 && (
            <ActionButton
              label={`View Recovery Traces (${result.traces.length})`}
              icon="🤖"
              variant="ai"
              onPress={() => navigation.navigate('AgentTrace', { workflowId: result.workflowId, traces: result.traces })}
            />
          )}
        </>)}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 20 },

  title: { ...typography.headlineLg, marginTop: spacing.lg, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySm, marginBottom: spacing.md },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },

  sectionLabel: { ...typography.labelSm, marginBottom: spacing.md },

  scenarioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  scenarioBtn: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    ...shadows.card,
  },
  scenarioIcon: { fontSize: 28, marginBottom: spacing.sm },
  scenarioLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },

  stateDesc: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginBottom: spacing.md },
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  stateKey: { fontSize: 13, color: colors.textMuted, fontFamily: 'monospace' },
  stateVal: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  selectedLabel: { ...typography.labelSm, marginBottom: spacing.sm },
  selectedAction: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: spacing.md },

  optionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 24, paddingLeft: 4 },
  optionSelected: { color: colors.success, fontWeight: '700' },

  messageBox: { backgroundColor: colors.surfaceContainer, padding: spacing.lg, borderRadius: radius.lg, marginTop: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.tertiaryDark },
  messageText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22, fontStyle: 'italic' },

  traceRow: { paddingVertical: 4 },
  traceText: { fontSize: 13, fontFamily: 'monospace', color: colors.textPrimary, lineHeight: 20 },

  footerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.lg },
});
