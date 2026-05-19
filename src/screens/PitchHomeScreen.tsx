// src/screens/PitchHomeScreen.tsx
// Premium startup landing — the first thing judges see

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  // Dark premium palette
  bgDark: '#0B0F1A',
  bgCard: '#141B2B',
  bgCardAlt: '#1A2235',
  surface: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.10)',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  muted: '#64748B',
  // Accent colors
  emerald: '#10B981',
  emeraldGlow: 'rgba(16,185,129,0.15)',
  cyan: '#06B6D4',
  cyanGlow: 'rgba(6,182,212,0.15)',
  violet: '#8B5CF6',
  violetGlow: 'rgba(139,92,246,0.15)',
  amber: '#F59E0B',
  amberGlow: 'rgba(245,158,11,0.12)',
  rose: '#F43F5E',
  // Gradients
  gradStart: '#064E3B',
  gradMid: '#065F46',
  gradEnd: '#0D9488',
  border: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(16,185,129,0.3)',
};

const DEMO_TEXT = 'AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.';

const WORKFLOW_STEPS = [
  { icon: '🧠', label: 'Understand', color: C.violet },
  { icon: '🔍', label: 'Discover', color: C.cyan },
  { icon: '🏆', label: 'Rank', color: C.emerald },
  { icon: '💰', label: 'Price', color: C.amber },
  { icon: '📋', label: 'Book', color: C.emerald },
  { icon: '📅', label: 'Follow-Up', color: C.cyan },
  { icon: '🔄', label: 'Recover', color: C.rose },
  { icon: '🤖', label: 'Trace', color: C.violet },
];

