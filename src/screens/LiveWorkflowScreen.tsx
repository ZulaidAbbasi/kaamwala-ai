// src/screens/LiveWorkflowScreen.tsx
// Premium dark-mode step-by-step live workflow runner

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { runServiceWorkflow, INITIAL_STEPS, WorkflowResult, StepStatus, LocationContext } from '../services/workflow/runServiceWorkflow';

const C = {
  bgDark: '#0B0F1A', surface: 'rgba(255,255,255,0.06)',
  text: '#F1F5F9', textSecondary: '#94A3B8', muted: '#64748B',
  emerald: '#10B981', emeraldGlow: 'rgba(16,185,129,0.15)',
  cyan: '#06B6D4', cyanGlow: 'rgba(6,182,212,0.12)',
  violet: '#8B5CF6', violetGlow: 'rgba(139,92,246,0.12)',
  amber: '#F59E0B', amberGlow: 'rgba(245,158,11,0.12)',
  red: '#F43F5E', redGlow: 'rgba(244,63,94,0.12)',
  border: 'rgba(255,255,255,0.08)',
};

const STATUS_STYLE: Record<StepStatus, { color: string; glow: string; label: string }> = {
  pending: { color: C.muted, glow: 'rgba(100,116,139,0.08)', label: 'Pending' },
  running: { color: C.cyan, glow: C.cyanGlow, label: 'Running' },
  done: { color: C.emerald, glow: C.emeraldGlow, label: 'Done' },
  warning: { color: C.amber, glow: C.amberGlow, label: 'Partial' },
  failed: { color: C.red, glow: C.redGlow, label: 'Failed' },
};

export default function LiveWorkflowScreen({ navigation, route }: { navigation: any; route: any }) {
  const rawText = route?.params?.rawText || '';
  const gpsCoords = route?.params?.gpsCoords;
  const gpsArea = route?.params?.gpsArea;
  const locationSource: string = route?.params?.locationSource || 'text';
  const [steps, setSteps] = useState(INITIAL_STEPS.map(s => ({ ...s })));
  const [done, setDone] = useState(false);
  const resultRef = useRef<WorkflowResult | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const locationCtx: LocationContext | undefined = gpsCoords
    ? { source: 'gps' as const, coordinates: { latitude: gpsCoords.lat, longitude: gpsCoords.lng }, areaText: gpsArea }
    : locationSource === 'manual'
    ? { source: 'manual' as const, areaText: gpsArea }
    : undefined;

  useEffect(() => {
    if (!rawText) return;
    runServiceWorkflow(rawText, (stepId, status, detail) => {
      setSteps(prev => prev.map(s =>
        s.id === stepId ? { ...s, status, detail: detail || s.detail } : s
      ));
    }, locationCtx).then(result => {
      resultRef.current = result;
      setDone(true);
      Animated.timing(progressAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
      setTimeout(() => {
        navigation.replace('WorkflowResult', { result, rawText });
      }, 1200);
    });
  }, []);

  const doneCount = steps.filter(s => s.status === 'done' || s.status === 'warning').length;
  const progress = doneCount / steps.length;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
  }, [progress]);

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0B0F1A', '#111827', '#0B0F1A']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>{done ? '✅ Workflow Complete' : '⚡ Running Workflow'}</Text>
            <Text style={s.subtitle}>
              {done ? 'All stages finished — loading results...' : `Processing your service request`}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={s.progressBar}>
            <Animated.View style={[s.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
              <LinearGradient colors={['#064E3B', '#10B981', '#06B6D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Text style={s.progressText}>{doneCount}/{steps.length} stages</Text>
          </View>

          {/* Request preview */}
          <View style={s.requestBox}>
            <Text style={s.requestLabel}>REQUEST</Text>
            <Text style={s.requestText} numberOfLines={2}>"{rawText}"</Text>
          </View>

          {/* Vertical stepper */}
          {steps.map((step, i) => {
            const st = STATUS_STYLE[step.status];
            const isLast = i === steps.length - 1;
            return (
              <View key={step.id} style={s.stepRow}>
                <View style={s.stepLeft}>
                  <View style={[s.stepDot, { backgroundColor: st.glow, borderColor: st.color }]}>
                    {step.status === 'running' ? (
                      <ActivityIndicator size="small" color={st.color} />
                    ) : step.status === 'done' ? (
                      <Text style={[s.stepCheckmark, { color: st.color }]}>✓</Text>
                    ) : (
                      <Text style={s.stepIcon}>{step.icon}</Text>
                    )}
                  </View>
                  {!isLast && (
                    <LinearGradient
                      colors={step.status === 'done' || step.status === 'warning' ? [C.emerald, C.emerald] : [C.border, C.border]}
                      style={s.stepLine}
                    />
                  )}
                </View>
                <View style={s.stepContent}>
                  <View style={s.stepHeader}>
                    <Text style={[s.stepLabel, step.status === 'running' && { color: C.cyan }]}>{step.label}</Text>
                    <View style={[s.stepBadge, { backgroundColor: st.glow, borderColor: `${st.color}30` }]}>
                      <Text style={[s.stepBadgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  {step.detail && <Text style={s.stepDetail}>{step.detail}</Text>}
                </View>
              </View>
            );
          })}

          {/* Action buttons */}
          {done && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => {
              if (resultRef.current) navigation.replace('WorkflowResult', { result: resultRef.current, rawText });
            }}>
              <LinearGradient colors={['#064E3B', '#065F46', '#0D9488']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.doneBtn}>
                <Text style={s.doneBtnText}>View Results →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {!done && steps.some(st => st.status === 'failed') && (
            <TouchableOpacity style={s.retryBtn} onPress={() => {
              setSteps(INITIAL_STEPS.map(st => ({ ...st })));
              setDone(false);
              runServiceWorkflow(rawText, (stepId, status, detail) => {
                setSteps(prev => prev.map(st => st.id === stepId ? { ...st, status, detail: detail || st.detail } : st));
              }).then(result => {
                resultRef.current = result;
                setDone(true);
                setTimeout(() => navigation.replace('WorkflowResult', { result, rawText }), 1200);
              });
            }}>
              <Text style={s.retryBtnText}>🔄 Try Again</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },

  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginTop: 4 },

  progressBar: { height: 36, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20, justifyContent: 'center' },
  progressFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 18, overflow: 'hidden' },
  progressText: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: C.text, zIndex: 1 },

  requestBox: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  requestLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, marginBottom: 6 },
  requestText: { fontSize: 14, color: C.textSecondary, fontStyle: 'italic', lineHeight: 21 },

  stepRow: { flexDirection: 'row', minHeight: 70 },
  stepLeft: { width: 44, alignItems: 'center' },
  stepDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepIcon: { fontSize: 15 },
  stepCheckmark: { fontSize: 16, fontWeight: '800' },
  stepLine: { width: 2, flex: 1, marginVertical: 2, borderRadius: 1 },

  stepContent: { flex: 1, paddingLeft: 14, paddingBottom: 18 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { fontSize: 16, fontWeight: '700', color: C.text },
  stepBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  stepBadgeText: { fontSize: 11, fontWeight: '700' },
  stepDetail: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 18 },

  doneBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, shadowColor: C.emerald, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  doneBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  retryBtn: { backgroundColor: C.amberGlow, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  retryBtnText: { color: C.amber, fontSize: 16, fontWeight: '700' },
});
