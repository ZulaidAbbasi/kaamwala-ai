// src/screens/ProviderOnboardingScreen.tsx
// Shows provider onboarding flow explanation + registered providers list

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../config/api';

export default function ProviderOnboardingScreen({ navigation }: { navigation: any }) {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/providers/list`);
        const data = await res.json();
        setProviders(data.providers || []);
      } catch { /* continue */ }
      setLoading(false);
    })();
  }, []);

  const STEPS = [
    { num: 1, title: 'Discovery', desc: 'Provider found via Google Places API or referral.', icon: '🔍' },
    { num: 2, title: 'Registration', desc: 'Provider fills profile: service categories, areas, availability.', icon: '📝' },
    { num: 3, title: 'Verification', desc: 'Platform verifies identity and service capability.', icon: '✅' },
    { num: 4, title: 'Activation', desc: 'Provider becomes booking-eligible. Listed in matching.', icon: '🟢' },
    { num: 5, title: 'Reputation', desc: 'After jobs: ratings, reviews, completion metrics tracked.', icon: '⭐' },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>🔧 Provider Onboarding</Text>
        <Text style={s.subtitle}>How service providers join the KaamWala AI platform</Text>
      </View>

      {/* Onboarding steps */}
      <Text style={s.sectionTitle}>Onboarding Flow</Text>
      {STEPS.map(step => (
        <View key={step.num} style={s.stepCard}>
          <View style={s.stepNum}><Text style={s.stepNumText}>{step.num}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.stepTitle}>{step.icon} {step.title}</Text>
            <Text style={s.stepDesc}>{step.desc}</Text>
          </View>
        </View>
      ))}

      {/* Current registered */}
      <Text style={s.sectionTitle}>Current Registered Providers</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#8B5CF6" style={{ margin: 20 }} />
      ) : providers.length > 0 ? (
        providers.map((p, i) => (
          <View key={i} style={s.providerCard}>
            <Text style={s.providerName}>{p.businessName}</Text>
            <Text style={s.providerDetail}>
              {p.serviceCategories?.join(', ') || 'N/A'} • {p.locationArea}
            </Text>
            <View style={s.badgeRow}>
              {p.verified && <View style={[s.badge, s.verBadge]}><Text style={s.badgeText}>✅ Verified</Text></View>}
              {p.active && <View style={[s.badge, s.actBadge]}><Text style={s.badgeText}>🟢 Active</Text></View>}
              <View style={[s.badge, s.demoBadge]}><Text style={s.badgeText}>🧪 Demo</Text></View>
            </View>
          </View>
        ))
      ) : (
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>No registered providers yet. Seed demo data from System Status.</Text>
        </View>
      )}

      {/* Key note */}
      <View style={s.noteCard}>
        <Text style={s.noteTitle}>⚠️ Important</Text>
        <Text style={s.noteText}>Only registered and verified providers can receive confirmed bookings. Google Places providers are discovery-only until they complete onboarding.</Text>
      </View>

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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', margin: 16, marginBottom: 8 },

  stepCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4285F4', justifyContent: 'center', alignItems: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  stepTitle: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
  stepDesc: { fontSize: 10, color: '#64748B', marginTop: 2 },

  providerCard: { marginHorizontal: 16, marginBottom: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: '#34A853' + '40' },
  providerName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  providerDetail: { fontSize: 11, color: '#64748B', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  verBadge: { backgroundColor: '#34A853' + '25' },
  actBadge: { backgroundColor: '#4285F4' + '25' },
  demoBadge: { backgroundColor: '#FBBC04' + '25' },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#F1F5F9' },

  emptyCard: { margin: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyText: { fontSize: 12, color: '#64748B' },

  noteCard: { margin: 16, padding: 12, backgroundColor: '#2A2A1A', borderRadius: 10, borderWidth: 1, borderColor: '#FBBC04' + '40' },
  noteTitle: { fontSize: 12, fontWeight: '700', color: '#FBBC04', marginBottom: 4 },
  noteText: { fontSize: 11, color: '#78716C', lineHeight: 18 },

  backBtn: { margin: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, alignItems: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
});
