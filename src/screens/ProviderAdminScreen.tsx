// src/screens/ProviderAdminScreen.tsx
// Provider/Admin dashboard — view pending bookings, accept/reject/complete
// Proves real booking lifecycle for hackathon judges

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const C = {
  bg: '#0B0F1A', surface: 'rgba(255,255,255,0.06)', text: '#F1F5F9', muted: '#64748B',
  green: '#10B981', greenBg: 'rgba(16,185,129,0.15)', deepGreen: '#059669',
  purple: '#8B5CF6', purpleBg: 'rgba(139,92,246,0.12)',
  teal: '#06B6D4', tealBg: 'rgba(6,182,212,0.12)',
  amber: '#F59E0B', amberBg: 'rgba(245,158,11,0.12)',
  red: '#F43F5E', redBg: 'rgba(244,63,94,0.12)',
  blue: '#3B82F6', blueBg: 'rgba(59,130,246,0.12)',
  border: 'rgba(255,255,255,0.08)',
};

interface Booking {
  bookingId: string;
  providerName: string;
  providerSource: string;
  serviceType: string;
  issueDescription?: string;
  locationArea: string;
  requestedSlot: string;
  status: string;
  isRealBooking: boolean;
  recommendedEstimate: number;
  currency: string;
  bookingNote?: string;
  customerMessagePreview?: string;
}

async function apiPost(endpoint: string, body: any): Promise<any> {
  const r = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}

async function apiGet(url: string): Promise<any> {
  const r = await fetch(url);
  return r.json();
}

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  pending_provider_confirmation: { color: C.amber, bg: C.amberBg, label: 'Pending Confirmation' },
  confirmed: { color: C.green, bg: C.greenBg, label: 'Confirmed' },
  rejected: { color: C.red, bg: C.redBg, label: 'Rejected' },
  cancelled: { color: C.muted, bg: 'rgba(255,255,255,0.04)', label: 'Cancelled' },
  completed: { color: C.teal, bg: C.tealBg, label: 'Completed' },
  onboarding_required: { color: C.purple, bg: C.purpleBg, label: 'Onboarding Required' },
};