export default function PitchHomeScreen({ navigation }: { navigation: any }) {
  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // Fetch latest booking for alerts
  const [booking, setBooking] = useState<any>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const r = await fetch('https://us-central1-kaamwala-ai.cloudfunctions.net/api/bookings');
        const data = await r.json();
        if (data.success && data.bookings?.length > 0) {
          setBooking(data.bookings[0]);
          setAlertCount(data.bookings.length);
        }
      } catch { /* silent */ }
    };
    const unsub = navigation.addListener('focus', fetchBooking);
    fetchBooking();
    return unsub;
  }, [navigation]);

  const statusItems = [
    { label: 'Backend Live', color: C.emerald, glow: C.emeraldGlow },
    { label: 'Google Places', color: C.cyan, glow: C.cyanGlow },
    { label: 'Firestore DB', color: C.violet, glow: C.violetGlow },
    { label: 'Gemini AI', color: C.amber, glow: C.amberGlow },
  ];

  const quickActions = [
    { icon: '📋', label: 'Provider Dashboard', screen: 'ProviderAdmin', color: C.emerald },
    { icon: '⚙️', label: 'System Status', screen: 'ApiSetupStatus', color: C.cyan },
    { icon: '🔄', label: 'Fallback Recovery', screen: 'FallbackRecovery', params: {}, color: C.rose },
    { icon: '🤖', label: 'Agent Traces', screen: 'AgentTrace', params: {}, color: C.violet },
    { icon: '📊', label: 'Baseline Comparison', screen: 'BaselineComparison', params: {}, color: C.amber },
    { icon: '📝', label: 'Submission Checklist', screen: 'FinalChecklist', color: C.cyan },
  ];

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0B0F1A', '#111827', '#0B0F1A']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* ──── Hero Section ──── */}
          <View style={s.heroSection}>
            {/* Subtle gradient glow behind title */}
            <LinearGradient
              colors={['rgba(16,185,129,0.12)', 'rgba(6,182,212,0.08)', 'transparent']}
              style={s.heroGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Text style={s.heroTitle}>KaamWala AI</Text>
            <Text style={s.heroSubtitle}>Agentic Service Orchestrator</Text>
            <View style={s.heroBadge}>
              <LinearGradient colors={[C.gradStart, C.gradEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.heroBadgeGrad}>
                <Text style={s.heroBadgeText}>🇵🇰  For Pakistan's Informal Economy</Text>
              </LinearGradient>
            </View>
          </View>

          {/* ──── Tagline Card ──── */}
          <View style={s.taglineCard}>
            <View style={s.taglineAccent} />
            <Text style={s.taglineText}>
              Book trusted local services from one informal request — with AI understanding, provider ranking, price estimation, safe booking, follow-up, and recovery.
            </Text>
          </View>

          {/* ──── Status Indicators ──── */}
          <View style={s.statusRow}>
            {statusItems.map((item, i) => (
              <Animated.View key={i} style={[s.statusChip, { backgroundColor: item.glow }]}>
                <Animated.View style={[s.statusDot, { backgroundColor: item.color, transform: [{ scale: pulseAnim }] }]} />
                <Text style={[s.statusLabel, { color: item.color }]}>{item.label}</Text>
              </Animated.View>
            ))}
          </View>

          {/* ──── Alerts / Notifications ──── */}
          <View style={s.alertsCard}>
            <View style={s.alertsHeader}>
              <View style={s.alertsBellWrap}>
                <Text style={s.alertsBellIcon}>🔔</Text>
                {alertCount > 0 && (
                  <View style={s.alertsBadge}>
                    <Text style={s.alertsBadgeText}>{alertCount}</Text>
                  </View>
                )}
              </View>
              <Text style={s.alertsTitle}>Alerts & Follow-Ups</Text>
            </View>
            {booking ? (
              <TouchableOpacity
                style={s.alertItem}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ProviderAdmin')}
              >
                <Text style={s.alertItemIcon}>
                  {booking.status === 'completed' ? '⭐' : booking.status === 'confirmed' ? '🚗' : '⏳'}
                </Text>
                <View style={s.alertItemContent}>
                  <Text style={s.alertItemTitle}>
                    {booking.status === 'completed' ? 'Job Completed' : booking.status === 'confirmed' ? 'Provider En Route' : 'Awaiting Confirmation'}
                  </Text>
                  <Text style={s.alertItemText}>
                    {booking.serviceType} — {booking.providerName}
                  </Text>
                  <Text style={s.alertItemTime}>
                    {booking.status === 'completed' ? '✅ Completed' : booking.status === 'confirmed' ? '🟢 Accepted' : '🟡 Pending'}
                    {' · Tap to manage'}
                  </Text>
                </View>
                <Text style={s.alertItemArrow}>→</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.alertEmpty}>
                <Text style={s.alertEmptyText}>✅ No active alerts. Run a service request to start.</Text>
              </View>
            )}
          </View>

          {/* ──── Primary CTA ──── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ServiceRequestEntry')}
          >
            <LinearGradient
              colors={[C.gradStart, C.gradMid, C.gradEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.primaryBtn}
            >
              <Text style={s.primaryBtnIcon}>⚡</Text>
              <Text style={s.primaryBtnText}>Start Service Request</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ──── Secondary CTA ──── */}
          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('LiveWorkflow', { rawText: DEMO_TEXT, isDemo: true })}
          >
            <Text style={s.secondaryBtnIcon}>▶</Text>
            <Text style={s.secondaryBtnText}>Run Demo Scenario</Text>
          </TouchableOpacity>

          {/* ──── Workflow Pipeline ──── */}
          <View style={s.pipelineCard}>
            <Text style={s.sectionTitle}>Agentic Pipeline</Text>
            <Text style={s.sectionSubtitle}>8-stage autonomous workflow</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={s.pipelineContent}
              style={s.pipelineScroll}
            >
              {WORKFLOW_STEPS.map((step, i) => (
                <View key={i} style={s.pipelineItem}>
                  <View style={[s.pipelineCircle, { borderColor: step.color, shadowColor: step.color }]}>
                    <Text style={s.pipelineIcon}>{step.icon}</Text>
                  </View>
                  <Text style={s.pipelineLabel}>{step.label}</Text>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <View style={s.pipelineConnector}>
                      <LinearGradient
                        colors={[step.color, WORKFLOW_STEPS[i + 1].color]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={s.pipelineConnectorGrad}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ──── Quick Actions ──── */}
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={s.actionCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(action.screen, action.params || {})}
              >
                <View style={[s.actionIconWrap, { backgroundColor: `${action.color}18` }]}>
                  <Text style={s.actionIcon}>{action.icon}</Text>
                </View>
                <Text style={s.actionLabel}>{action.label}</Text>
                <Text style={[s.actionArrow, { color: action.color }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ──── Footer ──── */}
          <View style={s.footer}>
            <LinearGradient colors={['transparent', 'rgba(16,185,129,0.06)', 'transparent']} style={s.footerGlow} />
            <Text style={s.footerText}>Team Panthers</Text>
            <Text style={s.footerSub}>Developed in Google Antigravity · Powered by Firebase + Gemini</Text>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060912' },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, maxWidth: 680, alignSelf: 'center' as const, width: '100%' as any },

  // Hero
  heroSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 12, position: 'relative' },
  heroGlow: { position: 'absolute', top: -50, left: -80, right: -80, height: 220, borderRadius: 120 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: '#F8FAFC', letterSpacing: -2.5, textAlign: 'center' },
  heroSubtitle: { fontSize: 17, fontWeight: '500', color: 'rgba(148,163,184,0.9)', textAlign: 'center', marginTop: 6, letterSpacing: 1 },
  heroBadge: { marginTop: 16, borderRadius: 28, overflow: 'hidden' },
  heroBadgeGrad: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 28 },
  heroBadgeText: { fontSize: 13, fontWeight: '700', color: '#D1FAE5', letterSpacing: 0.4 },

  // Tagline
  taglineCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 20, marginTop: 24, borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)' },
  taglineAccent: { width: 3, backgroundColor: '#10B981', borderRadius: 2, marginRight: 16 },
  taglineText: { flex: 1, fontSize: 14, color: 'rgba(148,163,184,0.85)', lineHeight: 23 },

  // Status
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24, justifyContent: 'center' },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },

  // Primary CTA
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 22, borderRadius: 18, marginTop: 24, gap: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 14 },
  primaryBtnIcon: { fontSize: 22 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },

  // Secondary CTA
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, marginTop: 12, borderWidth: 1.5, borderColor: 'rgba(16,185,129,0.25)', backgroundColor: 'rgba(16,185,129,0.06)', gap: 10 },
  secondaryBtnIcon: { fontSize: 14, color: '#10B981' },
  secondaryBtnText: { color: '#10B981', fontSize: 16, fontWeight: '700' },

  // Pipeline
  pipelineCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 22, marginTop: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: 'rgba(100,116,139,0.7)', marginTop: 3, marginBottom: 18 },
  pipelineScroll: { marginHorizontal: -22 },
  pipelineContent: { paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 22 },
  pipelineItem: { alignItems: 'center', position: 'relative', width: 50 },
  pipelineCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
  pipelineIcon: { fontSize: 17 },
  pipelineLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(100,116,139,0.7)', marginTop: 6, textAlign: 'center', width: 54, letterSpacing: 0.3 },
  pipelineConnector: { position: 'absolute', top: 20, left: 26, width: 68, height: 2, zIndex: -1 },
  pipelineConnectorGrad: { flex: 1, height: 2, borderRadius: 1, opacity: 0.4 },

  // Quick actions
  actionsGrid: { gap: 10, marginTop: 14, marginBottom: 20 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 14 },
  actionIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 19 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#E2E8F0' },
  actionArrow: { fontSize: 18, fontWeight: '700' },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 28, position: 'relative' },
  footerGlow: { position: 'absolute', top: 0, left: -40, right: -40, height: 80, borderRadius: 40 },
  footerText: { fontSize: 15, fontWeight: '800', color: '#10B981', letterSpacing: 0.8 },
  footerSub: { fontSize: 11, color: 'rgba(100,116,139,0.6)', marginTop: 5, textAlign: 'center' },

  // Alerts
  alertsCard: { backgroundColor: 'rgba(245,158,11,0.04)', borderRadius: 20, padding: 20, marginTop: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.12)' },
  alertsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  alertsBellWrap: { position: 'relative' },
  alertsBellIcon: { fontSize: 24 },
  alertsBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#F43F5E', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  alertsBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  alertsTitle: { fontSize: 18, fontWeight: '800', color: '#F59E0B', letterSpacing: -0.2 },
  alertItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  alertItemIcon: { fontSize: 28 },
  alertItemContent: { flex: 1 },
  alertItemTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 3 },
  alertItemText: { fontSize: 13, color: 'rgba(148,163,184,0.85)' },
  alertItemTime: { fontSize: 11, color: 'rgba(100,116,139,0.7)', marginTop: 4, letterSpacing: 0.3 },
  alertItemArrow: { fontSize: 18, fontWeight: '700', color: '#F59E0B' },
  alertEmpty: { paddingVertical: 8 },
  alertEmptyText: { fontSize: 13, color: 'rgba(100,116,139,0.6)' },
});
