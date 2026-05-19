// src/screens/HomeScreen.tsx
// Premium home screen — Stitch design system applied
// Preserves ALL existing workflow logic and navigation

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_REQUEST } from '../config/constants';
import { runFullWorkflow, WorkflowResult } from '../services/backend/orchestratorClient';
import {
  colors, spacing, radius, shadows, typography,
  StatusBadge, SectionCard, ActionButton, ProgressStepper,
  WarningBox, LoadingState,
} from '../components/ui';

const PIPELINE = [
  { key: 'parse', label: 'Understand', loading: 'Understanding request...', icon: '🧠' },
  { key: 'discover', label: 'Discover', loading: 'Searching real providers...', icon: '🔍' },
  { key: 'rank', label: 'Rank', loading: 'Ranking candidates...', icon: '🏆' },
  { key: 'price', label: 'Price', loading: 'Estimating price...', icon: '💰' },
  { key: 'book', label: 'Book', loading: 'Creating booking...', icon: '📋' },
];

const STEPPER_STEPS = [
  { key: 'understand', label: 'Understand' },
  { key: 'discover', label: 'Discover' },
  { key: 'rank', label: 'Rank' },
  { key: 'price', label: 'Price' },
  { key: 'book', label: 'Book' },
  { key: 'recover', label: 'Recover' },
  { key: 'evaluate', label: 'Evaluate' },
];

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState('');
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      let step = 0;
      const iv = setInterval(() => {
        if (step < PIPELINE.length) { setPipelineStep(step); step++; }
        else clearInterval(iv);
      }, 1200);
      return () => { loop.stop(); clearInterval(iv); };
    } else {
      setPipelineStep(-1);
    }
  }, [loading]);

  const handleRun = async () => {
    setLoading(true); setResult(null); setError('');
    try {
      const data = await runFullWorkflow({ rawText: DEMO_REQUEST, mode: 'full' });
      setResult(data);
    } catch (e: any) { setError(e.message || 'Workflow failed.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* ── Hero ── */}
        <View style={s.hero}>
          <Text style={s.title}>KaamWala AI</Text>
          <Text style={s.tagline}>
            Agentic Service Orchestrator for{'\n'}Pakistan's Informal Economy
          </Text>
        </View>

        {/* ── Hero visual wave ── */}
        <View style={s.heroWave}>
          <View style={s.waveGradient}>
            <Text style={s.waveEmoji}>✨ 🧠 ⚡ 🔍 📊</Text>
          </View>
        </View>

        {/* ── Status badges ── */}
        <View style={s.badgeRow}>
          <StatusBadge label="Backend Live" variant="success" />
          <StatusBadge label="Firebase Connected" variant="success" />
        </View>
        <View style={s.badgeRow}>
          <StatusBadge label="Gemini Ready" variant="ai" />
          <StatusBadge label="Places Ready" variant="info" />
        </View>

        {/* ── Notifications ── */}
        <SectionCard title="🔔 Notifications & Follow-Ups" accent="amber">
          {result?.bookingResult ? (
            result.bookingResult.status === 'completed' ? (
              <View style={s.notifRow}>
                <Text style={s.notifIcon}>⭐</Text>
                <View style={s.notifContent}>
                  <Text style={s.notifTitle}>Job Completed & Rated</Text>
                  <Text style={s.notifText}>Your {result.parsedRequest?.serviceType || 'service'} with {result.selectedProvider?.name} was completed. Thank you for your 4.5/5 rating!</Text>
                  <Text style={s.notifTime}>Just now</Text>
                </View>
              </View>
            ) : (
              <View style={s.notifRow}>
                <Text style={s.notifIcon}>⏳</Text>
                <View style={s.notifContent}>
                  <Text style={s.notifTitle}>Awaiting Provider Confirmation</Text>
                  <Text style={s.notifText}>Your {result.parsedRequest?.serviceType || 'service'} booking is sent to {result.selectedProvider?.name}. Follow-up timeline is scheduled.</Text>
                  <Text style={s.notifTime}>Just now</Text>
                  <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('ProviderAdmin')}>
                    <Text style={s.notifBtnText}>Open Provider Dashboard to Accept →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : (
            <View style={s.notifRow}>
              <Text style={s.notifIcon}>✅</Text>
              <View style={s.notifContent}>
                <Text style={s.notifTitle}>All caught up!</Text>
                <Text style={s.notifText}>No active bookings or follow-ups. Run a service request to start the agentic workflow.</Text>
              </View>
            </View>
          )}
        </SectionCard>

        {/* ── Primary CTA ── */}
        <View style={s.ctaSection}>
          <ActionButton
            label="Run Full Agentic Workflow"
            icon="▶"
            onPress={handleRun}
            loading={loading}
            variant="primary"
          />
          <View style={{ height: spacing.md }} />
          <ActionButton
            label="Step-by-Step Demo"
            icon="↓"
            onPress={() => navigation.navigate('ServiceRequest', { prefillText: DEMO_REQUEST })}
            variant="secondary"
          />
        </View>

        {/* ── Loading pipeline ── */}
        {loading && (
          <SectionCard title="Agent Processing" accent="ai">
            {PIPELINE.map((p, i) => {
              const active = i === pipelineStep;
              const done = i < pipelineStep;
              return (
                <Animated.View key={p.key} style={[s.pipeRow, active && { opacity: pulseAnim }]}>
                  <Text style={s.pipeIcon}>
                    {done ? '✅' : active ? '⏳' : '⬜'}
                  </Text>
                  <Text style={[s.pipeLbl, active && s.pipeLblActive, done && s.pipeLblDone]}>
                    {active ? p.loading : `${p.icon} ${p.label}`}
                  </Text>
                </Animated.View>
              );
            })}
          </SectionCard>
        )}

        {/* ── Demo input preview ── */}
        <SectionCard title="Demo Request" subtitle="Roman Urdu • Multilingual Input">
          <View style={s.demoTextBox}>
            <Text style={s.demoText}>"{DEMO_REQUEST}"</Text>
          </View>
        </SectionCard>

        {/* ── Error ── */}
        {error !== '' && (
          <WarningBox variant="error" title="Workflow Error" message={error} />
        )}

        {/* ── Result ── */}
        {result && (<>
          {/* Status header */}
          <View style={s.resultHeader}>
            <StatusBadge
              label={result.success ? 'WORKFLOW COMPLETE' : 'PARTIAL RESULT'}
              variant={result.success ? 'success' : 'warning'}
            />
            <Text style={s.latency}>{result.latencyMs}ms</Text>
          </View>

          {/* Pipeline steps */}
          <SectionCard title="Pipeline Steps">
            {PIPELINE.map((p, i) => {
              const stepName = ['parseRequest','discoverProviders','rankProviders','estimatePrice','createBooking'][i];
              const done = result.completedSteps.includes(stepName) || result.completedSteps.includes(`${stepName}_fallback`);
              const fail = result.failedStep === stepName;
              const fb = result.completedSteps.includes(`${stepName}_fallback`);
              return (
                <View key={p.key} style={s.stepRow}>
                  <View style={[s.stepDot, done && s.stepDotDone, fail && s.stepDotFail]} />
                  <Text style={[s.stepLabel, fail && s.stepLabelFail]}>
                    {p.icon} {p.label}{fb ? ' (fallback)' : ''}
                  </Text>
                  <Text style={s.stepStatus}>{fail ? '✕' : done ? '✓' : '—'}</Text>
                </View>
              );
            })}
          </SectionCard>

          {/* AI Understanding */}
          {result.parsedRequest && (
            <SectionCard title="🧠 AI Understanding" accent="ai"
              badge={<StatusBadge label="Backend Decision" variant="ai" size="sm" />}>
              <Text style={s.resultValue}>{result.parsedRequest.serviceType}</Text>
              <View style={s.metaRow}>
                <Text style={s.metaItem}>📍 {result.parsedRequest.locationText}</Text>
                <Text style={s.metaItem}>🌐 {result.parsedRequest.languageDetected}</Text>
                <Text style={s.metaItem}>🎯 {((result.parsedRequest.confidenceScore ?? 0) * 100).toFixed(0)}%</Text>
              </View>
            </SectionCard>
          )}

          {/* Selected Provider */}
          {result.selectedProvider && (
            <SectionCard title="🏆 Selected Provider"
              badge={<StatusBadge
                label={result.selectedProvider.isRegistered ? 'Registered' : 'Onboarding Required'}
                variant={result.selectedProvider.isRegistered ? 'success' : 'warning'}
                size="sm"
              />}>
              <Text style={s.resultValue}>{result.selectedProvider.name}</Text>
              {result.selectedProvider.isRegistered
                ? <Text style={s.labelSuccess}>✅ Booking eligible • Firestore saved</Text>
                : <Text style={s.labelWarning}>🔍 Real Google Places result • Not yet onboarded</Text>}
            </SectionCard>
          )}

          {/* Price Estimate */}
          {result.priceEstimate && (
            <SectionCard title="💰 Price Estimate"
              badge={<StatusBadge label="Estimated" variant="warning" size="sm" />}>
              <Text style={s.priceValue}>
                {result.priceEstimate.currency} {result.priceEstimate.recommendedEstimate}
              </Text>
              <Text style={s.priceRange}>
                Range: {result.priceEstimate.estimateLow} – {result.priceEstimate.estimateHigh}
              </Text>
            </SectionCard>
          )}

          {/* Booking */}
          {result.bookingResult && (
            <SectionCard title="📋 Booking Record"
              badge={<StatusBadge label="Firestore Saved" variant="ai" size="sm" />}>
              <Text style={s.resultValue}>{result.bookingResult.bookingId}</Text>
              <Text style={s.metaItem}>Status: {result.bookingResult.status}</Text>
              <Text style={s.labelMuted}>No real SMS sent • Simulation boundary</Text>
            </SectionCard>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <WarningBox
              variant="warning"
              title={`${result.warnings.length} Warning${result.warnings.length > 1 ? 's' : ''}`}
              message={result.warnings.slice(0, 3).join('\n')}
            />
          )}

          {/* Action grid */}
          <View style={s.actGrid}>
            <TouchableOpacity style={[s.actBtn, { backgroundColor: colors.tertiaryDark }]}
              onPress={() => navigation.navigate('AgentTrace', { workflowId: result.workflowId, traces: result.traces })}>
              <Text style={s.actBtnText}>🤖 Traces</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AIUnderstanding', { workflowId: result.workflowId, parsedRequest: result.parsedRequest, source: result.warnings.some(w => w.includes('fallback')) ? 'fallback' : 'gemini', traces: result.traces })}>
              <Text style={s.actBtnText}>🧠 AI View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actBtn, { backgroundColor: colors.success }]}
              onPress={() => navigation.navigate('OutcomeEvaluation', { workflowId: result.workflowId, parsedRequest: result.parsedRequest, providerCandidates: result.providerCandidates, rankedProviders: result.rankedProviders, selectedProvider: result.selectedProvider, priceEstimate: result.priceEstimate, bookingResult: result.bookingResult, completedSteps: result.completedSteps, latencyMs: result.latencyMs })}>
              <Text style={s.actBtnText}>📊 Evaluate</Text>
            </TouchableOpacity>
            {result.bookingResult && (
              <TouchableOpacity style={[s.actBtn, { backgroundColor: colors.secondary }]}
                onPress={() => navigation.navigate('FollowUpTimeline', { workflowId: result.workflowId, bookingId: result.bookingResult.bookingId })}>
                <Text style={s.actBtnText}>📋 Follow-Up</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.actBtn, { backgroundColor: colors.error }]}
              onPress={() => navigation.navigate('FallbackRecovery', { workflowId: result.workflowId, bookingId: result.bookingResult?.bookingId })}>
              <Text style={s.actBtnText}>🛡️ Fallback</Text>
            </TouchableOpacity>
          </View>
        </>)}

        {/* ── Workflow Preview ── */}
        <SectionCard title="Workflow Preview">
          <ProgressStepper steps={STEPPER_STEPS} currentStep={0} />
          <View style={s.previewNote}>
            <Text style={s.previewIcon}>🛡️</Text>
            <Text style={s.previewText}>
              Real provider discovery. Safe booking records.{'\n'}Transparent AI traces.
            </Text>
          </View>
        </SectionCard>

        {/* ── Explore grid ── */}
        <Text style={s.sectionLabel}>EXPLORE</Text>
        <View style={s.navGrid}>
          {[
            { n: 'ApiSetupStatus', i: '⚡', l: 'System Status', c: colors.primary },
            { n: 'AgentTrace', i: '🤖', l: 'Agent Traces', c: colors.tertiaryDark },
            { n: 'RegisteredProviders', i: '🔧', l: 'Providers', c: colors.secondary },
            { n: 'ProviderOnboarding', i: '📝', l: 'Onboarding', c: colors.primary },
            { n: 'BaselineComparison', i: '⚖️', l: 'Baseline', c: colors.tertiaryDark },
            { n: 'AntigravityEvidence', i: '🎯', l: 'Evidence', c: colors.success },
            { n: 'FallbackRecovery', i: '🛡️', l: 'Fallback', c: colors.error },
            { n: 'FinalChecklist', i: '📋', l: 'Checklist', c: colors.primary },
          ].map(v => (
            <TouchableOpacity key={v.n} style={s.navCard} onPress={() => navigation.navigate(v.n)}>
              <View style={[s.navIconCircle, { backgroundColor: v.c + '15' }]}>
                <Text style={s.navIcon}>{v.i}</Text>
              </View>
              <Text style={s.navLabel}>{v.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20, maxWidth: 960, alignSelf: 'center' as const, width: '100%' as any },

  // Hero
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 8, paddingHorizontal: spacing.xl },
  title: { fontSize: 30, fontWeight: '700', color: colors.primaryDark, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },

  // Wave hero visual
  heroWave: { marginHorizontal: spacing.xl, marginBottom: spacing.lg, borderRadius: radius.xl, overflow: 'hidden' },
  waveGradient: { height: 100, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center', borderRadius: radius.xl },
  waveEmoji: { fontSize: 28, letterSpacing: 12 },

  // Badges
  badgeRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.xl },

  // CTA
  ctaSection: { paddingHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.xxl },

  // Pipeline loading
  pipeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.md },
  pipeIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  pipeLbl: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  pipeLblActive: { color: colors.primary, fontWeight: '700' },
  pipeLblDone: { color: colors.success },

  // Demo input
  demoTextBox: { backgroundColor: colors.surfaceContainer, padding: spacing.lg, borderRadius: radius.lg },
  demoText: { fontSize: 15, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 22 },

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  notifIcon: { fontSize: 24, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  notifText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  notifTime: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  notifBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.surfaceContainerHigh, borderRadius: radius.md, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borderLight },
  notifBtnText: { fontSize: 12, fontWeight: '700', color: colors.amber },

  // Result header
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  latency: { fontSize: 13, color: colors.textMuted, fontFamily: 'monospace' },

  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.md },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  stepDotDone: { backgroundColor: colors.success },
  stepDotFail: { backgroundColor: colors.error },
  stepLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  stepLabelFail: { color: colors.error },
  stepStatus: { fontSize: 14, fontWeight: '600', color: colors.textMuted },

  // Result cards
  resultValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { fontSize: 13, color: colors.textSecondary },
  labelSuccess: { fontSize: 13, color: colors.success, marginTop: 6, fontWeight: '500' },
  labelWarning: { fontSize: 13, color: colors.warning, marginTop: 6, fontWeight: '500' },
  labelMuted: { fontSize: 13, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },

  // Price
  priceValue: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  priceRange: { fontSize: 14, color: colors.textSecondary },

  // Action grid
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl - 4, gap: spacing.sm, marginBottom: spacing.lg },
  actBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, minWidth: 100, alignItems: 'center' },
  actBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Workflow preview
  previewNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  previewIcon: { fontSize: 18, marginTop: 2 },
  previewText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, flex: 1 },

  // Section label
  sectionLabel: { ...typography.labelSm, marginHorizontal: spacing.xl, marginTop: spacing.xxl, marginBottom: spacing.md },

  // Nav grid
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl - 4, gap: spacing.sm },
  navCard: { width: '22%' as any, minWidth: 72, backgroundColor: colors.surface, paddingVertical: 12, borderRadius: radius.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.card },
  navIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 11, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
});
