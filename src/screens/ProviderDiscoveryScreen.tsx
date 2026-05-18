// src/screens/ProviderDiscoveryScreen.tsx
// Shows real provider discovery results from Google Places + registered providers
// Displays honest data with missing field warnings

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { discoverProviders } from '../services/backend/apiClient';

interface ProviderDiscoveryScreenProps {
  navigation: any;
  route: any;
}

interface Candidate {
  candidateId: string;
  source: 'google_places' | 'registered_provider';
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  openNow: boolean | null;
  businessStatus: string;
  distanceEstimateKm: number | null;
  travelTimeEstimateMinutes: number | null;
  isRegistered: boolean;
  bookable: boolean;
  statusLabel: string;
  missingFields: string[];
  dataWarnings: string[];
  confidence: number;
}

interface DiscoveryResult {
  success: boolean;
  workflowId: string;
  geocoded: { lat: number; lng: number; formattedAddress: string };
  query: string;
  candidates: Candidate[];
  totalFound: number;
  sources: { googlePlaces: number; registered: number; bookable: number };
  traces: any[];
  warnings: string[];
  latencyMs: number;
}

export default function ProviderDiscoveryScreen({ navigation, route }: ProviderDiscoveryScreenProps) {
  const { workflowId, parsedRequest } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workflowId || !parsedRequest) {
      setError('Missing workflow data. Please start from a service request.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const response = await discoverProviders(
          workflowId,
          parsedRequest.serviceType,
          { area: parsedRequest.locationText, city: 'Islamabad' }
        );
        setResult(response as any);
      } catch (e: any) {
        setError(e.message || 'Failed to discover providers.');
      } finally {
        setLoading(false);
      }
    })();
  }, [workflowId, parsedRequest]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>🔍 Searching real providers…</Text>
        <Text style={styles.loadingSubtext}>Google Places API + Registered Database</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!result) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📍 Providers Found</Text>
        <View style={styles.statsRow}>
          <StatBadge value={result.totalFound} label="Total" color="#4285F4" />
          <StatBadge value={result.sources.googlePlaces} label="Google" color="#EA8600" />
          <StatBadge value={result.sources.registered} label="Registered" color="#34A853" />
          <StatBadge value={result.sources.bookable} label="Bookable" color="#34A853" />
        </View>
      </View>

      {/* Search Info */}
      <View style={styles.searchInfo}>
        <Text style={styles.searchLabel}>Search Query</Text>
        <Text style={styles.searchQuery}>"{result.query}"</Text>
        {result.geocoded.lat !== 0 && (
          <Text style={styles.searchCoords}>
            📍 {result.geocoded.formattedAddress} ({result.geocoded.lat.toFixed(4)}, {result.geocoded.lng.toFixed(4)})
          </Text>
        )}
        <Text style={styles.latencyText}>{result.latencyMs}ms total</Text>
      </View>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <View style={styles.warningBox}>
          {result.warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>⚠ {w}</Text>
          ))}
        </View>
      )}

      {/* Provider Cards */}
      {result.candidates.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No providers found for this service in this area.</Text>
          <Text style={styles.emptySubtext}>Try a broader location or different service type.</Text>
        </View>
      ) : (
        result.candidates.map((candidate, index) => (
          <ProviderCard key={candidate.candidateId} candidate={candidate} index={index} />
        ))
      )}

      {/* Trace button */}
      {result.traces.length > 0 && (
        <TouchableOpacity
          style={styles.traceButton}
          onPress={() => navigation.navigate('AgentTrace', {
            workflowId: result.workflowId,
            traces: result.traces,
          })}
        >
          <Text style={styles.traceButtonText}>
            🤖 View Discovery Traces ({result.traces.length} steps)
          </Text>
        </TouchableOpacity>
      )}

      {/* Rank Providers button */}
      {result.candidates.length > 0 && (
        <TouchableOpacity
          style={styles.rankButton}
          onPress={() => navigation.navigate('ProviderRanking', {
            workflowId: result.workflowId,
            parsedRequest,
            candidates: result.candidates,
          })}
        >
          <Text style={styles.rankButtonText}>🏆 Rank Providers with AI →</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProviderCard({ candidate, index }: { candidate: Candidate; index: number }) {
  const isRegistered = candidate.isRegistered;

  return (
    <View style={[styles.providerCard, isRegistered && styles.registeredCard]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardRank}>#{index + 1}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{candidate.name}</Text>
          <Text style={styles.cardAddress} numberOfLines={1}>{candidate.address}</Text>
        </View>
        <View style={[styles.statusBadge, isRegistered ? styles.registeredBadge : styles.discoveredBadge]}>
          <Text style={styles.statusText}>
            {isRegistered ? '✅ Bookable' : '🟡 Discovered'}
          </Text>
        </View>
      </View>

      {/* Source label */}
      <Text style={styles.sourceLabel}>
        {candidate.source === 'google_places' ? '🌐 Google Places' : '🔧 KaamWala Registry'}
      </Text>

      {/* Data grid */}
      <View style={styles.dataGrid}>
        <DataCell
          icon="⭐"
          label="Rating"
          value={candidate.rating !== null ? `${candidate.rating}` : 'Unknown'}
          unknown={candidate.rating === null}
        />
        <DataCell
          icon="💬"
          label="Reviews"
          value={candidate.reviewCount !== null ? `${candidate.reviewCount}` : 'Unknown'}
          unknown={candidate.reviewCount === null}
        />
        <DataCell
          icon="🟢"
          label="Open"
          value={candidate.openNow === null ? 'Unknown' : candidate.openNow ? 'Yes' : 'No'}
          unknown={candidate.openNow === null}
        />
        <DataCell
          icon="📏"
          label="Distance"
          value={candidate.distanceEstimateKm !== null ? `${candidate.distanceEstimateKm} km` : 'N/A'}
          unknown={candidate.distanceEstimateKm === null}
        />
        <DataCell
          icon="🕐"
          label="Travel"
          value={candidate.travelTimeEstimateMinutes !== null ? `${candidate.travelTimeEstimateMinutes} min` : 'N/A'}
          unknown={candidate.travelTimeEstimateMinutes === null}
        />
        <DataCell
          icon="🎯"
          label="Confidence"
          value={`${Math.round(candidate.confidence * 100)}%`}
          unknown={false}
        />
      </View>

      {/* Onboarding label for non-registered */}
      {!isRegistered && (
        <View style={styles.onboardingRow}>
          <Text style={styles.onboardingText}>
            Discovered provider — onboarding required
          </Text>
        </View>
      )}

      {/* Missing fields */}
      {candidate.missingFields.length > 0 && (
        <View style={styles.missingRow}>
          <Text style={styles.missingLabel}>Missing data:</Text>
          <Text style={styles.missingFields}>{candidate.missingFields.join(', ')}</Text>
        </View>
      )}

      {/* Data warnings */}
      {candidate.dataWarnings.length > 0 && (
        <View style={styles.missingRow}>
          {candidate.dataWarnings.map((w, i) => (
            <Text key={i} style={styles.dataWarning}>⚠ {w}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

function DataCell({ icon, label, value, unknown }: { icon: string; label: string; value: string; unknown: boolean }) {
  return (
    <View style={styles.dataCell}>
      <Text style={styles.dataCellIcon}>{icon}</Text>
      <Text style={styles.dataCellLabel}>{label}</Text>
      <Text style={[styles.dataCellValue, unknown && styles.unknownValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A' },
  loadingContainer: { flex: 1, backgroundColor: '#0B0F1A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginTop: 16 },
  loadingSubtext: { color: '#64748B', fontSize: 12, marginTop: 4 },
  errorText: { color: '#EA4335', fontSize: 14, padding: 20, textAlign: 'center' },
  retryButton: { marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
  retryText: { color: '#F1F5F9', fontWeight: '600' },

  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statBadge: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },

  searchInfo: { marginHorizontal: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  searchQuery: { fontSize: 14, color: '#E2E8F0', marginTop: 4 },
  searchCoords: { fontSize: 11, color: '#64748B', marginTop: 4 },
  latencyText: { fontSize: 10, color: '#64748B', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  warningBox: { marginHorizontal: 16, marginTop: 10, padding: 10, backgroundColor: '#2A2A1A', borderRadius: 8, borderWidth: 1, borderColor: '#FBBC04' + '40' },
  warningText: { fontSize: 12, color: '#78716C', lineHeight: 18 },

  emptyCard: { margin: 16, padding: 32, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 12 },
  emptySubtext: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },

  providerCard: { marginHorizontal: 16, marginTop: 12, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  registeredCard: { borderColor: '#34A853' + '60', backgroundColor: '#1A2E1A' + '80' },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardRank: { fontSize: 16, fontWeight: '800', color: '#4285F4', width: 28 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  cardAddress: { fontSize: 11, color: '#64748B', marginTop: 2 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  registeredBadge: { backgroundColor: '#34A853' + '25' },
  discoveredBadge: { backgroundColor: '#FBBC04' + '25' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#F1F5F9' },

  sourceLabel: { fontSize: 10, color: '#64748B', marginTop: 8, marginBottom: 6 },

  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  dataCell: { width: '31%', backgroundColor: '#0B0F1A', borderRadius: 8, padding: 8, alignItems: 'center' },
  dataCellIcon: { fontSize: 14 },
  dataCellLabel: { fontSize: 9, color: '#64748B', marginTop: 2 },
  dataCellValue: { fontSize: 12, fontWeight: '700', color: '#F1F5F9', marginTop: 2 },
  unknownValue: { color: '#64748B', fontStyle: 'italic' },

  onboardingRow: { marginTop: 8, padding: 6, backgroundColor: '#2A2A1A', borderRadius: 6 },
  onboardingText: { fontSize: 11, color: '#FBBC04', fontWeight: '600', textAlign: 'center' },

  missingRow: { marginTop: 6 },
  missingLabel: { fontSize: 10, color: '#64748B' },
  missingFields: { fontSize: 10, color: '#64748B', fontStyle: 'italic' },
  dataWarning: { fontSize: 10, color: '#78716C' },

  traceButton: { margin: 16, marginBottom: 0, padding: 14, backgroundColor: '#4285F4', borderRadius: 10, alignItems: 'center' },
  traceButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  rankButton: { margin: 16, padding: 14, backgroundColor: '#8B5CF6', borderRadius: 10, alignItems: 'center' },
  rankButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
