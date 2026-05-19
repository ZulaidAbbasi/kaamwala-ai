// src/screens/HomeScreen.tsx
// Premium home screen — Stitch design system applied
// Preserves ALL existing workflow logic and navigation

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_REQUEST } from '../config/constants';
import { runFullWorkflow, WorkflowResult } from '../services/backend/orchestratorClient';
import * as Location from 'expo-location';
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

  // Request location permission on app open
  useEffect(() => {
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch {
        // silent — will re-ask on ServiceRequestEntry
      }
    })();
  }, []);

  const [activeBooking, setActiveBooking] = useState<any>(null);

  React.useEffect(() => {
    const fetchLatestBooking = async () => {
      try {
        const url = 'https://us-central1-kaamwala-ai.cloudfunctions.net/api/bookings';
        const r = await fetch(url);
        const data = await r.json();
        if (data.success && data.bookings && data.bookings.length > 0) {
          setActiveBooking(data.bookings[0]);
        }
      } catch (err) {
        // silent fail
      }
    };
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLatestBooking();
    });
    fetchLatestBooking();
    return unsubscribe;
  }, [navigation]);

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
          <View style={s.poweredByRow}>
            <Text style={s.poweredByText}>Powered by <Text style={s.antigravityText}>Google Antigravity</Text></Text>
          </View>
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
          {activeBooking ? (
            activeBooking.status === 'completed' ? (
              <View style={s.notifRow}>
                <Text style={s.notifIcon}>⭐</Text>
                <View style={s.notifContent}>
                  <Text style={s.notifTitle}>Job Completed</Text>
                  <Text style={s.notifText}>Your {activeBooking.serviceType} with {activeBooking.providerName} was completed successfully!</Text>
                  <Text style={s.notifTime}>{new Date(activeBooking.createdAt?._seconds ? activeBooking.createdAt._seconds * 1000 : Date.now()).toLocaleTimeString()} • Simulated</Text>
                </View>
              </View>
            ) : activeBooking.status === 'confirmed' ? (
               <View style={s.notifRow}>
                <Text style={s.notifIcon}>🚗</Text>
                <View style={s.notifContent}>
                  <Text style={s.notifTitle}>Provider En Route</Text>
                  <Text style={s.notifText}>{activeBooking.providerName} accepted your request and is en route for your {activeBooking.serviceType}.</Text>
                  <Text style={s.notifTime}>Provider Accepted • Scheduled</Text>
                  <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('ProviderAdmin')}>
                    <Text style={s.notifBtnText}>Complete Job in Dashboard →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={s.notifRow}>
                <Text style={s.notifIcon}>⏳</Text>
                <View style={s.notifContent}>
                  <Text style={s.notifTitle}>Awaiting Provider Confirmation</Text>
                  <Text style={s.notifText}>Your {activeBooking.serviceType} booking is sent to {activeBooking.providerName}.</Text>
                  <Text style={s.notifTime}>Pending</Text>
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
            label="Start Service Request"
            icon="▶"
            onPress={() => navigation.navigate('ServiceRequestEntry')}
            loading={false}
            variant="primary"
          />
          <View style={{ height: spacing.md }} />
          <ActionButton
            label="Run Full Agentic Workflow"
            icon="⚡"
            onPress={handleRun}
            loading={loading}
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
  safe: { flex: 1, backgroundColor: '#070A12' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32, maxWidth: 960, alignSelf: 'center' as const, width: '100%' as any },

  // Hero
  hero: { alignItems: 'center', paddingTop: 36, paddingBottom: 12, paddingHorizontal: spacing.xl },
  title: { fontSize: 34, fontWeight: '800', color: '#10B981', letterSpacing: -0.8 },
  tagline: { fontSize: 15, color: 'rgba(148,163,184,0.9)', marginTop: 10, textAlign: 'center', lineHeight: 23 },
  poweredByRow: { marginTop: 14, backgroundColor: 'rgba(16,185,129,0.06)', paddingVertical: 7, paddingHorizontal: 18, borderRadius: 24, alignSelf: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  poweredByText: { fontSize: 12, color: 'rgba(148,163,184,0.8)' },
  antigravityText: { color: '#F59E0B', fontWeight: '700' },

  // Wave hero visual
  heroWave: { marginHorizontal: spacing.xl, marginBottom: spacing.xl, borderRadius: 20, overflow: 'hidden' },
  waveGradient: { height: 80, backgroundColor: 'rgba(16,185,129,0.04)', justifyContent: 'center', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.08)' },
  waveEmoji: { fontSize: 24, letterSpacing: 16, opacity: 0.7 },

  // Badges
  badgeRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.sm + 2, paddingHorizontal: spacing.xl },

  // CTA
  ctaSection: { paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.xxl },

  // Pipeline loading
  pipeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.md },
  pipeIcon: { fontSize: 16, width: 28, textAlign: 'center' },
  pipeLbl: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  pipeLblActive: { color: '#10B981', fontWeight: '700' },
  pipeLblDone: { color: '#10B981' },

  // Demo input
  demoTextBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.lg, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  demoText: { fontSize: 15, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 23 },

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md + 2 },
  notifIcon: { fontSize: 26, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 5 },
  notifText: { fontSize: 14, color: 'rgba(148,163,184,0.85)', lineHeight: 21 },
  notifTime: { fontSize: 11, color: 'rgba(100,116,139,0.7)', marginTop: 8, letterSpacing: 0.3 },
  notifBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  notifBtnText: { fontSize: 12, fontWeight: '700', color: '#10B981' },

  // Result header
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.md + 4 },
  latency: { fontSize: 12, color: 'rgba(100,116,139,0.6)', fontFamily: 'monospace', letterSpacing: 0.5 },

  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.md },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)' },
  stepDotDone: { backgroundColor: '#10B981' },
  stepDotFail: { backgroundColor: '#F43F5E' },
  stepLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#E2E8F0' },
  stepLabelFail: { color: '#F43F5E' },
  stepStatus: { fontSize: 14, fontWeight: '600', color: 'rgba(100,116,139,0.6)' },

  // Result cards
  resultValue: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 6, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  metaItem: { fontSize: 13, color: 'rgba(148,163,184,0.8)' },
  labelSuccess: { fontSize: 13, color: '#10B981', marginTop: 8, fontWeight: '600' },
  labelWarning: { fontSize: 13, color: '#F59E0B', marginTop: 8, fontWeight: '600' },
  labelMuted: { fontSize: 13, color: 'rgba(100,116,139,0.6)', marginTop: 8, fontStyle: 'italic' },

  // Price
  priceValue: { fontSize: 26, fontWeight: '800', color: '#10B981', marginBottom: 2, letterSpacing: -0.5 },
  priceRange: { fontSize: 14, color: 'rgba(148,163,184,0.7)' },

  // Action grid
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl - 4, gap: spacing.sm + 2, marginBottom: spacing.xl },
  actBtn: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, minWidth: 105, alignItems: 'center' },
  actBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },

  // Workflow preview
  previewNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  previewIcon: { fontSize: 18, marginTop: 2 },
  previewText: { fontSize: 14, color: 'rgba(148,163,184,0.8)', lineHeight: 22, flex: 1 },

  // Section label
  sectionLabel: { ...typography.labelSm, marginHorizontal: spacing.xl, marginTop: spacing.xxxl, marginBottom: spacing.md, letterSpacing: 1.5, fontSize: 11 },

  // Nav grid
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl - 4, gap: spacing.sm + 2 },
  navCard: { width: '22%' as any, minWidth: 72, backgroundColor: 'rgba(255,255,255,0.04)', paddingVertical: 14, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', ...shadows.card },
  navIconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 11, fontWeight: '600', color: '#E2E8F0', textAlign: 'center' },
});
