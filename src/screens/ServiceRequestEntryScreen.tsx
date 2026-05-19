// src/screens/ServiceRequestEntryScreen.tsx
// Premium dark-mode service request entry

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

const C = {
  bgDark: '#0B0F1A', bgCard: '#141B2B', surface: 'rgba(255,255,255,0.06)',
  text: '#F1F5F9', textSecondary: '#94A3B8', muted: '#64748B',
  emerald: '#10B981', emeraldGlow: 'rgba(16,185,129,0.15)',
  cyan: '#06B6D4', cyanGlow: 'rgba(6,182,212,0.12)',
  violet: '#8B5CF6', violetGlow: 'rgba(139,92,246,0.12)',
  amber: '#F59E0B', amberGlow: 'rgba(245,158,11,0.12)',
  rose: '#F43F5E',
  border: 'rgba(255,255,255,0.08)', borderFocus: 'rgba(16,185,129,0.4)',
  inputBg: 'rgba(255,255,255,0.04)',
};

const DEFAULT_REQUEST = 'AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.';

const EXAMPLE_REQUESTS = [
  { label: '🇵🇰 Roman Urdu', text: 'AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.', color: C.emerald },
  { label: 'اردو', text: 'اے سی بالکل کام نہیں کر رہا، کل صبح جی-13 میں ٹیکنیشن چاہیے، بجٹ زیادہ نہیں ہے۔', color: C.violet },
  { label: '🌍 English', text: 'My AC is not working at all, I need a technician tomorrow morning in G-13 Islamabad, budget is low.', color: C.cyan },
  { label: '🔀 Mixed', text: 'Plumber chahiye urgently, F-8 Islamabad, pipe leak ho raha hai bathroom mein.', color: C.amber },
];

type LocationSource = 'Request Text' | 'Phone GPS' | 'Manual';

