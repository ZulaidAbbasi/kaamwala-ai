// src/screens/AntigravityEvidenceScreen.tsx
// Shows evidence of each agentic capability for judges

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const EVIDENCE = [
  {
    category: 'Multilingual NLU',
    icon: '🌐',
    claims: [
      'Accepts Urdu, Roman Urdu, and English input',
      'Gemini 2.0 Flash extracts structured fields',
      'Deterministic keyword fallback if Gemini fails',
      'Confidence score + missing field detection',
    ],
    proof: 'POST /parseRequest → parsedRequest with languageDetected, confidenceScore, missingFields',
  },
  {
    category: 'Real Provider Discovery',
    icon: '🔍',
    claims: [
      'Google Places API (New) — real businesses, real ratings',
      'Registered provider database — demo-controlled, safe',
      'No invented providers — null is null',
      'Geocoding + distance estimation via Google APIs',
    ],
    proof: 'POST /discoverProviders → real place IDs, real ratings, real addresses',
  },
  {
    category: 'Transparent Ranking',
    icon: '🏆',
    claims: [
      '12-factor deterministic scoring (100% weights)',
      'Gemini explains but does NOT choose',
      'Baseline comparison (nearest-only) included',
      'Per-factor breakdown visible in UI',
    ],
    proof: 'POST /rankProviders → rankedProviders with per-factor scores',
  },
  {
    category: 'Safe Booking Logic',
    icon: '📋',
    claims: [
      'Only registered providers get confirmed bookings',
      'Google Places providers → onboarding_required status',
      'No real SMS/WhatsApp sent',
      'Notification previews clearly labeled PREVIEW ONLY',
    ],
    proof: 'POST /createBooking → booking with isRealBooking flag + notification previews',
  },
  {
    category: 'Fallback & Recovery',
    icon: '🛡️',
    claims: [
      '6 recovery scenarios (cancellation, no provider, low confidence, API failure, price dispute, missing location)',
      'Each scenario: observation → action → evaluation traces',
      'Bilingual apology generation',
      'Automated replacement provider search',
    ],
    proof: 'POST /resolveDispute → recovery result with stateBefore/stateAfter',
  },
  {
    category: 'Agent Traceability',
    icon: '🤖',
    claims: [
      'Every decision logged with agent name, phase, reasoning, confidence',
      'Traces stored in Firestore agent_traces collection',
      'Viewable in AgentTraceScreen',
      'Orchestrator logs 7+ traces per full workflow',
    ],
    proof: 'GET /traces/:workflowId or embedded traces in every endpoint response',
  },
  {
    category: 'End-to-End Orchestrator',
    icon: '⚡',
    claims: [
      'POST /runWorkflow chains all 5 steps in one call',
      'Never crashes — returns partial result on failure',
      'Saves workflow_summaries to Firestore',
      'Outcome evaluation with 12 metrics + scoring',
    ],
    proof: 'POST /runWorkflow → complete OrchestratorResult with all step outputs',
  },
  {
    category: 'Privacy & Safety',
    icon: '🔒',
    claims: [
      'API keys stay in backend Cloud Functions only',
      'No PII sent to Gemini prompts',
      'No real messages sent to providers',
      'Demo providers clearly marked as demo-controlled',
    ],
    proof: 'See docs/PRIVACY_SAFETY.md and docs/ACTION_SIMULATION.md',
  },
];

export default function AntigravityEvidenceScreen({ navigation }: { navigation: any }) {
  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>🎯 Agentic Evidence</Text>
        <Text style={s.subtitle}>Proof of each capability for hackathon judges</Text>
        <Text style={s.countBadge}>{EVIDENCE.length} capabilities documented</Text>
      </View>

      {EVIDENCE.map((e, i) => (
        <View key={i} style={s.card}>
          <Text style={s.cardTitle}>{e.icon} {e.category}</Text>
          {e.claims.map((c, j) => (
            <Text key={j} style={s.claim}>✅ {c}</Text>
          ))}
          <View style={s.proofBox}>
            <Text style={s.proofLabel}>PROOF</Text>
            <Text style={s.proofText}>{e.proof}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backBtnText}>← Back to Home</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A' },
  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  countBadge: { fontSize: 10, color: '#4285F4', fontWeight: '700', marginTop: 6 },

  card: { marginHorizontal: 16, marginBottom: 10, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  claim: { fontSize: 11, color: '#E2E8F0', lineHeight: 20, paddingLeft: 4 },

  proofBox: { marginTop: 8, padding: 8, backgroundColor: '#1A2A1A', borderRadius: 8 },
  proofLabel: { fontSize: 8, fontWeight: '800', color: '#34A853', letterSpacing: 1, marginBottom: 2 },
  proofText: { fontSize: 10, color: '#CCDDCC', lineHeight: 14 },

  backBtn: { margin: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, alignItems: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
});