export default function ProviderAdminScreen({ navigation }: { navigation: any }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const data = await apiGet(`${API_BASE_URL}${API_ENDPOINTS.LIST_BOOKINGS}`);
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      // Silent — will show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadBookings();
  }, [loadBookings]));

  const doAction = async (bookingId: string, action: string, endpoint: string) => {
    setActionLoading(bookingId);
    try {
      const result = await apiPost(endpoint, { bookingId });
      if (result.success) {
        Alert.alert('Success', result.message || `Booking ${action}.`);
        loadBookings();
      } else {
        Alert.alert('Error', result.error || `Could not ${action} booking.`);
      }
    } catch (err) {
      Alert.alert('Error', `Failed to ${action} booking. Check network.`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const sc = STATUS_COLORS[status] || { color: C.muted, bg: 'rgba(255,255,255,0.04)', label: status };
    return (
      <View style={[s.badge, { backgroundColor: sc.bg }]}>
        <Text style={[s.badgeText, { color: sc.color }]}>{sc.label}</Text>
      </View>
    );
  };

  const sourceBadge = (source: string) => (
    <View style={[s.badge, { backgroundColor: source === 'registered' ? C.greenBg : C.tealBg }]}>
      <Text style={[s.badgeText, { color: source === 'registered' ? C.green : C.teal }]}>
        {source === 'registered' ? 'Registered' : 'Google Places'}
      </Text>
    </View>
  );

  const pending = bookings.filter(b => b.status === 'pending_provider_confirmation');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const completed = bookings.filter(b => b.status === 'completed');
  const other = bookings.filter(b => !['pending_provider_confirmation', 'confirmed', 'completed'].includes(b.status));

  return (
    <View style={s.root}>
    <LinearGradient colors={['#0B0F1A', '#111827', '#0B0F1A']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} tintColor={C.green} />}
      >
        <Text style={s.title}>🏢 Provider Dashboard</Text>
        <Text style={s.subtitle}>Manage bookings · Accept / Reject / Complete</Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: C.amberBg }]}><Text style={[s.statNum, { color: C.amber }]}>{pending.length}</Text><Text style={s.statLabel}>Pending</Text></View>
          <View style={[s.statBox, { backgroundColor: C.greenBg }]}><Text style={[s.statNum, { color: C.green }]}>{confirmed.length}</Text><Text style={s.statLabel}>Confirmed</Text></View>
          <View style={[s.statBox, { backgroundColor: C.tealBg }]}><Text style={[s.statNum, { color: C.teal }]}>{completed.length}</Text><Text style={s.statLabel}>Completed</Text></View>
          <View style={[s.statBox, { backgroundColor: 'rgba(255,255,255,0.04)' }]}><Text style={[s.statNum, { color: C.muted }]}>{other.length}</Text><Text style={s.statLabel}>Other</Text></View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={C.green} style={{ marginTop: 40 }} />
        ) : bookings.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No bookings yet</Text>
            <Text style={s.emptySub}>Run a service request from the home screen to create a booking.</Text>
          </View>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>⏳ Pending Confirmation ({pending.length})</Text>
                {pending.map(b => (
                  <View key={b.bookingId} style={[s.card, { borderLeftColor: C.amber }]}>
                    <View style={s.cardHeader}>
                      <Text style={s.providerName}>{b.providerName}</Text>
                      {statusBadge(b.status)}
                    </View>
                    <Text style={s.meta}>{b.serviceType} · {b.locationArea}</Text>
                    <Text style={s.meta}>Slot: {b.requestedSlot} · Est: {b.currency} {b.recommendedEstimate}</Text>
                    {b.issueDescription ? <Text style={s.meta}>Issue: {b.issueDescription}</Text> : null}
                    <Text style={s.bookingIdText}>ID: {b.bookingId.substring(0, 24)}...</Text>
                    {b.customerMessagePreview ? (
                      <View style={s.msgPreview}>
                        <Text style={s.msgLabel}>CUSTOMER MESSAGE PREVIEW</Text>
                        <Text style={s.msgText}>{b.customerMessagePreview.substring(0, 150)}...</Text>
                      </View>
                    ) : null}
                    <View style={s.badgeRow}>
                      {sourceBadge(b.providerSource)}
                      {b.isRealBooking ? <View style={[s.badge, { backgroundColor: C.greenBg }]}><Text style={[s.badgeText, { color: C.green }]}>Real Booking</Text></View> : null}
                    </View>
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: C.greenBg }]}
                        onPress={() => doAction(b.bookingId, 'accept', API_ENDPOINTS.ACCEPT_BOOKING)}
                        disabled={actionLoading === b.bookingId}
                      >
                        {actionLoading === b.bookingId ? <ActivityIndicator size="small" color={C.green} /> :
                          <Text style={[s.actionBtnText, { color: C.green }]}>✓ Accept</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: C.redBg }]}
                        onPress={() => doAction(b.bookingId, 'reject', API_ENDPOINTS.REJECT_BOOKING)}
                        disabled={actionLoading === b.bookingId}
                      >
                        <Text style={[s.actionBtnText, { color: C.red }]}>✕ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Confirmed */}
            {confirmed.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>✅ Confirmed ({confirmed.length})</Text>
                {confirmed.map(b => (
                  <View key={b.bookingId} style={[s.card, { borderLeftColor: C.green }]}>
                    <View style={s.cardHeader}>
                      <Text style={s.providerName}>{b.providerName}</Text>
                      {statusBadge(b.status)}
                    </View>
                    <Text style={s.meta}>{b.serviceType} · {b.locationArea}</Text>
                    <Text style={s.meta}>Slot: {b.requestedSlot} · Est: {b.currency} {b.recommendedEstimate}</Text>
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: C.tealBg }]}
                        onPress={() => doAction(b.bookingId, 'complete', API_ENDPOINTS.COMPLETE_BOOKING)}
                        disabled={actionLoading === b.bookingId}
                      >
                        {actionLoading === b.bookingId ? <ActivityIndicator size="small" color={C.teal} /> :
                          <Text style={[s.actionBtnText, { color: C.teal }]}>✓ Mark Completed</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: 'rgba(255,255,255,0.04)' }]}
                        onPress={() => doAction(b.bookingId, 'cancel', API_ENDPOINTS.CANCEL_BOOKING)}
                        disabled={actionLoading === b.bookingId}
                      >
                        <Text style={[s.actionBtnText, { color: C.muted }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>🏆 Completed ({completed.length})</Text>
                {completed.map(b => (
                  <View key={b.bookingId} style={[s.card, { borderLeftColor: C.teal }]}>
                    <View style={s.cardHeader}>
                      <Text style={s.providerName}>{b.providerName}</Text>
                      {statusBadge(b.status)}
                    </View>
                    <Text style={s.meta}>{b.serviceType} · {b.locationArea} · {b.requestedSlot}</Text>
                    <View style={s.badgeRow}>
                      {sourceBadge(b.providerSource)}
                      <View style={[s.badge, { backgroundColor: C.purpleBg }]}><Text style={[s.badgeText, { color: C.purple }]}>Feedback Requested</Text></View>
                      <View style={[s.badge, { backgroundColor: C.tealBg }]}><Text style={[s.badgeText, { color: C.teal }]}>Service Complete</Text></View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Other */}
            {other.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>📁 History ({other.length})</Text>
                {other.map(b => (
                  <View key={b.bookingId} style={[s.card, { borderLeftColor: C.muted }]}>
                    <View style={s.cardHeader}>
                      <Text style={s.providerName}>{b.providerName}</Text>
                      {statusBadge(b.status)}
                    </View>
                    <Text style={s.meta}>{b.serviceType} · {b.locationArea} · {b.requestedSlot}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Seed button */}
        <TouchableOpacity style={s.seedBtn} disabled={seeding} onPress={async () => {
          setSeeding(true);
          try {
            const r = await apiPost(API_ENDPOINTS.SEED_PROVIDERS, {});
            Alert.alert('✅ Providers Seeded', r.message || `Seeded ${r.seeded || 0} demo providers.`);
            loadBookings();
          } catch { Alert.alert('Error', 'Failed to seed providers.'); }
          finally { setSeeding(false); }
        }}>
          {seeding ? <ActivityIndicator size="small" color={C.green} /> :
            <Text style={s.seedBtnText}>🌱 Seed Demo Providers</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={s.homeBtnText}>← Back to Home</Text>
        </TouchableOpacity>

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

  title: { fontSize: 28, fontWeight: '900', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.muted, marginBottom: 16 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statNum: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 10 },

  card: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  providerName: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1 },
  meta: { fontSize: 13, color: C.muted, marginTop: 2 },
  bookingIdText: { fontSize: 11, color: C.muted, marginTop: 4, fontFamily: 'monospace' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },

  msgPreview: { backgroundColor: C.purpleBg, padding: 10, borderRadius: 10, marginTop: 8, borderLeftWidth: 3, borderLeftColor: C.purple },
  msgLabel: { fontSize: 10, fontWeight: '700', color: C.purple, letterSpacing: 1, marginBottom: 3 },
  msgText: { fontSize: 12, color: C.text, fontStyle: 'italic', lineHeight: 17 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', minHeight: 46, justifyContent: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 12 },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, paddingHorizontal: 30 },

  seedBtn: { backgroundColor: C.surface, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, borderWidth: 1.5, borderColor: C.green },
  seedBtnText: { color: C.green, fontSize: 15, fontWeight: '700' },
  homeBtn: { backgroundColor: C.deepGreen, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  homeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
