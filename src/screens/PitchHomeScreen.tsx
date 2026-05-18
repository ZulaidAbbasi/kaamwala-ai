// src/screens/PitchHomeScreen.tsx
// Premium startup landing — the first thing judges see

import React, { useEffect, useRef } from 'react';
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
  root: { flex: 1, backgroundColor: C.bgDark },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  // Hero
  heroSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 8, position: 'relative' },
  heroGlow: { position: 'absolute', top: -30, left: -60, right: -60, height: 180, borderRadius: 100 },
  heroTitle: { fontSize: 44, fontWeight: '900', color: C.text, letterSpacing: -2, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, fontWeight: '500', color: C.textSecondary, textAlign: 'center', marginTop: 4, letterSpacing: 0.5 },
  heroBadge: { marginTop: 14, borderRadius: 24, overflow: 'hidden' },
  heroBadgeGrad: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24 },
  heroBadgeText: { fontSize: 13, fontWeight: '700', color: '#D1FAE5', letterSpacing: 0.3 },

  // Tagline
  taglineCard: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, padding: 18, marginTop: 20, borderWidth: 1, borderColor: C.border },
  taglineAccent: { width: 4, backgroundColor: C.emerald, borderRadius: 2, marginRight: 14 },
  taglineText: { flex: 1, fontSize: 14, color: C.textSecondary, lineHeight: 22 },

  // Status
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, justifyContent: 'center' },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 7, borderWidth: 1, borderColor: C.border },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Primary CTA
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 16, marginTop: 20, gap: 10, shadowColor: C.emerald, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  primaryBtnIcon: { fontSize: 20 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', letterSpacing: 0.3 },

  // Secondary CTA
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, marginTop: 10, borderWidth: 1.5, borderColor: C.borderAccent, backgroundColor: C.emeraldGlow, gap: 10 },
  secondaryBtnIcon: { fontSize: 14, color: C.emerald },
  secondaryBtnText: { color: C.emerald, fontSize: 16, fontWeight: '700' },

  // Pipeline
  pipelineCard: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginTop: 28, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 16 },
  pipelineScroll: { marginHorizontal: -20 },
  pipelineContent: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  pipelineItem: { alignItems: 'center', position: 'relative', width: 46 },
  pipelineCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6 },
  pipelineIcon: { fontSize: 15 },
  pipelineLabel: { fontSize: 8, fontWeight: '600', color: C.muted, marginTop: 4, textAlign: 'center', width: 50 },
  pipelineConnector: { position: 'absolute', top: 17, left: 23, width: 66, height: 2, zIndex: -1 },
  pipelineConnectorGrad: { flex: 1, height: 2, borderRadius: 1, opacity: 0.5 },

  // Quick actions
  actionsGrid: { gap: 8, marginTop: 12, marginBottom: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
  actionIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 18 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
  actionArrow: { fontSize: 18, fontWeight: '700' },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 24, position: 'relative' },
  footerGlow: { position: 'absolute', top: 0, left: -40, right: -40, height: 80, borderRadius: 40 },
  footerText: { fontSize: 14, fontWeight: '800', color: C.emerald, letterSpacing: 0.5 },
  footerSub: { fontSize: 11, color: C.muted, marginTop: 4, textAlign: 'center' },
});
