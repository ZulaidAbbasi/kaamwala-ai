// src/screens/ServiceRequestScreen.tsx
// User enters a service request → calls backend → shows parsed results

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DEMO_REQUEST } from '../config/constants';
import { parseRequest } from '../services/backend/apiClient';
import { ParseRequestResponse } from '../types';

interface ServiceRequestScreenProps {
  navigation: any;
  route: any;
}

export default function ServiceRequestScreen({ navigation, route }: ServiceRequestScreenProps) {
  const prefill = route?.params?.prefillText || '';
  const [text, setText] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ParseRequestResponse | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter a service request');
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await parseRequest(text.trim());

      if (!response.success) {
        setError(response.error?.message || 'Failed to parse request');
        setLoading(false);
        return;
      }

      setResult(response);
    } catch (e: any) {
      setError(e.message || 'Failed to connect to backend. Check your API setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>What do you need?</Text>
        <Text style={styles.subheading}>
          Type in Urdu, Roman Urdu, English, or mix them
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., AC bilkul kaam nahi kar raha..."
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {!text && (
          <TouchableOpacity
            style={styles.demoFill}
            onPress={() => setText(DEMO_REQUEST)}
          >
            <Text style={styles.demoFillText}>📋 Use demo request</Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.errorText}>❌ {error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitText}>  Understanding request…</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>🚀 Find Service Providers</Text>
          )}
        </TouchableOpacity>

        {/* ── Parsed Result Card ─────────────────────────────────── */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>🧠 AI Understanding</Text>
              <View style={[styles.sourceBadge, result.source === 'gemini' ? styles.geminiSource : styles.fallbackSource]}>
                <Text style={styles.sourceText}>
                  {result.source === 'gemini' ? '🟢 Gemini API' : '🟡 Fallback'}
                </Text>
              </View>
            </View>

            <ResultField label="Service Type" value={result.parsedRequest.serviceType} icon="🔧" />
            <ResultField label="Issue" value={result.parsedRequest.issueDescription} icon="📋" />
            <ResultField label="Location" value={result.parsedRequest.locationText || 'Not specified'} icon="📍" />
            <ResultField label="Date" value={result.parsedRequest.preferredDate || 'Flexible'} icon="📅" />
            <ResultField label="Time" value={result.parsedRequest.preferredTimeWindow || 'Any'} icon="🕐" />
            <ResultField label="Urgency" value={result.parsedRequest.urgency} icon="⚡" highlight={result.parsedRequest.urgency === 'emergency'} />
            <ResultField label="Budget" value={result.parsedRequest.budgetSensitivity} icon="💰" />
            <ResultField label="Language" value={result.parsedRequest.languageDetected} icon="🌐" />

            {/* Confidence Bar */}
            <View style={styles.confidenceSection}>
              <Text style={styles.fieldLabel}>🎯 Confidence</Text>
              <View style={styles.confidenceBarBg}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    {
                      width: `${Math.round(result.parsedRequest.confidenceScore * 100)}%`,
                      backgroundColor: result.parsedRequest.confidenceScore >= 0.8 ? '#34A853' : result.parsedRequest.confidenceScore >= 0.5 ? '#FBBC04' : '#EA4335',
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                {Math.round(result.parsedRequest.confidenceScore * 100)}%
              </Text>
            </View>

            {/* English Summary */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>English Summary</Text>
              <Text style={styles.summaryText}>{result.parsedRequest.normalizedEnglishSummary}</Text>
            </View>

            {/* Missing Fields */}
            {result.parsedRequest.missingFields.length > 0 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningLabel}>⚠ Missing Fields</Text>
                <Text style={styles.warningText}>{result.parsedRequest.missingFields.join(', ')}</Text>
              </View>
            )}

            {/* Clarification Question */}
            {result.parsedRequest.clarificationQuestion ? (
              <View style={styles.clarificationBox}>
                <Text style={styles.clarificationLabel}>❓ Clarification Needed</Text>
                <Text style={styles.clarificationText}>{result.parsedRequest.clarificationQuestion}</Text>
              </View>
            ) : null}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningLabel}>⚠ Warnings</Text>
                {result.warnings.map((w, i) => (
                  <Text key={i} style={styles.warningText}>• {w}</Text>
                ))}
              </View>
            )}

            {/* Meta */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Workflow: {result.workflowId}</Text>
              <Text style={styles.metaText}>{result.latencyMs}ms</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {result.traces.length > 0 && (
                <TouchableOpacity
                  style={styles.traceButton}
                  onPress={() => navigation.navigate('AgentTrace', {
                    workflowId: result.workflowId,
                    traces: result.traces,
                  })}
                >
                  <Text style={styles.traceButtonText}>🤖 View Agent Traces ({result.traces.length})</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.discoverButton}
                onPress={() => navigation.navigate('ProviderDiscovery', {
                  workflowId: result.workflowId,
                  parsedRequest: result.parsedRequest,
                })}
              >
                <Text style={styles.discoverButtonText}>📍 Discover Nearby Providers →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* How it works — shown only when no result */}
        {!result && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoStep}>1️⃣ Gemini AI understands your request</Text>
            <Text style={styles.infoStep}>2️⃣ Google Places finds real nearby providers</Text>
            <Text style={styles.infoStep}>3️⃣ AI ranks providers by distance, rating, price</Text>
            <Text style={styles.infoStep}>4️⃣ You book a registered provider</Text>
            <Text style={styles.infoStep}>5️⃣ Full agent trace logs every decision</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResultField({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldIcon}>{icon}</Text>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, highlight && styles.fieldHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
    minHeight: 120,
    lineHeight: 24,
  },
  demoFill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  demoFillText: {
    fontSize: 12,
    color: '#FBBC04',
    fontWeight: '600',
  },
  errorText: {
    color: '#EA4335',
    fontSize: 13,
    marginTop: 8,
    backgroundColor: '#2A1A1A',
    padding: 10,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#34A853',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ── Result Card ───────────────────────────────
  resultCard: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  geminiSource: {
    backgroundColor: '#34A853' + '25',
  },
  fallbackSource: {
    backgroundColor: '#FBBC04' + '25',
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)' + '60',
  },
  fieldIcon: {
    fontSize: 14,
    width: 24,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 80,
    fontWeight: '600',
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
  },
  fieldHighlight: {
    color: '#EA4335',
    fontWeight: '700',
  },
  confidenceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  confidenceBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
  },
  confidenceBarFill: {
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F1F5F9',
    width: 40,
    textAlign: 'right',
  },
  summaryBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0B0F1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4285F4' + '40',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#4285F4',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  warningBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#2A2A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBBC04' + '40',
  },
  warningLabel: {
    fontSize: 10,
    color: '#FBBC04',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 18,
  },
  clarificationBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6' + '40',
  },
  clarificationLabel: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  clarificationText: {
    fontSize: 13,
    color: '#CCAADD',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metaText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionRow: {
    marginTop: 12,
    gap: 10,
  },
  traceButton: {
    backgroundColor: '#4285F4',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  traceButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // ── Info Card ────────────────────────────────
  infoCard: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 20,
  },
  discoverButton: {
    backgroundColor: '#34A853',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  discoverButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
