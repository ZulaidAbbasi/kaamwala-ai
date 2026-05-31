// App.tsx — Hackathon submission build
// PitchHomeScreen as home, professional 4-screen demo flow

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { isFirebaseConfigValid } from './src/config/firebase';
import { signInAnonymous, onAuthChanged } from './src/services/auth/authService';

// New screens
import PitchHomeScreen from './src/screens/PitchHomeScreen';
import ServiceRequestEntryScreen from './src/screens/ServiceRequestEntryScreen';
import LiveWorkflowScreen from './src/screens/LiveWorkflowScreen';
import WorkflowResultScreen from './src/screens/WorkflowResultScreen';

// Secondary screens
import ApiSetupStatusScreen from './src/screens/ApiSetupStatusScreen';
import AgentTraceScreen from './src/screens/AgentTraceScreen';
import BaselineComparisonScreen from './src/screens/BaselineComparisonScreen';
import FinalSubmissionChecklistScreen from './src/screens/FinalSubmissionChecklistScreen';
import FallbackRecoveryScreen from './src/screens/FallbackRecoveryScreen';
import ProviderOnboardingScreen from './src/screens/ProviderOnboardingScreen';
import RegisteredProvidersScreen from './src/screens/RegisteredProvidersScreen';
import AntigravityEvidenceScreen from './src/screens/AntigravityEvidenceScreen';
import ProviderAdminScreen from './src/screens/ProviderAdminScreen';

// Previously missing screens (Bug fix: navigation crashes)
import HomeScreen from './src/screens/HomeScreen';
import AIUnderstandingScreen from './src/screens/AIUnderstandingScreen';
import OutcomeEvaluationScreen from './src/screens/OutcomeEvaluationScreen';
import FollowUpTimelineScreen from './src/screens/FollowUpTimelineScreen';
import BookingScreen from './src/screens/BookingScreen';
import ProviderDiscoveryScreen from './src/screens/ProviderDiscoveryScreen';
import ProviderRankingScreen from './src/screens/ProviderRankingScreen';
import DynamicPricingScreen from './src/screens/DynamicPricingScreen';
import WinningDemoScreen from './src/screens/WinningDemoScreen';
import ServiceRequestScreen from './src/screens/ServiceRequestScreen';

const Stack = createNativeStackNavigator();
const T = { bg: '#F9FAFB', header: '#FFFFFF', text: '#141B2B', accent: '#059669' };

function AppInner() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigValid()) { setLoading(false); return; }
    const unsub = onAuthChanged((u) => { if (u) setLoading(false); });
    signInAnonymous().catch(() => setLoading(false));
    const t = setTimeout(() => setLoading(false), 5000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={st.loadText}>Starting KaamWala AI...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
          headerStyle: { backgroundColor: T.header },
          headerTintColor: T.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: T.bg },
        }}>
          {/* Main flow */}
          <Stack.Screen name="Home" component={PitchHomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceRequestEntry" component={ServiceRequestEntryScreen} options={{ title: 'Service Request' }} />
          <Stack.Screen name="LiveWorkflow" component={LiveWorkflowScreen} options={{ title: 'Running Workflow', headerBackVisible: false }} />
          <Stack.Screen name="WorkflowResult" component={WorkflowResultScreen} options={{ title: 'Results', headerBackVisible: false }} />

          {/* Secondary screens */}
          <Stack.Screen name="ApiSetupStatus" component={ApiSetupStatusScreen} options={{ title: 'System Status' }} />
          <Stack.Screen name="AgentTrace" component={AgentTraceScreen} options={{ title: 'Agent Traces' }} />
          <Stack.Screen name="BaselineComparison" component={BaselineComparisonScreen} options={{ title: 'Baseline vs Agentic' }} />
          <Stack.Screen name="FinalChecklist" component={FinalSubmissionChecklistScreen} options={{ title: 'Submission' }} />
          <Stack.Screen name="FallbackRecovery" component={FallbackRecoveryScreen} options={{ title: 'Fallback Recovery' }} />
          <Stack.Screen name="ProviderOnboarding" component={ProviderOnboardingScreen} options={{ title: 'Onboarding' }} />
          <Stack.Screen name="RegisteredProviders" component={RegisteredProvidersScreen} options={{ title: 'Providers' }} />
          <Stack.Screen name="AntigravityEvidence" component={AntigravityEvidenceScreen} options={{ title: 'Evidence' }} />
          <Stack.Screen name="ProviderAdmin" component={ProviderAdminScreen} options={{ title: 'Provider Dashboard' }} />

          {/* Additional screens (Bug fix: previously missing from navigator) */}
          <Stack.Screen name="OldHome" component={HomeScreen} options={{ title: 'Dashboard' }} />
          <Stack.Screen name="AIUnderstanding" component={AIUnderstandingScreen} options={{ title: 'AI Understanding' }} />
          <Stack.Screen name="OutcomeEvaluation" component={OutcomeEvaluationScreen} options={{ title: 'Outcome Evaluation' }} />
          <Stack.Screen name="FollowUpTimeline" component={FollowUpTimelineScreen} options={{ title: 'Follow-Up Timeline' }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Booking' }} />
          <Stack.Screen name="ProviderDiscovery" component={ProviderDiscoveryScreen} options={{ title: 'Provider Discovery' }} />
          <Stack.Screen name="ProviderRanking" component={ProviderRankingScreen} options={{ title: 'Provider Ranking' }} />
          <Stack.Screen name="DynamicPricing" component={DynamicPricingScreen} options={{ title: 'Dynamic Pricing' }} />
          <Stack.Screen name="WinningDemo" component={WinningDemoScreen} options={{ title: 'Live Demo', headerShown: false }} />
          <Stack.Screen name="ServiceRequest" component={ServiceRequestScreen} options={{ title: 'Service Request' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}

const st = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  loadText: { color: T.text, marginTop: 16, fontSize: 14 },
});
