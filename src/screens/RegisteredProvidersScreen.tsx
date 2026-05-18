// src/screens/RegisteredProvidersScreen.tsx
// Admin/demo screen — seed providers, view registered profiles

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { API_BASE_URL } from '../config/api';

interface Provider {
  providerId: string;
  businessName: string;
  serviceCategories: string[];
  serviceAreas: string[];
  locationArea: string;
  verified: boolean;
  active: boolean;
  source: string;
  baseVisitFee: number;
  availability: { days: string[]; timeSlots: string[] };
  internalRating: number;
  completedJobs: number;
  cancellationCount: number;
}

export default function RegisteredProvidersScreen() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');
  const [seedResult, setSeedResult] = useState('');

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/providers`);
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers);
      } else {
        setError(data.error?.message || 'Failed to load providers');
      }
    } catch (e: any) {
      setError(e.message || 'Cannot connect to backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult('');
    try {
      const res = await fetch(`${API_BASE_URL}/seedDemoProviders`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedResult(`✅ Seeded ${data.providerIds.length} providers: ${data.providerIds.join(', ')}`);
        fetchProviders(); // Refresh list
      } else {
        setSeedResult(`❌ ${data.error?.message || 'Seed failed'}`);
      }
    } catch (e: any) {
      setSeedResult(`❌ ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Registered Providers</Text>
        <Text style={styles.subtitle}>
          Only registered providers can accept real bookings
        </Text>
      </View>

      {/* Seed Button */}
      <TouchableOpacity
        style={[styles.seedButton, seeding && styles.seedButtonDisabled]}
        onPress={handleSeed}
        disabled={seeding}
      >
        {seeding ? (
          <ActivityIndicator color="#F9FAFB" size="small" />
        ) : (
          <Text style={styles.seedButtonText}>🌱 Seed Controlled Demo Providers</Text>
        )}
      </TouchableOpacity>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          ℹ️ Demo providers are controlled test profiles for hackathon judging.
          They are NOT random Google businesses. They demonstrate the real booking
          system safely.
        </Text>
      </View>

      {seedResult ? (
        <Text style={styles.seedResult}>{seedResult}</Text>
      ) : null}

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchProviders}>
        <Text style={styles.refreshText}>🔄 Refresh Provider List</Text>
      </TouchableOpacity>

      {/* Loading/Error */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4285F4" />
        </View>
      )}

      {error ? (
        <Text style={styles.errorText}>❌ {error}</Text>
      ) : null}

      {/* Provider Count */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {providers.length} registered provider{providers.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Provider Cards */}
      {providers.map((provider) => (
        <ProviderProfileCard key={provider.providerId} provider={provider} />
      ))}

      {!loading && providers.length === 0 && !error && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No registered providers yet.</Text>
          <Text style={styles.emptySubtext}>
            Tap "Seed Controlled Demo Providers" to create 3 test profiles.
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ProviderProfileCard({ provider }: { provider: Provider }) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{provider.businessName}</Text>
          <Text style={styles.cardId}>{provider.providerId}</Text>
        </View>
        <View style={styles.statusBadges}>
          {provider.source === 'demo-controlled' && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>🎯 Demo</Text>
            </View>
          )}
          <View style={[styles.activeBadge, provider.active ? styles.activeTrue : styles.activeFalse]}>
            <Text style={styles.activeBadgeText}>
              {provider.active ? '✅ Active' : '⛔ Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.tagRow}>
        {provider.serviceCategories.slice(0, 3).map((cat) => (
          <View key={cat} style={styles.tag}>
            <Text style={styles.tagText}>{cat}</Text>
          </View>
        ))}
      </View>

      {/* Areas */}
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📍</Text>
        <Text style={styles.infoText}>{provider.locationArea}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>🗺️</Text>
        <Text style={styles.infoText}>Areas: {provider.serviceAreas.join(', ')}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCell icon="⭐" label="Rating" value={`${provider.internalRating}`} />
        <StatCell icon="✅" label="Jobs" value={`${provider.completedJobs}`} />
        <StatCell icon="❌" label="Cancelled" value={`${provider.cancellationCount}`} />
        <StatCell icon="💰" label="Visit Fee" value={`PKR ${provider.baseVisitFee}`} />
      </View>

      {/* Availability */}
      <View style={styles.availSection}>
        <Text style={styles.availLabel}>📅 Available</Text>
        <Text style={styles.availText}>
          {provider.availability.days.join(', ')}
        </Text>
        <Text style={styles.availText}>
          🕐 {provider.availability.timeSlots.join(', ')}
        </Text>
      </View>

      {/* Verified */}
      <View style={styles.verifiedRow}>
        <Text style={styles.verifiedText}>
          {provider.verified ? '✅ Verified' : '⏳ Pending Verification'} • Source: {provider.source}
        </Text>
      </View>
    </View>
  );
}

function StatCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A' },
  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },

  seedButton: { marginHorizontal: 16, padding: 16, backgroundColor: '#FBBC04', borderRadius: 12, alignItems: 'center' },
  seedButtonDisabled: { opacity: 0.6 },
  seedButtonText: { fontSize: 15, fontWeight: '700', color: '#F9FAFB' },

  noteBox: { margin: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, borderWidth: 1, borderColor: '#4285F4' + '40' },
  noteText: { fontSize: 11, color: '#64748B', lineHeight: 18 },

  seedResult: { marginHorizontal: 16, marginBottom: 8, fontSize: 12, color: '#34A853', fontWeight: '600' },

  refreshButton: { marginHorizontal: 16, marginBottom: 12, padding: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, alignItems: 'center' },
  refreshText: { fontSize: 13, color: '#F1F5F9', fontWeight: '600' },

  center: { padding: 40, alignItems: 'center' },
  errorText: { color: '#EA4335', fontSize: 13, padding: 16 },

  countRow: { paddingHorizontal: 16, paddingBottom: 8 },
  countText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  emptyCard: { margin: 16, padding: 32, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12 },
  emptySubtext: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },

  card: { marginHorizontal: 16, marginBottom: 12, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: '#34A853' + '40' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  cardId: { fontSize: 10, color: '#64748B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2 },

  statusBadges: { flexDirection: 'row', gap: 6 },
  demoBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FBBC04' + '25', borderRadius: 6 },
  demoBadgeText: { fontSize: 10, fontWeight: '700', color: '#FBBC04' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeTrue: { backgroundColor: '#34A853' + '25' },
  activeFalse: { backgroundColor: '#EA4335' + '25' },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#F1F5F9' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#4285F4' + '20', borderRadius: 6 },
  tagText: { fontSize: 10, color: '#4285F4', fontWeight: '600' },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  infoIcon: { fontSize: 12, width: 22 },
  infoText: { fontSize: 12, color: '#E2E8F0', flex: 1 },

  statsGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statCell: { flex: 1, backgroundColor: '#0B0F1A', borderRadius: 8, padding: 8, alignItems: 'center' },
  statIcon: { fontSize: 14 },
  statLabel: { fontSize: 9, color: '#64748B', marginTop: 2 },
  statValue: { fontSize: 12, fontWeight: '700', color: '#F1F5F9', marginTop: 2 },

  availSection: { marginTop: 10, padding: 8, backgroundColor: '#0B0F1A', borderRadius: 8 },
  availLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', marginBottom: 4 },
  availText: { fontSize: 11, color: '#E2E8F0', lineHeight: 18 },

  verifiedRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  verifiedText: { fontSize: 10, color: '#64748B' },
});
