// src/components/ErrorBoundary.tsx
// Top-level crash-safe error boundary for release APK stability

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error.message);
    console.error('[ErrorBoundary] Stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>KaamWala AI</Text>
            <Text style={styles.subtitle}>Startup Error</Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{this.state.error}</Text>
            </View>

            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>Possible Fixes:</Text>
              <Text style={styles.helpText}>• Check that .env file has all EXPO_PUBLIC_ values</Text>
              <Text style={styles.helpText}>• Rebuild APK with EAS env variables configured</Text>
              <Text style={styles.helpText}>• Verify Firebase project is active</Text>
              <Text style={styles.helpText}>• Check backend URL is reachable</Text>
            </View>

            <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
              <Text style={styles.retryText}>🔄 Retry</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#F1F5F9', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#EA4335', fontWeight: '600', marginBottom: 24 },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  errorText: { fontSize: 13, color: '#991B1B', lineHeight: 20 },
  helpBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  helpTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  helpText: { fontSize: 13, color: '#64748B', lineHeight: 22 },
  retryBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
