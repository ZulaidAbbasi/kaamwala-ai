// src/screens/ProviderRankingScreen.tsx
// Provider ranking with score breakdown — Stitch design
// Preserves ALL backend ranking logic

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

interface ScoredFactor {
  factor: string;
  weight: number;
  rawValue: any;
  normalizedScore: number;
  weightedScore: number;
  explanation: string;
}

interface RankedProvider {
  candidateId: string;
  rank: number;
  name: string;
  totalScore: number;
  factors: ScoredFactor[];
  strengths: string[];
  weaknesses: string[];
  riskFlags: string[];
  bookingEligible: boolean;
  bookingStatus: string;
  whySelected: string;
}

interface RankingResponse {
  success: boolean;
  workflowId: string;
  rankedProviders: RankedProvider[];
  selectedProvider: RankedProvider | null;
  baseline: { method: string; selectedName: string; selectedId: string; reasoning: string };
  agenticAdvantage: string;
  geminiExplanation: string | null;
  traces: any[];
  warnings: string[];
  latencyMs: number;
}

export default function ProviderRankingScreen({ navigation, route }: { navigation: any; route: any }) {
  const { workflowId, parsedRequest, candidates } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<RankingResponse | null>(null);
  const [error, setError] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    if (!workflowId || !parsedRequest || !candidates) {
      setError('Missing workflow data.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RANK_PROVIDERS}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId, parsedRequest, providerCandidates: candidates }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setError(e.message || 'Ranking failed.');
      } finally {
        setLoading(false);
      }
    })();
  }, [workflowId, parsedRequest, candidates]);

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <LoadingState message="Ranking providers..." submessage="12-factor deterministic scoring" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.errorContainer}>
          <WarningBox variant="error" title="Ranking Error" message={error} />
          <ActionButton label="← Go Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!result?.success) return null;

  const selected = result.selectedProvider;

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

        {/* Stepper */}
        <ProgressStepper
          steps={[
            { key: 'parse', label: 'Parse' },
            { key: 'search', label: 'Search' },
            { key: 'rank', label: 'Rank' },
            { key: 'book', label: 'Book' },
          ]}
          currentStep={2}
        />

        {/* Header */}
        <Text style={st.subtitle}>
          Top match selected based on combined optimization score.
        </Text>

        {/* Selected Provider Card — Stitch design */}
        {selected && (
          <View style={st.selectedCard}>
            {/* Provider header */}
            <View style={st.providerHeader}>
              <View style={st.avatarCircle}>
                <Text style={st.avatarText}>{selected.name.charAt(0)}</Text>
              </View>
              <View style={st.providerInfo}>
                <Text style={st.providerName}>{selected.name}</Text>
                <Text style={st.providerMeta}>{selected.bookingStatus}</Text>
              </View>
              <View style={st.scoreCircle}>
                <Text style={st.scoreValue}>{Math.round(selected.totalScore * 100)}</Text>
                <Text style={st.scoreLabel}>SCORE</Text>
              </View>
            </View>

            {/* AI Decision */}
            <View style={st.aiDecisionBox}>
              <View style={st.aiDecisionAccent} />
              <View style={st.aiDecisionContent}>
                <Text style={st.aiDecisionTitle}>AI Decision: Optimal Match</Text>
                <Text style={st.aiDecisionText}>
                  {selected.whySelected || 'This provider has the strongest combined match across relevance, location, rating, and data completeness.'}
                </Text>
              </View>
            </View>

            {/* Optimization Factors */}
            <Text style={st.factorsTitle}>OPTIMIZATION FACTORS</Text>
            {selected.factors.slice(0, 6).map((f, i) => (
              <ScoreBar
                key={i}
                label={f.factor}
                value={f.normalizedScore * 100}
              />
            ))}

            {/* Badges */}
            <View style={st.badgeRow}>
              {selected.bookingEligible && <StatusBadge label="Verified" variant="success" size="sm" />}
              <StatusBadge
                label={selected.bookingEligible ? 'Bookable' : 'Discovery Only'}
                variant={selected.bookingEligible ? 'success' : 'warning'}
                size="sm"
              />
            </View>
          </View>
        )}

        {/* Baseline vs Agentic */}
        <SectionCard title="📊 Baseline vs Agentic">
          <View style={st.compRow}>
            <View style={st.compCol}>
              <Text style={st.compLabel}>Without AI</Text>
              <Text style={st.compMethod}>{result.baseline.method}</Text>
              <Text style={st.compPick}>→ {result.baseline.selectedName}</Text>
            </View>
            <View style={st.compDivider} />
            <View style={st.compCol}>
              <Text style={[st.compLabel, { color: colors.success }]}>With AI</Text>
              <Text style={st.compMethod}>12-factor ranking</Text>
              <Text style={st.compPick}>→ {selected?.name || 'None'}</Text>
            </View>
          </View>
          <WarningBox variant="ai" title="AI Advantage" message={result.agenticAdvantage} />
        </SectionCard>

        {/* Gemini Analysis */}
        {result.geminiExplanation && (
          <SectionCard title="🧠 Gemini Analysis" accent="ai">
            <Text style={st.analysisText}>{result.geminiExplanation}</Text>
          </SectionCard>
        )}

        {/* All Rankings */}
        <Text style={st.sectionTitle}>ALL RANKINGS</Text>
        {result.rankedProviders.map((provider) => {
          const isExpanded = expandedCard === provider.candidateId;
          return (
            <TouchableOpacity
              key={provider.candidateId}
              style={[st.rankCard, provider.rank === 1 && st.topRankCard]}
              onPress={() => setExpandedCard(isExpanded ? null : provider.candidateId)}
              activeOpacity={0.8}
            >
              <View style={st.rankHeader}>
                <View style={st.rankBadge}>
                  <Text style={st.rankNumber}>#{provider.rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.rankName}>{provider.name}</Text>
                  <Text style={st.rankStatus}>{provider.bookingStatus}</Text>
                </View>
                <View style={st.rankScoreCircle}>
                  <Text style={st.rankScoreText}>{Math.round(provider.totalScore * 100)}</Text>
                </View>
              </View>

              {/* Score bar */}
              <View style={st.rankBarBg}>
                <View style={[st.rankBarFill, {
                  width: `${Math.round(provider.totalScore * 100)}%`,
                  backgroundColor: provider.totalScore >= 0.7 ? colors.success : provider.totalScore >= 0.4 ? colors.warning : colors.error,
                }]} />
              </View>

              {/* Expanded factors */}
              {isExpanded && (
                <View style={st.expandedSection}>
                  {provider.factors.map((f, i) => (
                    <ScoreBar key={i} label={f.factor} value={f.normalizedScore * 100} />
                  ))}
                  {provider.riskFlags.length > 0 && (
                    <WarningBox variant="warning" message={provider.riskFlags.join('\n')} title="Risk Flags" />
                  )}
                </View>
              )}

              <Text style={st.expandHint}>{isExpanded ? '▲ Collapse' : '▼ Tap for score breakdown'}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <WarningBox variant="warning" message={result.warnings.join('\n')} />
        )}

        {/* Action buttons */}
        {result.traces.length > 0 && (
          <ActionButton
            label={`View Ranking Traces (${result.traces.length})`}
            icon="🤖"
            variant="ai"
            onPress={() => navigation.navigate('AgentTrace', {
              workflowId: result.workflowId,
              traces: result.traces,
            })}
          />
        )}

        <View style={{ height: spacing.md }} />

        {selected && (
          <ActionButton
            label={`Proceed with ${selected.name}  →`}
            variant="primary"
            onPress={() => navigation.navigate('DynamicPricing', {
              workflowId: result.workflowId,
              parsedRequest,
              selectedProvider: selected,
            })}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', padding: spacing.xl },

  subtitle: { ...typography.bodySm, marginVertical: spacing.lg, lineHeight: 22 },

  // Selected provider card
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  providerMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  scoreLabel: { fontSize: 8, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },

  // AI Decision box
  aiDecisionBox: { flexDirection: 'row', backgroundColor: colors.tertiaryLight, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg },
  aiDecisionAccent: { width: 4, backgroundColor: colors.tertiaryDark },
  aiDecisionContent: { flex: 1, padding: spacing.md },
  aiDecisionTitle: { fontSize: 14, fontWeight: '700', color: colors.tertiaryDark, marginBottom: 4 },
  aiDecisionText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },

  factorsTitle: { ...typography.labelSm, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },

  // Comparison
  compRow: { flexDirection: 'row', marginBottom: spacing.md },
  compCol: { flex: 1, padding: spacing.sm },
  compDivider: { width: 1, backgroundColor: colors.borderLight },
  compLabel: { fontSize: 11, fontWeight: '700', color: colors.error, textTransform: 'uppercase', marginBottom: 4 },
  compMethod: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  compPick: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  analysisText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },

  sectionTitle: { ...typography.labelSm, marginTop: spacing.xxl, marginBottom: spacing.md },

  // Rank cards
  rankCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  topRankCard: { borderColor: colors.primary, borderWidth: 2 },
  rankHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  rankNumber: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rankName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  rankStatus: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  rankScoreCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  rankScoreText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  rankBarBg: { height: 6, borderRadius: 3, backgroundColor: colors.scoreTrack, overflow: 'hidden', marginBottom: spacing.sm },
  rankBarFill: { height: 6, borderRadius: 3 },

  expandedSection: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },

  expandHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
