// src/screens/BookingScreen.tsx
// Safe booking record — Stitch design
// Preserves ALL booking logic, notifications, bilingual

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  colors, spacing, radius, shadows, typography,
  StatusBadge, SectionCard, ActionButton, WarningBox,
  LoadingState, ProgressStepper,
} from '../components/ui';

interface NotificationPreviewData {
  notificationId: string;
  recipientType: string;
  channel: string;
  messageType: string;
  messageEnglish: string;
  messageRomanUrdu: string;
  status: string;
  simulation: boolean;
  labels: string[];
}

interface BookingData {
  bookingId: string;
  status: string;
  statusLabel: string;
  bookingNote: string;
  isRealBooking: boolean;
  providerName: string;
  providerSource: string;
  serviceType: string;
  locationArea: string;
  requestedSlot: string;
  estimateLow: number;
  estimateHigh: number;
  recommendedEstimate: number;
  currency: string;
  customerMessagePreview: string;
  providerMessagePreview: string;
  notifications?: NotificationPreviewData[];
  firestoreSaved: boolean;
  warnings: string[];
}

interface BookingResponse {
  success: boolean;
  workflowId: string;
  booking: BookingData;
  traces: any[];
  latencyMs: number;
}

export default function BookingScreen({ navigation, route }: { navigation: any; route: any }) {
  const { workflowId, parsedRequest, selectedProvider, priceEstimate } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<BookingResponse | null>(null);
  const [error, setError] = useState('');
  const [showUrdu, setShowUrdu] = useState(false);

  useEffect(() => {
    if (!workflowId || !selectedProvider || !parsedRequest) {
      setError('Missing data.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CREATE_BOOKING}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId, selectedProvider, parsedRequest, priceEstimate }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setError(e.message || 'Booking failed.');
      } finally {
        setLoading(false);
      }
    })();
  }, [workflowId, selectedProvider, parsedRequest, priceEstimate]);

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <LoadingState message="Creating booking record..." submessage="Saving to Firestore" />
      </SafeAreaView>
    );
  }

  if (error || !result?.success) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.errorContainer}>
          <WarningBox variant="error" title="Booking Error" message={error || 'Booking failed'} />
          <ActionButton label="← Go Back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const b = result.booking;
  const customerNotif = b.notifications?.find(n => n.recipientType === 'customer');
  const providerNotif = b.notifications?.find(n => n.recipientType === 'provider');

  return (
    <SafeAreaView style={st.safe} edges={['bottom']}>
      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

        {/* Stepper */}
        <ProgressStepper
          steps={[
            { key: 'find', label: 'Find' },
            { key: 'chat', label: 'Chat' },
            { key: 'book', label: 'Book' },
            { key: 'done', label: 'Done' },
          ]}
          currentStep={2}
        />

        {/* Header */}
        <Text style={st.title}>Safe Booking Record</Text>
        <Text style={st.subtitle}>Confirmed internal booking record.</Text>

        {/* Status badges */}
        <View style={st.badgeRow}>
          <StatusBadge label={b.firestoreSaved ? 'Firestore Saved' : 'Not Saved'} variant={b.firestoreSaved ? 'success' : 'warning'} />
          <StatusBadge label="No Real SMS Sent" variant="info" />
        </View>

        {/* Booking ID Card */}
        <View style={st.bookingCard}>
          <View style={st.bookingHeader}>
            <View>
              <Text style={st.idLabel}>BOOKING ID</Text>
              <Text style={st.idValue}>#{b.bookingId}</Text>
            </View>
            <StatusBadge
              label={b.statusLabel || 'Confirmed'}
              variant={b.status === 'onboarding_required' ? 'warning' : 'success'}
            />
          </View>

          {/* Provider */}
          <View style={st.providerRow}>
            <View style={st.providerAvatar}>
              <Text style={st.providerAvatarText}>{b.providerName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={st.providerName}>{b.providerName}</Text>
              <Text style={st.providerMeta}>
                {b.isRealBooking ? 'Registered' : 'Discovery'} • {b.providerSource}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={st.detailGrid}>
            <View style={st.detailCol}>
              <Text style={st.detailLabel}>Requested Slot</Text>
              <Text style={st.detailValue}>{b.requestedSlot || 'Flexible'}</Text>
            </View>
            <View style={st.detailCol}>
              <Text style={st.detailLabel}>Estimated Price</Text>
              <Text style={st.detailValue}>
                {b.currency} {b.estimateLow.toLocaleString()} – {b.estimateHigh.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Dashed separator */}
          <View style={st.dashedLine} />

          {/* Simulated Dispatches */}
          <Text style={st.dispatchLabel}>SIMULATED DISPATCHES</Text>

          {/* Provider draft */}
          {(b.providerMessagePreview || providerNotif) && (
            <View style={[st.messageBox, st.messageProvider]}>
              <View style={st.messageAccent} />
              <View style={st.messageContent}>
                <Text style={st.messageTitle}>🔧 To Provider (Agent Draft)</Text>
                <Text style={st.messageText}>
                  "{showUrdu && providerNotif?.messageRomanUrdu ? providerNotif.messageRomanUrdu : b.providerMessagePreview}"
                </Text>
              </View>
            </View>
          )}

          {/* Customer draft */}
          {(b.customerMessagePreview || customerNotif) && (
            <View style={[st.messageBox, st.messageCustomer]}>
              <View style={[st.messageAccent, { backgroundColor: colors.secondary }]} />
              <View style={st.messageContent}>
                <Text style={st.messageTitle}>👤 To You (Customer)</Text>
                <Text style={st.messageText}>
                  "{showUrdu && customerNotif?.messageRomanUrdu ? customerNotif.messageRomanUrdu : b.customerMessagePreview}"
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Language toggle */}
        <TouchableOpacity style={st.langToggle} onPress={() => setShowUrdu(!showUrdu)}>
          <Text style={st.langToggleText}>🌐 {showUrdu ? 'Show English' : 'Show Roman Urdu'}</Text>
        </TouchableOpacity>

        {/* Booking Note */}
        <WarningBox variant="info" title="Booking Note" message={b.bookingNote} />

        {/* Warnings */}
        {b.warnings.length > 0 && (
          <WarningBox variant="warning" message={b.warnings.join('\n')} />
        )}

        {/* Trace button */}
        {result.traces.length > 0 && (
          <ActionButton
            label={`View Booking Traces (${result.traces.length})`}
            icon="🤖"
            variant="ai"
            onPress={() => navigation.navigate('AgentTrace', { workflowId: result.workflowId, traces: result.traces })}
          />
        )}

        <View style={{ height: spacing.md }} />

        {/* Main CTA */}
        <ActionButton
          label="Return to Dashboard"
          variant="primary"
          onPress={() => navigation.navigate('Home')}
        />

        {/* Meta */}
        <View style={st.metaRow}>
          <Text style={st.metaText}>Workflow: {result.workflowId}</Text>
          <Text style={st.metaText}>{result.latencyMs}ms</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', padding: spacing.xl },

  title: { ...typography.headlineLg, marginTop: spacing.lg, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySm, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm, marginBottom: spacing.xl },

  // Booking card
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  idLabel: { ...typography.labelSm, marginBottom: 4 },
  idValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },

  providerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  providerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  providerAvatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  providerName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  providerMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  detailGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.md, marginBottom: spacing.lg },
  detailCol: { flex: 1, minWidth: 120 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  dashedLine: { height: 1, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', marginBottom: spacing.lg },

  dispatchLabel: { ...typography.labelSm, marginBottom: spacing.md },

  // Message boxes
  messageBox: { flexDirection: 'row', borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, backgroundColor: colors.surfaceContainer },
  messageProvider: {},
  messageCustomer: {},
  messageAccent: { width: 4, backgroundColor: colors.tertiaryDark },
  messageContent: { flex: 1, padding: spacing.md },
  messageTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  messageText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22, fontFamily: 'monospace' },

  langToggle: { padding: spacing.md, backgroundColor: colors.surfaceContainer, borderRadius: radius.lg, alignItems: 'center', marginBottom: spacing.lg },
  langToggleText: { fontSize: 14, fontWeight: '600', color: colors.tertiary },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  metaText: { fontSize: 12, color: colors.textMuted, fontFamily: 'monospace' },
});