export default function ServiceRequestEntryScreen({ navigation }: { navigation: any }) {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('Roman Urdu');
  const [locationSource, setLocationSource] = useState<LocationSource>('Request Text');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsArea, setGpsArea] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  // Auto-request location on screen mount
  useEffect(() => {
    autoDetectLocation();
  }, []);

  async function autoDetectLocation() {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        setGpsError('Location permission denied. Tap below to try again or enter your area in the request.');
        setGpsLoading(false);
        return;
      }
      setLocationDenied(false);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setGpsCoords(coords);
      setLocationSource('Phone GPS');
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
        if (geo.length > 0) {
          const place = geo[0];
          const area = [place.subregion, place.district, place.city, place.region].filter(Boolean).join(', ');
          setGpsArea(area || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        } else {
          setGpsArea(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
      } catch {
        setGpsArea(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      }
    } catch {
      setGpsError('Could not detect location. Please enter area manually in your request.');
    }
    setGpsLoading(false);
  }

  const langs = ['Urdu', 'Roman Urdu', 'English', 'Mixed'];

  async function handleUseLocation() {
    await autoDetectLocation();
  }

  function handleContinue() {
    navigation.navigate('LiveWorkflow', { rawText: text, isDemo: false, gpsCoords, gpsArea, locationSource });
  }

  const locationDisplay = locationSource === 'Phone GPS' && gpsArea
    ? `📍 ${gpsArea}`
    : '📍 Detected from request text';

  const sourceBadge: Record<LocationSource, { color: string; bg: string }> = {
    'Request Text': { color: C.cyan, bg: C.cyanGlow },
    'Phone GPS': { color: C.emerald, bg: C.emeraldGlow },
    'Manual': { color: C.amber, bg: C.amberGlow },
  };
  const sb = sourceBadge[locationSource];

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0B0F1A', '#111827', '#0B0F1A']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>What do you need?</Text>
            <Text style={s.subtitle}>Describe your service need in any language — Urdu, Roman Urdu, or English. Our AI understands them all.</Text>
          </View>

          {/* Input Card */}
          <View style={[s.inputCard, isFocused && s.inputCardFocused]}>
            <View style={s.inputHeader}>
              <Text style={s.inputLabel}>SERVICE REQUEST</Text>
              <View style={s.charBadge}>
                <Text style={s.charCount}>{text.length}</Text>
              </View>
            </View>
            <TextInput
              style={s.input}
              multiline
              numberOfLines={4}
              value={text}
              onChangeText={setText}
              placeholder="Describe what you need..."
              placeholderTextColor={C.muted}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          {/* Example Presets */}
          <Text style={s.sectionLabel}>TRY EXAMPLES</Text>
          <View style={s.chipRow}>
            {EXAMPLE_REQUESTS.map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={[s.chip, text === ex.text && { backgroundColor: `${ex.color}22`, borderColor: ex.color }]}
                activeOpacity={0.7}
                onPress={() => { setText(ex.text); setLang(ex.label.includes('اردو') ? 'Urdu' : ex.label.replace(/[^a-zA-Z ]/g, '').trim()); }}
              >
                <Text style={[s.chipText, text === ex.text && { color: ex.color }]}>{ex.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Language */}
          <Text style={s.sectionLabel}>LANGUAGE</Text>
          <View style={s.chipRow}>
            {langs.map(l => (
              <TouchableOpacity
                key={l}
                style={[s.chip, lang === l && { backgroundColor: C.violetGlow, borderColor: C.violet }]}
                activeOpacity={0.7}
                onPress={() => setLang(l)}
              >
                <Text style={[s.chipText, lang === l && { color: C.violet }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={s.sectionLabel}>LOCATION</Text>
          <View style={s.locationCard}>
            <Text style={s.locationText}>{locationDisplay}</Text>
            <View style={[s.locationBadge, { backgroundColor: sb.bg }]}>
              <Text style={[s.locationBadgeText, { color: sb.color }]}>{locationSource}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[s.gpsBtn, gpsLoading && { opacity: 0.5 }]}
            disabled={gpsLoading}
            activeOpacity={0.7}
            onPress={handleUseLocation}
          >
            <Text style={s.gpsBtnText}>
              {gpsLoading ? '⏳ Detecting location...' : '📱 Use Current Location'}
            </Text>
          </TouchableOpacity>
          {gpsError && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠️ {gpsError}</Text>
            </View>
          )}

          {/* Privacy */}
          <View style={s.privacyBox}>
            <Text style={s.privacyText}>🔒 No sensitive personal data required. Area-level location is enough.</Text>
          </View>

          {/* Continue */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!text.trim()}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={text.trim() ? ['#064E3B', '#065F46', '#0D9488'] : ['#1E293B', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.continueBtn, !text.trim() && { opacity: 0.4 }]}
            >
              <Text style={s.continueBtnText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
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

  header: { marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginTop: 6, lineHeight: 21 },

  inputCard: { backgroundColor: C.inputBg, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: C.border, marginBottom: 20 },
  inputCardFocused: { borderColor: C.borderFocus, backgroundColor: 'rgba(16,185,129,0.04)' },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.2 },
  charBadge: { backgroundColor: C.surface, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  charCount: { fontSize: 11, fontWeight: '600', color: C.muted },
  input: { fontSize: 16, color: C.text, lineHeight: 24, minHeight: 100, textAlignVertical: 'top' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.2, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },

  locationCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  locationText: { fontSize: 14, color: C.text, flex: 1, marginRight: 8 },
  locationBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  locationBadgeText: { fontSize: 11, fontWeight: '700' },

  gpsBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(6,182,212,0.3)', backgroundColor: C.cyanGlow, alignItems: 'center', marginBottom: 10 },
  gpsBtnText: { fontSize: 13, fontWeight: '700', color: C.cyan },

  errorBox: { backgroundColor: C.amberGlow, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  errorText: { fontSize: 12, color: C.amber },

  privacyBox: { backgroundColor: C.emeraldGlow, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  privacyText: { fontSize: 13, color: C.emerald, lineHeight: 19 },

  continueBtn: { paddingVertical: 20, borderRadius: 16, alignItems: 'center', shadowColor: C.emerald, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  continueBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
});
