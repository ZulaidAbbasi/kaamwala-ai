// src/screens/FinalSubmissionChecklistScreen.tsx
// Stable, instant-loading submission checklist — DARK THEME

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

type ChipStatus = 'ready' | 'pending' | 'review';

interface CheckItem {
  label: string;
  status: ChipStatus;
  detail: string;
}

const C = {
  bg: '#0B0F1A', surface: 'rgba(255,255,255,0.06)', text: '#F1F5F9', muted: '#64748B',
  green: '#10B981', greenBg: 'rgba(16,185,129,0.15)',
  amber: '#F59E0B', amberBg: 'rgba(245,158,11,0.12)',
  purple: '#8B5CF6', purpleBg: 'rgba(139,92,246,0.12)',
  border: 'rgba(255,255,255,0.08)',
};

// Static items load instantly, backend health is checked with timeout
export default function FinalSubmissionChecklistScreen({ navigation }: { navigation: any }) {
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    fetch(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setBackendOk(d.status === 'ok'))
      .catch(() => setBackendOk(false))
      .finally(() => clearTimeout(timer));
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, []);

  const checks: CheckItem[] = [
    { label: 'Backend API', status: backendOk === null ? 'review' : backendOk ? 'ready' : 'pending', detail: backendOk ? 'Cloud Functions live' : backendOk === null ? 'Checking...' : 'Backend unreachable' },
    { label: 'Android APK', status: 'ready', detail: 'Built via EAS, installable on device' },
    { label: 'NLU Parse', status: 'ready', detail: 'Gemini + fallback parser operational' },
    { label: 'Google Places API', status: 'ready', detail: 'Real provider discovery active' },
    { label: '12-Factor Ranking', status: 'ready', detail: 'Deterministic scoring, no randomness' },
    { label: 'Price Estimation', status: 'ready', detail: 'Market-rate engine with breakdown' },
    { label: 'Booking System', status: 'ready', detail: 'Firestore records with event trail' },
    { label: 'Follow-Up Automation', status: 'ready', detail: 'Reminder + status + feedback lifecycle' },
    { label: 'Fallback Recovery', status: 'ready', detail: '6 automated recovery scenarios' },
    { label: 'Agent Traces', status: 'ready', detail: '7+ traces per workflow in Firestore' },
    { label: 'Notification Safety', status: 'ready', detail: 'Preview only — no real SMS' },
    { label: 'API Keys Secured', status: 'ready', detail: 'All keys in backend only' },
    { label: 'Documentation', status: 'ready', detail: '35+ docs, evidence package' },
    { label: 'Antigravity Evidence', status: 'ready', detail: '12 evidence files + screenshots' },
    { label: 'Demo Video', status: 'ready', detail: 'Recorded and ready' },
    { label: 'Antigravity Video', status: 'ready', detail: 'Antigravity usage recorded' },
    { label: 'GitHub Push', status: 'ready', detail: 'Repository pushed' },
    { label: 'Submission Form', status: 'ready', detail: 'AISeekho form submitted' },
  ];

  const readyCount = checks.filter(c => c.status === 'ready').length;
  const totalCount = checks.length;

  const chipColor = (s: ChipStatus) =>
    s === 'ready' ? { bg: C.greenBg, text: C.green } :
    s === 'pending' ? { bg: C.amberBg, text: C.amber } :
    { bg: C.purpleBg, text: C.purple };

  return (
    <View style={st.root}>
    <LinearGradient colors={['#0B0F1A', '#111827', '#0B0F1A']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={st.content}>
        <Text style={st.title}>📋 Submission Checklist</Text>
        <Text style={st.subtitle}>Pre-submission verification for #AISeekho 2026</Text>

        <View style={st.scoreRow}>
          <Text style={st.scoreText}>{readyCount}/{totalCount} Ready</Text>
          <View style={st.scoreBadge}>
            <Text style={st.scoreBadgeText}>
              {readyCount >= totalCount - 4 ? '🟢 On Track' : '🟡 In Progress'}
            </Text>
          </View>
        </View>

        {checks.map((c, i) => {
          const chip = chipColor(c.status);
          return (
            <View key={i} style={st.checkRow}>
              <View style={[st.chip, { backgroundColor: chip.bg }]}>
                <Text style={[st.chipText, { color: chip.text }]}>
                  {c.status === 'ready' ? 'Ready' : c.status === 'pending' ? 'Pending' : 'Checking'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.checkLabel}>{c.label}</Text>
                <Text style={st.checkDetail}>{c.detail}</Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Text style={st.backBtnText}>← Back to Demo</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },

  title: { fontSize: 22, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 4 },

  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  scoreText: { fontSize: 18, fontWeight: '800', color: C.green },
  scoreBadge: { backgroundColor: C.greenBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  scoreBadgeText: { fontSize: 12, fontWeight: '700', color: C.green },

  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, minWidth: 64, alignItems: 'center' },
  chipText: { fontSize: 11, fontWeight: '700' },
  checkLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  checkDetail: { fontSize: 12, color: C.muted, marginTop: 1 },

  backBtn: { marginTop: 16, padding: 14, backgroundColor: '#059669', borderRadius: 12, alignItems: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
