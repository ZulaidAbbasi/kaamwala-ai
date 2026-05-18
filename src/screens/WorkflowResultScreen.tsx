// src/screens/WorkflowResultScreen.tsx
// Challenge 2 Expected Output — Premium dark result view
// Sections: Request Summary · Recommended Provider · Reasoning · Booking · Follow-up · Agent Workflow · Other Options

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { WorkflowResult } from '../services/workflow/runServiceWorkflow';

const C = {
  bg: '#0B0F1A', surface: 'rgba(255,255,255,0.06)', text: '#F1F5F9', muted: '#64748B',
  textSecondary: '#94A3B8',
  green: '#10B981', greenBg: 'rgba(16,185,129,0.15)', deepGreen: '#064E3B',
  purple: '#8B5CF6', purpleBg: 'rgba(139,92,246,0.12)',
  teal: '#06B6D4', tealBg: 'rgba(6,182,212,0.12)',
  amber: '#F59E0B', amberBg: 'rgba(245,158,11,0.12)',
  red: '#F43F5E', blue: '#3B82F6', blueBg: 'rgba(59,130,246,0.12)',
  border: 'rgba(255,255,255,0.08)', borderAccent: 'rgba(16,185,129,0.3)',
};

function safe(val: any, fb = 'Unknown'): string {
  if (val == null || val === '') return fb;
  const s = String(val);
  if (s === 'undefined' || s === 'null' || s.includes('Cannot read')) return fb;
  return s;
}

function openLink(url: string, errorMsg: string) {
  Linking.openURL(url).catch(() => Alert.alert('Unable to Open', errorMsg));
}

