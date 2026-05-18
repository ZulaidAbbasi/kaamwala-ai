// src/screens/DynamicPricingScreen.tsx
// Receipt-style pricing breakdown — Stitch design
// Preserves ALL backend pricing logic

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  colors, spacing, radius, shadows, typography,
  StatusBadge, SectionCard, ActionButton, WarningBox,
  LoadingState, ProgressStepper, ScoreBar,
} from '../components/ui';

interface BreakdownItem {
  label: string;
  amount: number;
  type: 'base' | 'adjustment' | 'fee' | 'discount';
  explanation: string;
}

interface PriceEstimate {
  estimateLow: number;
  estimateHigh: number;
  recommendedEstimate: number;
  currency: string;
  breakdown: BreakdownItem[];
  assumptions: string[];
  unknowns: string[];
  fairnessExplanation: string;
  confidence: number;
  userMessage: string;
  providerNote: string;
  isEstimateOnly: boolean;
}

interface PricingResponse {
  success: boolean;
  workflowId: string;
  estimate: PriceEstimate;
  providerName: string;
  isRegistered: boolean;
  traces: any[];
  warnings: string[];
  latencyMs: number;
}

const ICONS: Record<string, string> = {
  base: '🏠', adjustment: '🚗', fee: '⏰', discount: '💚',
};

export default function DynamicPricingScreen({ navigation, route }: { navigation: any; route: any }) {
  const { workflowId, parsedRequest, selectedProvider } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PricingResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workflowId || !parsedRequest || !selectedProvider) {
      setError('Missing data.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ESTIMATE_PRICE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId, parsedRequest, selectedProvider }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setError(e.message || 'Pricing failed.');
      } finally {
        setLoading(false);
      }
    })();
  }, [workflowId, parsedRequest, selectedProvider]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <LoadingState message="Calculating estimate..." submessage="AI pricing engine analyzing market rates" />
      </SafeAreaView>
    );
  }

  if (error || !result?.success) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.errorContainer}>
          <WarningBox variant="error" title="Pricing Error" message={error || 'Pricing failed'} />
          <ActionButton label="← Go Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const est = result.estimate;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* Stepper */}
        <ProgressStepper
          steps={[
            { key: 'details', label: 'Details' },
            { key: 'match', label: 'Match' },
            { key: 'price', label: 'Price' },
            { key: 'confirm', label: 'Confirm' },
          ]}
          currentStep={2}
        />

        {/* Header */}
        <Text style={s.title}>Transparent Price Estimate</Text>
        <View style={s.badgeRow}>
          <StatusBadge label="Estimated Price" variant="info" />
          <StatusBadge label="Not Final Quote" variant="warning" />
        </View>

        {/* Receipt Card */}
        <View style={s.receiptCard}>
          {/* Line items */}
          {est.breakdown.map((item, i) => (
            <View key={i} style={s.receiptRow}>
              <Text style={s.receiptIcon}>{ICONS[item.type] || '📋'}</Text>
              <Text style={s.receiptLabel}>{item.label}</Text>
              <Text style={[
                s.receiptAmount,
                item.type === 'discount' && s.receiptDiscount,
              ]}>
                {item.type === 'discount' ? '–' : '+'} {est.currency} {item.amount.toLocaleString()}
              </Text>
            </View>
          ))}

          {/* Budget sensitivity */}
          {est.breakdown.some(b => b.type === 'discount') && (
            <View style={s.budgetRow}>
              <View style={s.budgetAccent} />
              <Text style={s.budgetIcon}>💚</Text>
              <Text style={s.budgetLabel}>Budget sensitivity</Text>
              <Text style={s.budgetAmount}>
                – {est.currency} {est.breakdown.filter(b => b.type === 'discount').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
              </Text>
            </View>
          )}

          {/* Dashed separator */}
          <View style={s.dashedLine} />

          {/* Total */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Estimated{'\n'}Total</Text>
            <Text style={s.totalValue}>
              {est.currency} {est.estimateLow.toLocaleString()} – {est.estimateHigh.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Fairness note */}
        <WarningBox
          variant="safety"
          title="Fairness note"
          message={est.fairnessExplanation || "This is an estimate based on your provided details. Final quote may vary slightly after the professional's initial diagnosis on-site."}
          icon="🛡️"
        />

        {/* Assumptions */}
        {est.assumptions.length > 0 && (
          <SectionCard title="📌 Assumptions">
            {est.assumptions.map((a, i) => (
              <Text key={i} style={s.listItem}>• {a}</Text>
            ))}
          </SectionCard>
        )}

        {/* Unknowns */}
        {est.unknowns.length > 0 && (
          <WarningBox
            variant="warning"
            title="Unknowns"
            message={est.unknowns.map(u => `• ${u}`).join('\n')}
          />
        )}

        {/* Provider note */}
        {est.providerNote && (
          <WarningBox variant="info" message={est.providerNote} icon="ℹ️" />
        )}

        {/* Disclaimer */}
        <WarningBox
          variant="warning"
          message="This is a platform estimate, not a final provider quote. Actual pricing may vary based on inspection and provider's assessment."
        />

        {/* Trace button */}
        {result.traces.length > 0 && (
          <ActionButton
            label={`View Pricing Traces (${result.traces.length})`}
            icon="🤖"
            variant="ai"
            onPress={() => navigation.navigate('AgentTrace', {
              workflowId: result.workflowId,
              traces: result.traces,
            })}
          />
        )}

        <View style={{ height: spacing.md }} />

        {/* Proceed button — sticky feel */}
        <ActionButton
          label="Proceed to Confirm  →"
          variant="primary"
          onPress={() => navigation.navigate('Booking', {
            workflowId: result.workflowId,
            parsedRequest,
            selectedProvider,
            priceEstimate: est,
          })}
        />

        {/* Meta */}
        <View style={s.metaRow}>
          <Text style={s.metaText}>Workflow: {result.workflowId}</Text>
          <Text style={s.metaText}>{result.latencyMs}ms</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', padding: spacing.xl },

  title: { ...typography.headlineLg, marginTop: spacing.lg, marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },

  // Receipt card
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  receiptIcon: { fontSize: 18 },
  receiptLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  receiptAmount: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  receiptDiscount: { color: colors.success },

  // Budget sensitivity row
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingLeft: 4,
    backgroundColor: colors.tertiaryLight,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  budgetAccent: { width: 3, height: '80%', backgroundColor: colors.tertiaryDark, borderRadius: 2 },
  budgetIcon: { fontSize: 16 },
  budgetLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.tertiaryDark },
  budgetAmount: { fontSize: 15, fontWeight: '700', color: colors.tertiaryDark, paddingRight: spacing.md },

  // Dashed separator
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.lg,
  },

  // Total
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.primary },

  // List items
  listItem: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  // Meta
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  metaText: { fontSize: 12, color: colors.textMuted, fontFamily: 'monospace' },
});
