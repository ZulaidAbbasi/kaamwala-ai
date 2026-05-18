// src/screens/OutcomeEvaluationScreen.tsx
// Shows before/after comparison, 12 metrics, baseline vs agentic, overall score

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

interface EvalResponse {
  success: boolean;
  workflowId: string;
  evaluationId: string;
  metrics: Record<string, any>;
  beforeAfter: { dimension: string; icon: string; before: string; after: string; improvement: string }[];
  baselineComparison: {
    baselineLabel: string; baselineDescription: string;
    agenticLabel: string; agenticDescription: string;
    baselineFactors: string[]; agenticFactors: string[];
    verdict: string;
  };
  overallScore: number;
  overallGrade: string;
  recommendation: string;
  firestoreSaved: boolean;
  traces: any[];
  warnings: string[];
  latencyMs: number;
}

export default function OutcomeEvaluationScreen({ navigation, route }: { navigation: any; route: any }) {
  const params = route.params || {};
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<EvalResponse | null>(null);
  const [error, setError] = useState('');
  const [showBaseline, setShowBaseline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVALUATE_OUTCOME}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: params.workflowId || `wf_eval_${Date.now()}`,
            parsedRequest: params.parsedRequest,
            providerCandidates: params.providerCandidates,
            rankedProviders: params.rankedProviders,
            selectedProvider: params.selectedProvider,
            priceEstimate: params.priceEstimate,
            bookingResult: params.bookingResult,
            completedSteps: params.completedSteps,
            totalLatencyMs: params.latencyMs,
          }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setError(e.message || 'Evaluation failed.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>📊 Evaluating outcome…</Text>
        <Text style={styles.loadingSub}>12 metrics + baseline comparison</Text>
      </View>
    );
  }

  if (error || !result?.success) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error || 'Evaluation failed'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { metrics: m, beforeAfter, baselineComparison: bc } = result;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Score Header */}
      <View style={styles.scoreHeader}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNum}>{result.overallScore}</Text>
          <Text style={styles.scoreLabel}>/100</Text>
        </View>
        <View style={styles.gradeBox}>
          <Text style={styles.gradeText}>{result.overallGrade}</Text>
        </View>
        <Text style={styles.recText}>{result.recommendation}</Text>
        {result.firestoreSaved && (
          <View style={styles.savedBadge}><Text style={styles.savedText}>🔥 Saved to Firestore</Text></View>
        )}
      </View>

      {/* Before / After Cards */}
      <Text style={styles.sectionTitle}>📊 Before vs After</Text>
      {beforeAfter.map((item, i) => (
        <View key={i} style={styles.baCard}>
          <Text style={styles.baTitle}>{item.icon} {item.dimension}</Text>
          <View style={styles.baRow}>
            <View style={[styles.baCol, styles.baBefore]}>
              <Text style={styles.baColLabel}>❌ BEFORE</Text>
              <Text style={styles.baColText}>{item.before}</Text>
            </View>
            <View style={[styles.baCol, styles.baAfter]}>
              <Text style={styles.baColLabel}>✅ AFTER</Text>
              <Text style={styles.baColText}>{item.after}</Text>
            </View>
          </View>
          <View style={styles.improvBadge}>
            <Text style={styles.improvText}>↑ {item.improvement}</Text>
          </View>
        </View>
      ))}

      {/* Metrics Grid */}
      <Text style={styles.sectionTitle}>📈 Metrics</Text>
      <View style={styles.metricsGrid}>
        {[
          { key: 'requestUnderstandingConfidence', label: 'NLU Confidence', fmt: (v: number) => `${(v * 100).toFixed(0)}%` },
          { key: 'providerCandidatesFound', label: 'Candidates', fmt: (v: number) => `${v}` },
          { key: 'selectedProviderScore', label: 'Selected Score', fmt: (v: number) => `${v}/100` },
          { key: 'baselineProviderScore', label: 'Baseline Score', fmt: (v: number) => `${v}/100` },
          { key: 'transparencyScore', label: 'Transparency', fmt: (v: number) => `${v}%` },
          { key: 'bookingReadiness', label: 'Booking Ready', fmt: (v: number) => `${v}%` },
          { key: 'recoveryReadiness', label: 'Recovery Ready', fmt: (v: number) => `${v}%` },
          { key: 'dataCompleteness', label: 'Data Complete', fmt: (v: number) => `${v}%` },
          { key: 'userEffortReduction', label: 'Effort Saved', fmt: (v: number) => `${v}%` },
          { key: 'workflowCompletion', label: 'Workflow Done', fmt: (v: number) => `${v}%` },
        ].map(({ key, label, fmt }) => (
          <View key={key} style={styles.metricCell}>
            <Text style={styles.metricValue}>{fmt(m[key])}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Cost */}
      <View style={styles.costCard}>
        <Text style={styles.costLabel}>💵 Cost per Workflow</Text>
        <Text style={styles.costValue}>{m.costEstimate}</Text>
        {m.latencyEstimate > 0 && <Text style={styles.costSub}>⏱ {m.latencyEstimate}ms total latency</Text>}
      </View>

      {/* Baseline Comparison Toggle */}
      <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowBaseline(!showBaseline)}>
        <Text style={styles.toggleText}>{showBaseline ? '▼' : '▶'} Baseline vs Agentic Detail</Text>
      </TouchableOpacity>

      {showBaseline && (
        <View style={styles.baselineSection}>
          <View style={styles.baselineCol}>
            <Text style={styles.baselineTitle}>❌ {bc.baselineLabel}</Text>
            <Text style={styles.baselineDesc}>{bc.baselineDescription}</Text>
            {bc.baselineFactors.map((f, i) => <Text key={i} style={styles.baselineItem}>• {f}</Text>)}
          </View>
          <View style={styles.baselineDivider} />
          <View style={styles.baselineCol}>
            <Text style={[styles.baselineTitle, { color: '#34A853' }]}>✅ {bc.agenticLabel}</Text>
            <Text style={styles.baselineDesc}>{bc.agenticDescription}</Text>
            {bc.agenticFactors.map((f, i) => <Text key={i} style={[styles.baselineItem, { color: '#CCDDCC' }]}>• {f}</Text>)}
          </View>
          <View style={styles.verdictBox}>
            <Text style={styles.verdictText}>🏆 {bc.verdict}</Text>
          </View>
        </View>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <View style={styles.warningBox}>
          {result.warnings.map((w, i) => <Text key={i} style={styles.warningText}>⚠ {w}</Text>)}
        </View>
      )}

      {/* Trace button */}
      {result.traces.length > 0 && (
        <TouchableOpacity
          style={styles.traceBtn}
          onPress={() => navigation.navigate('AgentTrace', { workflowId: result.workflowId, traces: result.traces })}
        >
          <Text style={styles.traceBtnText}>🤖 View Evaluation Traces ({result.traces.length})</Text>
        </TouchableOpacity>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Eval: {result.evaluationId}</Text>
        <Text style={styles.metaText}>{result.latencyMs}ms</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A' },
  center: { flex: 1, backgroundColor: '#0B0F1A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginTop: 16 },
  loadingSub: { color: '#64748B', fontSize: 12, marginTop: 4 },
  errorText: { color: '#EA4335', fontSize: 14, padding: 20, textAlign: 'center' },
  backBtn: { marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
  backBtnText: { color: '#F1F5F9', fontWeight: '600' },

  // Score Header
  scoreHeader: { alignItems: 'center', padding: 20, paddingBottom: 10 },
  scoreCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 3, borderColor: '#8B5CF6',
    justifyContent: 'center', alignItems: 'center',
  },
  scoreNum: { fontSize: 36, fontWeight: '900', color: '#F1F5F9' },
  scoreLabel: { fontSize: 12, color: '#64748B', marginTop: -4 },
  gradeBox: {
    marginTop: 8, paddingHorizontal: 16, paddingVertical: 4,
    backgroundColor: '#8B5CF6', borderRadius: 8,
  },
  gradeText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  recText: { fontSize: 12, color: '#E2E8F0', marginTop: 10, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
  savedBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: '#EA4335' + '25', borderRadius: 6 },
  savedText: { fontSize: 10, fontWeight: '700', color: '#EA4335' },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },

  // Before/After
  baCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  baTitle: { fontSize: 13, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  baRow: { flexDirection: 'row', gap: 8 },
  baCol: { flex: 1, padding: 8, borderRadius: 8 },
  baBefore: { backgroundColor: '#2A1A1A' },
  baAfter: { backgroundColor: '#1A2A1A' },
  baColLabel: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginBottom: 4 },
  baColText: { fontSize: 10, color: '#E2E8F0', lineHeight: 15 },
  improvBadge: { alignSelf: 'flex-end', marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#34A853' + '20', borderRadius: 4 },
  improvText: { fontSize: 9, fontWeight: '700', color: '#34A853' },

  // Metrics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 6 },
  metricCell: {
    width: '31%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#F1F5F9' },
  metricLabel: { fontSize: 9, color: '#64748B', fontWeight: '600', marginTop: 4, textAlign: 'center' },

  // Cost
  costCard: { margin: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: '#FBBC04' + '40', alignItems: 'center' },
  costLabel: { fontSize: 12, fontWeight: '700', color: '#FBBC04' },
  costValue: { fontSize: 11, color: '#E2E8F0', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  costSub: { fontSize: 10, color: '#64748B', marginTop: 4 },

  // Baseline toggle
  toggleBtn: { margin: 16, marginBottom: 0, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: '#4285F4' + '40' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#4285F4' },

  baselineSection: { margin: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  baselineCol: { marginBottom: 10 },
  baselineTitle: { fontSize: 13, fontWeight: '700', color: '#EA4335', marginBottom: 4 },
  baselineDesc: { fontSize: 10, color: '#64748B', marginBottom: 6 },
  baselineItem: { fontSize: 10, color: '#CCBBBB', lineHeight: 16 },
  baselineDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  verdictBox: { marginTop: 8, padding: 10, backgroundColor: '#1A2E1A', borderRadius: 8 },
  verdictText: { fontSize: 11, color: '#34A853', fontWeight: '600', lineHeight: 16 },

  warningBox: { margin: 16, padding: 10, backgroundColor: '#2A2A1A', borderRadius: 8, borderWidth: 1, borderColor: '#FBBC04' + '40' },
  warningText: { fontSize: 12, color: '#78716C', lineHeight: 18 },

  traceBtn: { margin: 16, marginBottom: 0, padding: 14, backgroundColor: '#4285F4', borderRadius: 10, alignItems: 'center' },
  traceBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 16 },
  metaText: { fontSize: 10, color: '#64748B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