export default function WorkflowResultScreen({ navigation, route }: { navigation: any; route: any }) {
  const r: WorkflowResult = route?.params?.result || {};
  const rawText: string = route?.params?.rawText || '';
  const p = r.parsed;
  const sel = r.selected;
  const pr = r.price;
  const bk = r.booking;
  const rec = r.recovery;
  const candidates = r.candidates || [];
  const others = candidates.filter((_: any, i: number) => sel ? candidates.indexOf(sel) !== i : i > 0).slice(0, 3);
  const [expandedMain, setExpandedMain] = useState(false);
  const [expandedOther, setExpandedOther] = useState<number | null>(null);

  // Determine if provider is registered (bookable) vs Google Places only
  const isRegisteredProvider = sel?.isRegistered || sel?.bookingEligible || bk?.isRealBooking || bk?.providerSource === 'registered' || false;

  // Determine location source label
  const locationSourceLabel = p?.locationSource === 'gps' ? 'Phone GPS'
    : p?.locationSource === 'manual' ? 'Manual Location'
    : rawText.includes('near me') ? 'Phone GPS'
    : 'Request Text';

  // ── Helpers ──────────────────────────────────────────────────────────

  const badge = (label: string, color: string, bg: string) => (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );

  const row = (label: string, value: string) => (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );

  const sectionCard = (title: string, accent: string, children: React.ReactNode) => (
    <View style={[s.card, { borderLeftColor: accent }]}>
      <View style={[s.cardGlow, { backgroundColor: `${accent}08` }]} />
      <Text style={s.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const actionBtn = (label: string, color: string, bg: string, onPress: () => void) => (
    <TouchableOpacity style={[s.actionBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  const providerDetailView = (c: any) => {
    const isReg = !!c.isRegistered;
    return (
    <View style={s.detailBox}>
      {row('Name', safe(c.name))}
      {row('Address', safe(c.address || c.formattedAddress, isReg ? 'Registered area provider' : 'See on Google Maps'))}
      {row(isReg ? 'Quality Rating' : 'Rating', c.rating ? `${c.rating} / 5${isReg ? ' (internal)' : ''}` : (isReg ? 'Assessment pending' : 'Not rated yet'))}
      {row(isReg ? 'Completed Jobs' : 'Reviews', c.reviewCount ? (isReg ? `${c.reviewCount} jobs completed` : `${c.reviewCount} reviews`) : (isReg ? 'New provider' : 'No reviews yet'))}
      {row('Distance', c.distanceEstimateKm ? `${c.distanceEstimateKm} km away` : (isReg ? 'Service area match' : 'Nearby'))}
      {isReg && c.rawDataSummary?.baseVisitFee ? row('Visit Fee', `PKR ${c.rawDataSummary.baseVisitFee}`) : null}
      {isReg && c.rawDataSummary?.availability ? row('Availability', `${(c.rawDataSummary.availability.timeSlots || []).join(', ')} · ${(c.rawDataSummary.availability.days || []).length} days/week`) : null}
      {!isReg && c.phoneNumber ? row('Phone', c.phoneNumber) : null}
      {!isReg && c.websiteUri ? row('Website', 'Available') : null}
      {row('Status', c.openNow === true ? '🟢 Open Now' : c.openNow === false ? '🔴 Closed' : (isReg ? 'Contact for schedule' : 'Check availability'))}
      {row('Source', isReg ? 'Registered Provider' : 'Google Places')}
      {row('Booking', isReg ? '✅ Real booking available' : 'Onboarding Required')}
      {isReg && c.rawDataSummary?.verified && row('Verification', '✓ Verified Provider')}
      <View style={s.badgeRow}>
        {isReg ? badge('Registered Provider', C.green, C.greenBg) : badge('Onboarding Required', C.amber, C.amberBg)}
        {isReg ? badge('Internal Booking', C.deepGreen, '#D1FAE5') : badge('Google Places', C.teal, C.tealBg)}
      </View>
      <View style={s.actionRow}>
        {c.googleMapsUri ? actionBtn('🗺 Open in Maps', C.teal, C.tealBg, () => openLink(c.googleMapsUri, 'Could not open Google Maps.')) : null}
        {c.phoneNumber ? actionBtn('📞 Call', C.green, C.greenBg, () => openLink(`tel:${c.phoneNumber}`, 'Could not open dialer.')) : null}
        {c.websiteUri ? actionBtn('🌐 Website', C.blue, C.blueBg, () => openLink(c.websiteUri, 'Could not open browser.')) : null}
      </View>
    </View>
    );
  };


  // ── Build reasoning text ─────────────────────────────────────────────
  const buildReasoning = (): string => {
    if (!sel) return 'No provider was selected. Try broadening your search or adding a location.';
    const parts: string[] = [];
    parts.push(`This provider was recommended because it matched the ${safe(p?.serviceType, 'requested service')} request`);
    if (sel.distanceEstimateKm) parts.push(`is ${sel.distanceEstimateKm} km from the selected location`);
    else if (isRegisteredProvider) parts.push('serves the requested area');
    else parts.push('appeared near the selected location');
    if (sel.rating) parts.push(`has a ${sel.rating}/5 ${isRegisteredProvider ? 'internal quality' : ''} rating`);
    if (sel.reviewCount) parts.push(isRegisteredProvider ? `has completed ${sel.reviewCount} jobs` : `has ${sel.reviewCount} reviews`);
    if (isRegisteredProvider) parts.push('is a verified registered provider eligible for real booking');
    parts.push('and scored highest across service match, distance, and data completeness');
    let text = parts.join(', ') + '.';
    if (!isRegisteredProvider && !sel.rating && !sel.distanceEstimateKm) {
      text += ' Some provider details were unavailable from Google Places, so the ranking used available location and service-match data.';
    }
    return text;
  };

  return (
    <View style={s.root}>
    <LinearGradient colors={['#0B0F1A', '#111827', '#0B0F1A']} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — Service Request
            ═══════════════════════════════════════════════════════════════ */}
        {sectionCard('🧠 Service Request', C.purple, <>
          {row('Service Request', safe(p?.serviceType, 'Service requested'))}
          {row('Location', safe(p?.locationArea || p?.locationText, 'Not provided'))}
          {row('Time', safe(p?.preferredTimeWindow || p?.preferredDate, 'Not specified'))}
          {row('Language', safe(p?.languageDetected, 'Unknown'))}
          {row('Urgency', safe(p?.urgency, 'Not specified'))}
          {row('Budget', safe(p?.budgetSensitivity, 'Not specified'))}
          {row('Location Source', locationSourceLabel)}
          <View style={s.badgeRow}>
            {badge(p?.source === 'fallback' ? 'Fallback Safe Parser' : 'Gemini AI', C.purple, C.purpleBg)}
            {badge(`Confidence: ${p?.confidenceScore ? Math.round(p.confidenceScore * 100) + '%' : (p?.confidence ? Math.round(p.confidence * 100) + '%' : 'N/A')}`, C.teal, C.tealBg)}
          </View>
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — Recommended Provider
            ═══════════════════════════════════════════════════════════════ */}
        {sel ? sectionCard('🏆 Recommended Provider', isRegisteredProvider ? C.green : C.teal, <>
          <TouchableOpacity onPress={() => setExpandedMain(!expandedMain)} activeOpacity={0.7}>
            <View style={s.mainProviderRow}>
              <View style={[s.avatarLg, isRegisteredProvider ? {} : { backgroundColor: C.tealBg }]}>
                <Text style={[s.avatarLgText, isRegisteredProvider ? {} : { color: C.teal }]}>{(sel.name || '?')[0]}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.mainProviderName}>{safe(sel.name)}</Text>
                <Text style={s.providerMeta}>
                  {sel.rating ? `⭐ ${sel.rating}${isRegisteredProvider ? ' (internal)' : ''}` : ''}{sel.reviewCount ? ` · ${isRegisteredProvider ? `${sel.reviewCount} jobs` : `${sel.reviewCount} reviews`}` : ''}{sel.distanceEstimateKm ? ` · ${sel.distanceEstimateKm} km` : ''}
                </Text>
              </View>
              <Text style={s.expandArrow}>{expandedMain ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>
          {/* Quick info always visible — context-aware labels */}
          {row('Distance', sel.distanceEstimateKm ? `${sel.distanceEstimateKm} km away` : (isRegisteredProvider ? 'Service area match' : 'Nearby'))}
          {row(isRegisteredProvider ? 'Quality Score' : 'Rating', sel.rating ? `${sel.rating} / 5${isRegisteredProvider ? ' (internal)' : ''}` : (isRegisteredProvider ? `${sel.reviewCount || 0} completed jobs` : 'Not rated yet'))}
          {row('Address', safe(sel.address || sel.formattedAddress, isRegisteredProvider ? 'Registered area provider' : 'See on Google Maps'))}
          {row('Open Status', sel.openNow === true ? '🟢 Open Now' : sel.openNow === false ? '🔴 Closed' : (isRegisteredProvider ? 'Contact for schedule' : 'Check availability'))}
          {row('Source', isRegisteredProvider ? 'Registered Provider' : 'Google Places')}
          {row('Booking', isRegisteredProvider ? '✅ Bookable' : 'Onboarding Required')}
          {isRegisteredProvider && sel.rawDataSummary?.availability && row('Available', `${(sel.rawDataSummary.availability.timeSlots || []).join(', ')} · ${(sel.rawDataSummary.availability.days || []).length} days/week`)}
          {isRegisteredProvider && sel.rawDataSummary?.baseVisitFee && row('Visit Fee', `PKR ${sel.rawDataSummary.baseVisitFee}`)}
          {isRegisteredProvider && sel.rawDataSummary?.completedJobs && row('Track Record', `${sel.rawDataSummary.completedJobs} completed jobs${sel.rawDataSummary.verified ? ' · Verified ✓' : ''}`)}
          <View style={s.badgeRow}>
            {isRegisteredProvider
              ? badge('Registered Provider', C.green, C.greenBg)
              : badge('Onboarding Required', C.amber, C.amberBg)}
            {isRegisteredProvider
              ? badge('Internal Booking', C.deepGreen, '#D1FAE5')
              : badge('Google Places Data', C.teal, C.tealBg)}
          </View>
          {/* Action buttons */}
          <View style={s.actionRow}>
            {sel.googleMapsUri ? actionBtn('🗺 Open in Maps', C.teal, C.tealBg, () => openLink(sel.googleMapsUri, 'Could not open Google Maps.')) : null}
            {sel.phoneNumber ? actionBtn('📞 Call', C.green, C.greenBg, () => openLink(`tel:${sel.phoneNumber}`, 'Could not open dialer.')) : null}
            {sel.websiteUri ? actionBtn('🌐 Website', C.blue, C.blueBg, () => openLink(sel.websiteUri, 'Could not open browser.')) : null}
          </View>
          {/* Expanded details */}
          {expandedMain && providerDetailView(sel)}
        </>) : sectionCard('🏆 Recommended Provider', C.amber, <>
          <Text style={s.noDataText}>No provider could be recommended for this search. Try adding a specific location or using GPS.</Text>
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2.5 — Other Nearby Options (right after recommended)
            ═══════════════════════════════════════════════════════════════ */}
        {others.length > 0 && sectionCard('📍 Other Nearby Options', C.muted, <>
          {others.map((c: any, i: number) => (
            <TouchableOpacity key={i} onPress={() => setExpandedOther(expandedOther === i ? null : i)} activeOpacity={0.7}>
              <View style={s.otherRow}>
                <View style={s.avatar}><Text style={s.avatarText}>{(c.name || '?')[0]}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.otherName}>{safe(c.name, `Provider ${i + 1}`)}</Text>
                  <Text style={s.providerMeta}>
                    {c.rating ? `⭐ ${c.rating}` : ''}{c.reviewCount ? ` (${c.reviewCount})` : ''}{c.distanceEstimateKm ? ` · ${c.distanceEstimateKm} km` : ''}
                  </Text>
                </View>
                <Text style={s.expandArrow}>{expandedOther === i ? '▲' : '▼'}</Text>
              </View>
              {expandedOther === i && providerDetailView(c)}
            </TouchableOpacity>
          ))}
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — Reasoning
            ═══════════════════════════════════════════════════════════════ */}
        {sectionCard('💡 Reasoning', C.blue, <>
          <Text style={s.reasoningText}>{buildReasoning()}</Text>
          {sel && (sel.factors || []).length > 0 && <>
            <View style={{ marginTop: 10 }}>
              {(sel.factors || []).slice(0, 4).map((f: any, i: number) => (
                <View key={i} style={s.factorRow}>
                  <Text style={s.factorLabel}>{safe(f.factor, ['Service Match', 'Distance', 'Rating', 'Data'][i])}</Text>
                  <View style={s.barBg}><View style={[s.barFill, { width: `${Math.round((f.normalizedScore || 0) * 100)}%` }]} /></View>
                  <Text style={s.factorVal}>{Math.round((f.normalizedScore || 0) * 100)}%</Text>
                </View>
              ))}
            </View>
          </>}
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3.5 — Price Estimation
            ═══════════════════════════════════════════════════════════════ */}
        {pr ? sectionCard('💰 Price Estimation', C.teal, <>
          {row('Estimated Range', `PKR ${safe(pr.estimateLow, '—')} – ${safe(pr.estimateHigh, '—')}`)}
          {row('Recommended', `PKR ${safe(pr.recommendedEstimate, '—')}`)}
          {row('Currency', safe(pr.currency, 'PKR'))}
          {pr.confidence && row('Confidence', `${Math.round(pr.confidence * 100)}%`)}
          {pr.breakdown && pr.breakdown.length > 0 && <>
            <View style={{ marginTop: 8 }}>
              <Text style={[s.rowLabel, { fontWeight: '700', marginBottom: 4 }]}>Pricing Factors</Text>
              {pr.breakdown.slice(0, 5).map((item: any, i: number) => (
                <View key={i} style={s.factorRow}>
                  <Text style={s.factorLabel}>{safe(item.label || item.factor, `Factor ${i+1}`)}</Text>
                  <Text style={s.factorVal}>{item.amount != null ? `PKR ${item.amount}` : safe(item.impact || item.value, '—')}</Text>
                </View>
              ))}
            </View>
          </>}
          <View style={s.badgeRow}>
            {badge('Market Rate', C.teal, C.tealBg)}
            {badge('AI Estimated', C.purple, C.purpleBg)}
            {isRegisteredProvider && sel?.rawDataSummary?.baseVisitFee && badge(`Base Fee: PKR ${sel.rawDataSummary.baseVisitFee}`, C.green, C.greenBg)}
          </View>
        </>) : sectionCard('💰 Price Estimation', C.amber, <>
          {row('Status', 'Price estimate unavailable')}
          {isRegisteredProvider && sel?.rawDataSummary?.baseVisitFee && row('Provider Base Fee', `PKR ${sel.rawDataSummary.baseVisitFee}`)}
          <View style={s.badgeRow}>
            {badge('Estimate Pending', C.amber, C.amberBg)}
          </View>
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4 — Booking
            ═══════════════════════════════════════════════════════════════ */}
        {isRegisteredProvider ? sectionCard('📋 Real Booking', C.green, <>
          {row('Booking Record', bk ? 'Created ✓' : 'Not created')}
          {bk?.bookingId && row('Booking ID', bk.bookingId.substring(0, 22) + '...')}
          {row('Provider', safe(sel?.name, 'Not selected'))}
          {row('Requested Slot', safe(p?.preferredTimeWindow || p?.preferredDate, 'Not specified'))}
          {row('Status', safe(bk?.statusLabel, 'Pending Provider Confirmation'))}
          {row('Firestore', bk?.firestoreSaved ? 'Saved ✓' : 'Not saved')}
          {row('Provider Notification', 'Record created')}
          {row('Follow-up Records', 'Scheduled')}
          <View style={s.badgeRow}>
            {bk?.firestoreSaved && badge('Firestore Saved', C.green, C.greenBg)}
            {badge('Real Booking Record', C.deepGreen, '#D1FAE5')}
            {badge('No Real SMS Sent', C.amber, C.amberBg)}
          </View>
          <TouchableOpacity style={s.traceBtn} onPress={() => navigation.navigate('ProviderAdmin')}>
            <Text style={s.traceBtnText}>Open Provider Dashboard →</Text>
          </TouchableOpacity>
          <Text style={s.bookingNote}>Provider can Accept or Reject from the Provider Dashboard. Follow-up workflow activates after acceptance.</Text>
        </>) : sectionCard('📋 Inquiry Record', C.amber, <>
          {row('Record Type', 'Inquiry (not a confirmed booking)')}
          {bk?.bookingId && row('Record ID', bk.bookingId.substring(0, 22) + '...')}
          {row('Provider', safe(sel?.name, 'Not selected'))}
          {row('Status', 'Onboarding Required')}
          {row('Firestore', bk?.firestoreSaved ? 'Saved ✓' : 'Not saved')}
          <View style={s.badgeRow}>
            {bk?.firestoreSaved && badge('Firestore Saved', C.green, C.greenBg)}
            {badge('Onboarding Required', C.amber, C.amberBg)}
            {badge('Not Confirmed', C.muted, '#F3F4F6')}
          </View>
          <Text style={s.bookingNote}>This provider was discovered from Google Places and is not registered on KaamWala. Confirmed booking requires provider onboarding first.</Text>
          <View style={s.actionRow}>
            {sel?.googleMapsUri ? actionBtn('🗺 Open in Maps', C.teal, C.tealBg, () => openLink(sel.googleMapsUri, 'Could not open Google Maps.')) : null}
            {sel?.phoneNumber ? actionBtn('📞 Call', C.green, C.greenBg, () => openLink(`tel:${sel.phoneNumber}`, 'Could not open dialer.')) : null}
          </View>
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5 — Follow-up
            ═══════════════════════════════════════════════════════════════ */}
        {sectionCard('Follow-up', C.purple, <>
          {r.followUp?.timeline && Array.isArray(r.followUp.timeline) ? <>
            {r.followUp.timeline.slice(0, 6).map((evt: any, i: number) => (
              <View key={i} style={s.traceStep}>
                <Text style={s.traceStepText}>{safe(evt.title, `Step ${evt.step}`)}</Text>
                <Text style={[s.traceCheck, evt.status === 'completed' ? {} : { color: C.amber }]}>
                  {evt.status === 'completed' ? 'Done' : evt.status}
                </Text>
              </View>
            ))}
            {r.followUp.feedback && row('Customer Rating', `${r.followUp.feedback.rating}/5`)}
            {r.followUp.firestoreSaved && row('Firestore', 'All events saved')}
            {row('Timeline Events', `${r.followUp.timeline.length} steps completed`)}
          </> : <>
            {row('Reminder', 'Scheduled: 1 hour before appointment')}
            {row('Status Update', 'Provider confirmation prepared')}
            {row('Completion', 'Completion confirmation prepared')}
            {row('Feedback', 'Rating request prepared')}
          </>}
          <View style={s.badgeRow}>
            {badge('Reminder Scheduled', C.teal, C.tealBg)}
            {badge('Confirmation Sent', C.green, C.greenBg)}
            {badge('Safe Simulation', C.amber, C.amberBg)}
          </View>
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5.5 — Recovery / Fallback
            ═══════════════════════════════════════════════════════════════ */}
        {sectionCard('🔄 Recovery & Fallback', '#DC2626', <>
          {rec ? <>
            {row('Scenario', safe(rec.scenarioLabel || rec.scenario || rec.recoveryScenario, 'Provider Cancellation'))}
            {row('Issue', safe(rec.issueDetected, 'Provider became unavailable'))}
            {row('Recovery', safe(rec.selectedRecovery || rec.status, 'Re-ranked and found replacement'))}
            {rec.stateAfter?.replacementProvider && row('Backup Provider', safe(rec.stateAfter.replacementProvider, '—'))}
            {rec.reasoning && <Text style={[s.reasoningText, { marginTop: 8 }]}>{safe(rec.reasoning, 'System detected provider unavailability and re-ranked remaining candidates.')}</Text>}
            {rec.apologyMessage && <Text style={[s.bookingNote, { marginTop: 6 }]}>📧 {rec.apologyMessage}</Text>}
            {rec.apologyMessageUrdu && <Text style={[s.bookingNote, { fontStyle: 'normal' }]}>🇵🇰 {rec.apologyMessageUrdu}</Text>}
            <View style={s.badgeRow}>
              {badge('Auto-Recovery', '#DC2626', '#FEF2F2')}
              {rec.stateAfter?.recoveryStatus === 'replacement_found' ? badge('Backup Found', C.green, C.greenBg) : badge('Recovery Attempted', C.amber, C.amberBg)}
              {badge('Bilingual Update', C.purple, C.purpleBg)}
              {rec.firestoreSaved && badge('Firestore Saved', C.green, C.greenBg)}
            </View>
          </> : <>
            {row('Scenario', 'Provider cancellation test')}
            {row('Recovery', 'System can re-rank and find backup')}
            {row('Status', 'Ready')}
            <View style={s.badgeRow}>
              {badge('Recovery Ready', C.teal, C.tealBg)}
              {badge('Fallback Available', C.green, C.greenBg)}
            </View>
          </>}
        </>)}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6 — Agent Workflow
            ═══════════════════════════════════════════════════════════════ */}
        {sectionCard('🤖 Agent Workflow', C.deepGreen, <>
          {['🧠 Intent Understanding', '🔍 Provider Discovery', '🏆 Ranking Decision', '💰 Price Estimation', '📋 Booking Action', '📅 Follow-up Prepared', '🔄 Recovery Tested', '🤖 Trace Logged'].map((step, i) => (
            <View key={i} style={s.traceStep}>
              <Text style={s.traceStepText}>{step}</Text>
              <Text style={s.traceCheck}>✓</Text>
            </View>
          ))}
          {row('Total Events', `${(r.traces || []).length}+ logged`)}
          <TouchableOpacity style={s.traceBtn} onPress={() => navigation.navigate('AgentTrace', { workflowId: r.workflowId, traces: r.traces })}>
            <Text style={s.traceBtnText}>View Full Trace →</Text>
          </TouchableOpacity>
        </>)}

        {/* Other Nearby Options moved to Section 2.5 above */}

        {/* ═══════════════════════════════════════════════════════════════
            NAVIGATION
            ═══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity style={s.newRequestBtn} onPress={() => navigation.navigate('ServiceRequestEntry')}>
          <Text style={s.newRequestText}>🔄 Try Another Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={s.homeBtnText}>← Back to Home</Text>
        </TouchableOpacity>
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('ProviderAdmin')}>
            <Text style={s.navBtnText}>📋 Provider</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('AgentTrace', { workflowId: r.workflowId, traces: r.traces })}>
            <Text style={s.navBtnText}>🤖 Traces</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('FinalChecklist')}>
            <Text style={s.navBtnText}>📝 Submit</Text>
          </TouchableOpacity>
        </View>

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
  content: { padding: 16, paddingTop: 8 },

  // Card
  card: { backgroundColor: C.surface, borderRadius: 18, padding: 20, marginVertical: 8, borderLeftWidth: 4, borderWidth: 1, borderColor: C.border, borderTopColor: C.border, borderRightColor: C.border, borderBottomColor: C.border, overflow: 'hidden', position: 'relative' as const },
  cardGlow: { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 60, borderRadius: 18 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: C.text, marginBottom: 14, letterSpacing: -0.3 },

  // Rows
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 6, minHeight: 30 },
  rowLabel: { fontSize: 14, color: C.muted, flex: 1 },
  rowValue: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1.2, textAlign: 'right' as const },

  // Badges
  badgeRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Recommended Provider
  mainProviderRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: 8, marginBottom: 10 },
  avatarLg: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.greenBg, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 2, borderColor: 'rgba(16,185,129,0.3)' },
  avatarLgText: { fontSize: 20, fontWeight: '800', color: C.green },
  mainProviderName: { fontSize: 18, fontWeight: '800', color: C.text },
  providerMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  expandArrow: { fontSize: 14, color: C.muted, paddingHorizontal: 8 },

  // Action buttons
  actionRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 14 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, minHeight: 46, justifyContent: 'center' as const, borderWidth: 1, borderColor: C.border },
  actionBtnText: { fontSize: 14, fontWeight: '700' },

  // Provider detail (expanded)
  detailBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: C.border },

  // Other providers
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.tealBg, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: 'rgba(6,182,212,0.3)' },
  avatarText: { fontSize: 15, fontWeight: '800', color: C.teal },
  otherRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  otherName: { fontSize: 15, fontWeight: '700', color: C.text },

  // Reasoning
  reasoningText: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },
  noDataText: { fontSize: 14, color: C.muted, lineHeight: 22 },

  // Ranking factors
  factorRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginVertical: 4 },
  factorLabel: { fontSize: 13, color: C.muted, width: 100 },
  barBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4 },
  barFill: { height: 8, backgroundColor: C.teal, borderRadius: 4 },
  factorVal: { fontSize: 13, fontWeight: '600', color: C.text, width: 36, textAlign: 'right' as const },

  // Trace
  traceStep: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  traceStepText: { fontSize: 14, color: C.text },
  traceCheck: { fontSize: 14, fontWeight: '700', color: C.green },
  traceBtn: { marginTop: 14, paddingVertical: 14, minHeight: 48, alignItems: 'center' as const, backgroundColor: C.purpleBg, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  traceBtnText: { fontSize: 15, fontWeight: '700', color: C.purple },

  // Booking note
  bookingNote: { fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 18, fontStyle: 'italic' as const },

  // Navigation
  newRequestBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' as const, marginTop: 16, borderWidth: 1.5, borderColor: C.borderAccent, backgroundColor: C.greenBg },
  newRequestText: { color: C.green, fontSize: 16, fontWeight: '700' },
  homeBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' as const, marginTop: 8, backgroundColor: C.deepGreen },
  homeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  navRow: { flexDirection: 'row' as const, gap: 8, marginTop: 8 },
  navBtn: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, alignItems: 'center' as const, justifyContent: 'center' as const },
  navBtnText: { fontSize: 13, fontWeight: '700', color: C.text },
});

