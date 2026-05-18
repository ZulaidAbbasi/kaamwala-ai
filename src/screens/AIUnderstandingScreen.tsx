// src/screens/AIUnderstandingScreen.tsx
// Shows the AI's understanding of the parsed request in detail

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';

export default function AIUnderstandingScreen({ navigation, route }: { navigation: any; route: any }) {
  const { parsedRequest, workflowId, source, traces } = route.params || {};
  const p = parsedRequest;

  if (!p) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>❌ No parsed request data provided.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fields = [
    { label: 'Service Type', value: p.serviceType, icon: '🔧' },
    { label: 'Issue', value: p.issueDescription, icon: '⚠️' },
    { label: 'Location', value: p.locationText, icon: '📍' },
    { label: 'Date', value: p.preferredDate || 'Not specified', icon: '📅' },
    { label: 'Time', value: p.preferredTimeWindow || 'Not specified', icon: '🕐' },
    { label: 'Urgency', value: p.urgency, icon: '🚨' },
    { label: 'Budget', value: p.budgetSensitivity, icon: '💰' },
    { label: 'Language', value: p.languageDetected, icon: '🌐' },
    { label: 'Quality', value: p.qualityPreference || 'Not specified', icon: '⭐' },
  ];

  const conf = (p.confidenceScore ?? 0) * 100;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>🧠 AI Understanding</Text>
        <Text style={s.subtitle}>What the AI extracted from your request</Text>
      </View>

      {/* Confidence */}
      <View style={s.confCard}>
        <View style={s.confBar}>
          <View style={[s.confFill, { width: `${conf}%` }]} />
        </View>
        <Text style={s.confText}>{conf.toFixed(0)}% Confidence</Text>
        <View style={[s.sourceBadge, source === 'gemini' ? s.gemini : s.fallback]}>
          <Text style={s.sourceText}>{source === 'gemini' ? '🤖 Gemini NLU' : '🔤 Keyword Fallback'}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Normalized Summary</Text>
        <Text style={s.summaryText}>{p.normalizedEnglishSummary}</Text>
      </View>

      {/* Extracted Fields */}
      <Text style={s.sectionTitle}>📋 Extracted Fields</Text>
      {fields.map((f, i) => (
        <View key={i} style={s.fieldRow}>
          <Text style={s.fieldIcon}>{f.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <Text style={s.fieldValue}>{f.value || '—'}</Text>
          </View>
        </View>
      ))}

      {/* Missing Fields */}
      {p.missingFields?.length > 0 && (
        <View style={s.missingCard}>
          <Text style={s.missingTitle}>❓ Missing Fields</Text>
          {p.missingFields.map((f: string, i: number) => (
            <Text key={i} style={s.missingItem}>• {f}</Text>
          ))}
        </View>
      )}

      {/* Clarification */}
      {p.clarificationQuestion && (
        <View style={s.clarCard}>
          <Text style={s.clarTitle}>💬 Clarification Needed</Text>
          <Text style={s.clarText}>{p.clarificationQuestion}</Text>
        </View>
      )}

      {/* Next Step */}
      <TouchableOpacity
        style={s.nextBtn}
        onPress={() => navigation.navigate('ProviderDiscovery', {
          workflowId,
          parsedRequest: p,
          traces,
        })}
      >
        <Text style={s.nextBtnText}>🔍 Discover Providers →</Text>
      </TouchableOpacity>

      {traces?.length > 0 && (
        <TouchableOpacity
          style={s.traceBtn}
          onPress={() => navigation.navigate('AgentTrace', { workflowId, traces })}
        >
          <Text style={s.traceBtnText}>🤖 View Traces ({traces.length})</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A' },
  center: { flex: 1, backgroundColor: '#0B0F1A', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EA4335', fontSize: 14, padding: 20 },
  backBtn: { padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
  backBtnText: { color: '#F1F5F9', fontWeight: '600' },
  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },

  confCard: { margin: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  confBar: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  confFill: { height: '100%', backgroundColor: '#34A853', borderRadius: 4 },
  confText: { fontSize: 16, fontWeight: '800', color: '#F1F5F9', marginTop: 8 },
  sourceBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  gemini: { backgroundColor: '#4285F4' + '25' },
  fallback: { backgroundColor: '#FBBC04' + '25' },
  sourceText: { fontSize: 10, fontWeight: '700', color: '#F1F5F9' },

  summaryCard: { marginHorizontal: 16, padding: 14, backgroundColor: '#1A2A1A', borderRadius: 12, borderWidth: 1, borderColor: '#34A853' + '40' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#34A853', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryText: { fontSize: 13, color: '#CCDDCC', lineHeight: 20, marginTop: 6 },

  fieldRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' + '60', gap: 12 },
  fieldIcon: { fontSize: 20 },
  fieldLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  fieldValue: { fontSize: 14, color: '#F1F5F9', fontWeight: '600', marginTop: 2 },

  missingCard: { margin: 16, padding: 12, backgroundColor: '#2A2A1A', borderRadius: 10, borderWidth: 1, borderColor: '#FBBC04' + '40' },
  missingTitle: { fontSize: 12, fontWeight: '700', color: '#FBBC04', marginBottom: 4 },
  missingItem: { fontSize: 11, color: '#78716C', lineHeight: 18 },

  clarCard: { margin: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: '#8B5CF6' + '40' },
  clarTitle: { fontSize: 12, fontWeight: '700', color: '#8B5CF6', marginBottom: 4 },
  clarText: { fontSize: 12, color: '#E2E8F0', lineHeight: 18 },

  nextBtn: { margin: 16, marginBottom: 0, padding: 14, backgroundColor: '#4285F4', borderRadius: 10, alignItems: 'center' },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  traceBtn: { margin: 16, marginBottom: 0, padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, alignItems: 'center' },
  traceBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
});
