// src/screens/FollowUpTimelineScreen.tsx
// Post-booking service lifecycle — timeline, checklist, feedback, reputation, matching impact

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
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

interface TimelineEvent {
  step: number;
  eventType: string;
  title: string;
  description: string;
  status: string;
  icon: string;
  durationLabel: string;
}

interface ChecklistItem {
  item: string;
  checked: boolean;
  note: string;
}

interface FollowUpResponse {
  success: boolean;
  workflowId: string;
  bookingId: string;
  timeline: TimelineEvent[];
  checklist: ChecklistItem[];
  feedback: { rating: number; ratingLabel: string; comment: string; wouldRecommend: boolean };
  reputationUpdate: {
    providerName: string;
    isRegistered: boolean;
    previousRating: number;
    newRating: number;
    previousCompletedJobs: number;
    newCompletedJobs: number;
    ratingUpdated: boolean;
    updateNote: string;
  };
  futureMatchingImpact: { factors: string[]; explanation: string };
  firestoreSaved: boolean;
  traces: any[];
  warnings: string[];
  latencyMs: number;
}

export default function FollowUpTimelineScreen({ navigation, route }: { navigation: any; route: any }) {
  const { workflowId, bookingId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<FollowUpResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workflowId || !bookingId) {
      setError('Missing workflowId or bookingId.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SIMULATE_FOLLOW_UP}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId, bookingId }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setError(e.message || 'Follow-up simulation failed.');
      } finally {
        setLoading(false);
      }
    })();
  }, [workflowId, bookingId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>⏳ Simulating service lifecycle...</Text>
        <Text style={styles.loadingSub}>10-step timeline generation</Text>
      </View>
    );
  }

  if (error || !result?.success) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error || 'Simulation failed'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { timeline, checklist, feedback, reputationUpdate: rep, futureMatchingImpact: impact } = result;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📋 Service Lifecycle</Text>
        <Text style={styles.subtitle}>
          {timeline.length} events • {result.latencyMs}ms
        </Text>
        {result.firestoreSaved && (
          <View style={styles.savedBadge}>
            <Text style={styles.savedText}>🔥 All Events Saved to Firestore</Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {timeline.map((evt, i) => {
          const isLast = i === timeline.length - 1;
          const isSkipped = evt.status === 'skipped';
          return (
            <View key={evt.step} style={styles.timelineRow}>
              {/* Left: line + dot */}
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, isSkipped ? styles.dotSkipped : styles.dotDone]} />
                {!isLast && <View style={styles.line} />}
              </View>
              {/* Right: content */}
              <View style={styles.timelineRight}>
                <View style={styles.evtHeader}>
                  <Text style={styles.evtTitle}>{evt.title}</Text>
                  <Text style={styles.evtTime}>{evt.durationLabel}</Text>
                </View>
                <Text style={[styles.evtDesc, isSkipped && styles.evtSkipped]}>{evt.description}</Text>
                <View style={[styles.statusBadge, isSkipped ? styles.statusSkipped : styles.statusDone]}>
                  <Text style={styles.statusText}>{isSkipped ? '⏭ Skipped' : '✅ Completed'}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Diagnosis Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Diagnosis Checklist</Text>
        {checklist.map((item, i) => (
          <View key={i} style={styles.checkRow}>
            <Text style={styles.checkIcon}>{item.checked ? '☑' : '☐'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkItem}>{item.item}</Text>
              <Text style={styles.checkNote}>{item.note}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Customer Feedback</Text>
        <View style={styles.feedbackCard}>
          <Text style={styles.ratingLarge}>{feedback.ratingLabel}</Text>
          <Text style={styles.ratingNum}>{feedback.rating} / 5</Text>
          <Text style={styles.feedbackComment}>"{feedback.comment}"</Text>
          <View style={[styles.recommendBadge, feedback.wouldRecommend ? styles.recYes : styles.recNo]}>
            <Text style={styles.recommendText}>
              {feedback.wouldRecommend ? '👍 Would Recommend' : '👎 Would Not Recommend'}
            </Text>
          </View>
        </View>
      </View>

      {/* Reputation Update */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Provider Reputation</Text>
        <View style={[styles.repCard, rep.ratingUpdated ? styles.repUpdated : styles.repSkipped]}>
          <Text style={styles.repProvider}>{rep.providerName}</Text>
          <View style={styles.repRow}>
            <View style={styles.repCol}>
              <Text style={styles.repLabel}>Rating</Text>
              <Text style={styles.repBefore}>{rep.previousRating}</Text>
              <Text style={styles.repArrow}>→</Text>
              <Text style={[styles.repAfter, { color: rep.ratingUpdated ? '#34A853' : '#6B7280' }]}>
                {rep.ratingUpdated ? rep.newRating : 'N/A'}
              </Text>
            </View>
            <View style={styles.repDivider} />
            <View style={styles.repCol}>
              <Text style={styles.repLabel}>Jobs</Text>
              <Text style={styles.repBefore}>{rep.previousCompletedJobs}</Text>
              <Text style={styles.repArrow}>→</Text>
              <Text style={[styles.repAfter, { color: rep.ratingUpdated ? '#34A853' : '#6B7280' }]}>
                {rep.ratingUpdated ? rep.newCompletedJobs : 'N/A'}
              </Text>
            </View>
          </View>
          <View style={[styles.repStatusBadge, rep.ratingUpdated ? styles.repStatusYes : styles.repStatusNo]}>
            <Text style={styles.repStatusText}>
              {rep.ratingUpdated ? '✅ Profile Updated' : '⏭ Not Updated (Unregistered)'}
            </Text>
          </View>
          <Text style={styles.repNote}>{rep.updateNote}</Text>
        </View>
      </View>

      {/* Future Matching Impact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Future Matching Impact</Text>
        <View style={styles.impactCard}>
          {impact.factors.map((f, i) => (
            <Text key={i} style={styles.impactItem}>• {f}</Text>
          ))}
          <View style={styles.impactDivider} />
          <Text style={styles.impactExplanation}>{impact.explanation}</Text>
        </View>
      </View>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <View style={styles.warningBox}>
          {result.warnings.map((w, i) => <Text key={i} style={styles.warningText}>⚠ {w}</Text>)}
        </View>
      )}

      {result.traces.length > 0 && (
        <TouchableOpacity
          style={styles.traceBtn}
          onPress={() => navigation.navigate('AgentTrace', { workflowId: result.workflowId, traces: result.traces })}
        >
          <Text style={styles.traceBtnText}>🤖 View Follow-Up Traces ({result.traces.length})</Text>
        </TouchableOpacity>
      )}

      {/* Fallback Recovery button */}
      <TouchableOpacity
        style={styles.fallbackBtn}
        onPress={() => navigation.navigate('FallbackRecovery', {
          workflowId: result.workflowId,
          bookingId: result.bookingId,
        })}
      >
        <Text style={styles.fallbackBtnText}>🛡️ Test Fallback & Recovery →</Text>
      </TouchableOpacity>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Booking: {result.bookingId}</Text>
        <Text style={styles.metaText}>{result.latencyMs}ms</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F1A' },
  center: { flex: 1, backgroundColor: '#0B0F1A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginTop: 16 },
  loadingSub: { color: '#64748B', fontSize: 12, marginTop: 4 },
  errorText: { color: '#EA4335', fontSize: 14, padding: 20, textAlign: 'center' },
  backBtn: { marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
  backBtnText: { color: '#F1F5F9', fontWeight: '600' },

  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  savedBadge: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#EA4335' + '25', borderRadius: 6 },
  savedText: { fontSize: 10, fontWeight: '700', color: '#EA4335' },

  // Timeline
  timelineContainer: { marginHorizontal: 16 },
  timelineRow: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { width: 28, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  dotDone: { backgroundColor: '#34A853' },
  dotSkipped: { backgroundcolor: '#64748B' },
  line: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 2 },
  timelineRight: { flex: 1, paddingLeft: 10, paddingBottom: 16 },
  evtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evtTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', flex: 1 },
  evtTime: { fontSize: 10, color: '#64748B' },
  evtDesc: { fontSize: 11, color: '#E2E8F0', lineHeight: 16, marginTop: 4 },
  evtSkipped: { color: '#64748B', fontStyle: 'italic' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  statusDone: { backgroundColor: '#34A853' + '20' },
  statusSkipped: { backgroundcolor: '#64748B' + '20' },
  statusText: { fontSize: 9, fontWeight: '700', color: '#F1F5F9' },

  // Sections
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 10 },

  // Checklist
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, gap: 8 },
  checkIcon: { fontSize: 16, color: '#34A853', marginTop: 1 },
  checkItem: { fontSize: 13, color: '#F1F5F9', fontWeight: '600' },
  checkNote: { fontSize: 10, color: '#64748B', marginTop: 2 },

  // Feedback
  feedbackCard: { padding: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: '#FBBC04' + '40', alignItems: 'center' },
  ratingLarge: { fontSize: 28, marginBottom: 4 },
  ratingNum: { fontSize: 14, fontWeight: '800', color: '#FBBC04' },
  feedbackComment: { fontSize: 12, color: '#E2E8F0', lineHeight: 18, marginTop: 10, textAlign: 'center', fontStyle: 'italic' },
  recommendBadge: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  recYes: { backgroundColor: '#34A853' + '25' },
  recNo: { backgroundColor: '#EA4335' + '25' },
  recommendText: { fontSize: 12, fontWeight: '700', color: '#F1F5F9' },

  // Reputation
  repCard: { padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 2 },
  repUpdated: { borderColor: '#34A853' },
  repSkipped: { bordercolor: '#64748B' },
  repProvider: { fontSize: 16, fontWeight: '800', color: '#F1F5F9', marginBottom: 12 },
  repRow: { flexDirection: 'row' },
  repCol: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  repDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  repLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  repBefore: { fontSize: 18, fontWeight: '700', color: '#64748B' },
  repArrow: { fontSize: 12, color: '#64748B', marginVertical: 2 },
  repAfter: { fontSize: 20, fontWeight: '800' },
  repStatusBadge: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 12 },
  repStatusYes: { backgroundColor: '#34A853' + '25' },
  repStatusNo: { backgroundcolor: '#64748B' + '25' },
  repStatusText: { fontSize: 10, fontWeight: '700', color: '#F1F5F9' },
  repNote: { fontSize: 11, color: '#64748B', marginTop: 10, textAlign: 'center', lineHeight: 16 },

  // Future impact
  impactCard: { padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: '#8B5CF6' + '40' },
  impactItem: { fontSize: 11, color: '#E2E8F0', lineHeight: 18 },
  impactDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 },
  impactExplanation: { fontSize: 12, color: '#A1A1CC', lineHeight: 18, fontStyle: 'italic' },

  warningBox: { margin: 16, padding: 10, backgroundColor: '#2A2A1A', borderRadius: 8, borderWidth: 1, borderColor: '#FBBC04' + '40' },
  warningText: { fontSize: 12, color: '#78716C', lineHeight: 18 },

  traceBtn: { margin: 16, marginBottom: 0, padding: 14, backgroundColor: '#4285F4', borderRadius: 10, alignItems: 'center' },
  traceBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  fallbackBtn: { margin: 16, marginBottom: 0, padding: 14, backgroundColor: '#EA4335', borderRadius: 10, alignItems: 'center' },
  fallbackBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 16 },
  metaText: { fontSize: 10, color: '#64748B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
