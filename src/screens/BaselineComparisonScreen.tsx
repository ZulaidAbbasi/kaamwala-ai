// src/screens/BaselineComparisonScreen.tsx
// Judge-friendly: why KaamWala AI beats a normal booking app — DARK THEME

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg: '#0B0F1A', surface: 'rgba(255,255,255,0.06)', text: '#F1F5F9', muted: '#64748B',
  green: '#10B981', greenBg: 'rgba(16,185,129,0.15)',
  red: '#F43F5E', redBg: 'rgba(244,63,94,0.12)',
  purple: '#8B5CF6', purpleBg: 'rgba(139,92,246,0.12)',
  teal: '#06B6D4', tealBg: 'rgba(6,182,212,0.12)',
  amber: '#F59E0B', amberBg: 'rgba(245,158,11,0.12)',
  blue: '#3B82F6', blueBg: 'rgba(59,130,246,0.12)',
  border: 'rgba(255,255,255,0.08)',
};

const ROWS = [
  { dim: 'Intent Understanding', icon: '🧠', normal: 'Keyword search only', ai: 'Understands Roman Urdu meaning' },
  { dim: 'Provider Discovery', icon: '🔍', normal: 'Ask friends or one platform', ai: 'Real Google Places + registered' },
  { dim: 'Selection Logic', icon: '🏆', normal: 'Nearest pick, no reasoning', ai: '12-factor scoring with explanation' },
  { dim: 'Pricing', icon: '💰', normal: 'Ask provider, no comparison', ai: 'Transparent estimate with breakdown' },
  { dim: 'Booking', icon: '📋', normal: 'Verbal agreement, no record', ai: 'Firestore record with event trail' },
  { dim: 'Follow-Up', icon: '📅', normal: 'No reminder, no feedback', ai: 'Automated reminder + rating request' },
  { dim: 'Recovery', icon: '🔄', normal: 'If cancelled, start over', ai: 'Self-corrects, suggests alternatives' },
  { dim: 'Traceability', icon: '🤖', normal: 'Opaque, no explanation', ai: 'Every decision logged and explainable' },
];

const METRICS = [
  { title: 'Transparency', score: '100%', icon: '🔍', desc: 'Every ranking factor visible', color: C.green, bg: C.greenBg },
  { title: 'Match Quality', score: '12x', icon: '🏆', desc: '12-factor vs 1-factor matching', color: C.purple, bg: C.purpleBg },
  { title: 'Recovery', score: '6', icon: '🛡️', desc: 'Automated fallback scenarios', color: C.amber, bg: C.amberBg },
  { title: 'Completeness', score: '10', icon: '📊', desc: 'End-to-end workflow stages', color: C.blue, bg: C.blueBg },
];

export default function BaselineComparisonScreen() {
  return (
    <View style={s.root}>
    <LinearGradient colors={['#0B0F1A', '#111827', '#0B0F1A']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <Text style={s.title}>Why this beats a normal booking app</Text>
        <Text style={s.subtitle}>Side-by-side comparison of traditional vs agentic service orchestration</Text>

        {/* Metric cards */}
        <View style={s.metricRow}>
          {METRICS.map((m, i) => (
            <View key={i} style={[s.metricCard, { borderLeftColor: m.color }]}>
              <Text style={s.metricIcon}>{m.icon}</Text>
              <Text style={[s.metricScore, { color: m.color }]}>{m.score}</Text>
              <Text style={s.metricTitle}>{m.title}</Text>
              <Text style={s.metricDesc}>{m.desc}</Text>
            </View>
          ))}
        </View>

        {/* Comparison header */}
        <View style={s.headerRow}>
          <Text style={s.headerDim}>Dimension</Text>
          <Text style={s.headerNormal}>Normal App</Text>
          <Text style={s.headerAI}>KaamWala AI</Text>
        </View>

        {/* Comparison rows */}
        {ROWS.map((r, i) => (
          <View key={i} style={s.compCard}>
            <Text style={s.compDim}>{r.icon} {r.dim}</Text>
            <View style={s.compColumns}>
              <View style={s.compCol}>
                <Text style={s.compNormal}>❌ {r.normal}</Text>
              </View>
              <View style={s.compCol}>
                <Text style={s.compAI}>✅ {r.ai}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Summary */}
        <View style={s.summaryBox}>
          <Text style={s.summaryTitle}>Bottom Line</Text>
          <Text style={s.summaryText}>
            A normal app matches by distance. KaamWala AI understands intent, ranks transparently, recovers from failure, and logs every decision for accountability.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },

  title: { fontSize: 22, fontWeight: '900', color: C.text },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 4, marginBottom: 16 },

  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  metricCard: { width: '47%', backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, alignItems: 'center' },
  metricIcon: { fontSize: 24 },
  metricScore: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  metricTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 },
  metricDesc: { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 2 },

  headerRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: C.border, marginBottom: 4 },
  headerDim: { fontSize: 12, fontWeight: '700', color: C.muted, width: '30%' },
  headerNormal: { fontSize: 12, fontWeight: '700', color: C.red, flex: 1, textAlign: 'center' },
  headerAI: { fontSize: 12, fontWeight: '700', color: C.green, flex: 1, textAlign: 'center' },

  compCard: { backgroundColor: C.surface, borderRadius: 12, padding: 12, marginVertical: 4, borderWidth: 1, borderColor: C.border },
  compDim: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
  compColumns: { flexDirection: 'row', gap: 8 },
  compCol: { flex: 1 },
  compNormal: { fontSize: 13, color: C.red, lineHeight: 18 },
  compAI: { fontSize: 13, color: C.green, lineHeight: 18 },

  summaryBox: { backgroundColor: C.greenBg, borderRadius: 14, padding: 16, marginTop: 16, borderLeftWidth: 4, borderLeftColor: C.green },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: C.green, marginBottom: 4 },
  summaryText: { fontSize: 14, color: C.text, lineHeight: 21 },
});
