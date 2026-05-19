// functions/src/services/followUpService.ts
// Simulates a realistic post-booking service lifecycle
// Creates real Firestore timeline events — no real-world dispatch

import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { safeLog } from '../utils/safeLogger';


// ============================================================================
// Types
// ============================================================================

export type TimelineStatus = 'completed' | 'pending' | 'skipped';

export interface TimelineEvent {
  step: number;
  eventId: string;
  eventType: string;
  title: string;
  description: string;
  status: TimelineStatus;
  timestamp: string;
  icon: string;
  durationLabel: string;
  metadata?: Record<string, any>;
}

export interface DiagnosisChecklistItem {
  item: string;
  checked: boolean;
  note: string;
}

export interface FeedbackCapture {
  rating: number;
  ratingLabel: string;
  comment: string;
  wouldRecommend: boolean;
}

export interface ReputationUpdate {
  providerId: string | null;
  providerName: string;
  isRegistered: boolean;
  previousRating: number;
  newRating: number;
  previousCompletedJobs: number;
  newCompletedJobs: number;
  ratingUpdated: boolean;
  updateNote: string;
}

export interface FutureMatchingImpact {
  factors: string[];
  explanation: string;
}

export interface FollowUpResult {
  workflowId: string;
  bookingId: string;
  timeline: TimelineEvent[];
  checklist: DiagnosisChecklistItem[];
  feedback: FeedbackCapture;
  reputationUpdate: ReputationUpdate;
  futureMatchingImpact: FutureMatchingImpact;
  firestoreSaved: boolean;
  warnings: string[];
}

// ============================================================================
// Main Follow-Up Simulation
// ============================================================================

export async function simulateFollowUp(input: {
  workflowId: string;
  bookingId: string;
}): Promise<FollowUpResult> {
  const warnings: string[] = [];
  const { workflowId, bookingId } = input;

  // ── 1. Load booking from Firestore ────────────────────────────────
  let booking: any = null;
  try {
    const doc = await db.collection('bookings').doc(bookingId).get();
    if (doc.exists) {
      booking = doc.data();
    }
  } catch (err: any) {
    safeLog.error('FollowUpService', 'Failed to load booking', err);
  }

  if (!booking) {
    warnings.push('Booking not found in Firestore — using simulated defaults.');
  }

  const providerName = booking?.providerName || 'Demo Provider';
  const serviceType = booking?.serviceType || 'AC Repair';
  const isRegistered = booking?.isRegisteredProvider ?? false;
  const providerId = booking?.providerId || null;
  const locationArea = booking?.locationArea || 'Islamabad';

  // ── 2. Build timeline ─────────────────────────────────────────────
  const baseTime = new Date();
  const timeline: TimelineEvent[] = [
    {
      step: 1,
      eventId: `evt_${bookingId}_booking_created`,
      eventType: 'booking_created',
      title: '📝 Booking Created',
      description: `${serviceType} booking created for ${providerName} in ${locationArea}.`,
      status: 'completed',
      timestamp: new Date(baseTime.getTime() - 3600000).toISOString(), // -1h
      icon: '📝',
      durationLabel: '1 hour ago',
    },
    {
      step: 2,
      eventId: `evt_${bookingId}_reminder`,
      eventType: 'reminder_scheduled',
      title: '⏰ Reminder Scheduled',
      description: `Reminder sent to provider 30 minutes before arrival window.`,
      status: 'completed',
      timestamp: new Date(baseTime.getTime() - 1800000).toISOString(), // -30m
      icon: '⏰',
      durationLabel: '30 min ago',
    },
    {
      step: 3,
      eventId: `evt_${bookingId}_en_route`,
      eventType: 'provider_en_route',
      title: '🚗 Provider En Route',
      description: `${providerName} is heading to your location.`,
      status: 'completed',
      timestamp: new Date(baseTime.getTime() - 1200000).toISOString(), // -20m
      icon: '🚗',
      durationLabel: '20 min ago',
    },
    {
      step: 4,
      eventId: `evt_${bookingId}_arrived`,
      eventType: 'provider_arrived',
      title: '📍 Provider Arrived',
      description: `${providerName} arrived at ${locationArea}.`,
      status: 'completed',
      timestamp: new Date(baseTime.getTime() - 600000).toISOString(), // -10m
      icon: '📍',
      durationLabel: '10 min ago',
    },
    {
      step: 5,
      eventId: `evt_${bookingId}_diagnosis`,
      eventType: 'diagnosis_started',
      title: '🔍 Diagnosis & Inspection',
      description: `${providerName} is inspecting the ${serviceType.toLowerCase()} issue. See checklist below.`,
      status: 'completed',
      timestamp: new Date(baseTime.getTime() - 300000).toISOString(), // -5m
      icon: '🔍',
      durationLabel: '5 min ago',
    },
    {
      step: 6,
      eventId: `evt_${bookingId}_work_done`,
      eventType: 'work_completed',
      title: '✅ Work Completed',
      description: `${providerName} has completed the ${serviceType.toLowerCase()} work. Customer confirmed satisfaction.`,
      status: 'completed',
      timestamp: new Date(baseTime.getTime() - 60000).toISOString(), // -1m
      icon: '✅',
      durationLabel: '1 min ago',
    },
    {
      step: 7,
      eventId: `evt_${bookingId}_feedback_req`,
      eventType: 'feedback_requested',
      title: '⭐ Feedback Requested',
      description: 'Customer was asked to rate the service experience.',
      status: 'completed',
      timestamp: new Date(baseTime.getTime() - 30000).toISOString(), // -30s
      icon: '⭐',
      durationLabel: '30 sec ago',
    },
    {
      step: 8,
      eventId: `evt_${bookingId}_rating`,
      eventType: 'rating_captured',
      title: '🏆 Rating Captured',
      description: 'Customer provided a 4.5/5 rating with positive feedback.',
      status: 'completed',
      timestamp: new Date().toISOString(),
      icon: '🏆',
      durationLabel: 'Just now',
    },
    {
      step: 9,
      eventId: `evt_${bookingId}_reputation`,
      eventType: 'reputation_updated',
      title: '📊 Provider Metrics Updated',
      description: isRegistered
        ? `${providerName}'s internal rating and completed jobs count updated.`
        : `Unregistered provider — public reputation NOT modified. Internal log only.`,
      status: isRegistered ? 'completed' : 'skipped',
      timestamp: new Date().toISOString(),
      icon: '📊',
      durationLabel: 'Just now',
      metadata: { isRegistered, providerId },
    },
    {
      step: 10,
      eventId: `evt_${bookingId}_matching_impact`,
      eventType: 'future_matching_impact',
      title: '🧠 Future Matching Impact',
      description: 'This completed job affects how the AI ranks this provider in future requests.',
      status: 'completed',
      timestamp: new Date().toISOString(),
      icon: '🧠',
      durationLabel: 'Just now',
    },
  ];

  // ── 3. Build diagnosis checklist ──────────────────────────────────
  const checklist: DiagnosisChecklistItem[] = buildChecklist(serviceType);

  // ── 4. Simulate feedback ──────────────────────────────────────────
  const feedback: FeedbackCapture = {
    rating: 4.5,
    ratingLabel: '⭐⭐⭐⭐½',
    comment: 'Good service. Technician was punctual and professional. AC is working well now.',
    wouldRecommend: true,
  };

  // ── 5. Reputation update ──────────────────────────────────────────
  const previousRating = 4.2;
  const previousJobs = 15;
  const newRating = parseFloat(((previousRating * previousJobs + feedback.rating) / (previousJobs + 1)).toFixed(2));

  const reputationUpdate: ReputationUpdate = {
    providerId,
    providerName,
    isRegistered,
    previousRating,
    newRating: isRegistered ? newRating : previousRating,
    previousCompletedJobs: previousJobs,
    newCompletedJobs: isRegistered ? previousJobs + 1 : previousJobs,
    ratingUpdated: isRegistered,
    updateNote: isRegistered
      ? `Internal rating updated: ${previousRating} → ${newRating}. Jobs: ${previousJobs} → ${previousJobs + 1}.`
      : `Provider is not registered. Public reputation NOT modified. This rating is logged internally only.`,
  };

  // ── 6. Update registered provider profile ─────────────────────────
  if (isRegistered && providerId) {
    try {
      await db.collection('provider_profiles').doc(providerId).update({
        internalRating: newRating,
        completedJobs: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });
      safeLog.info('FollowUpService', `Provider ${providerId} metrics updated: rating=${newRating}`);
    } catch (err: any) {
      safeLog.error('FollowUpService', 'Failed to update provider profile', err);
      warnings.push('Provider profile metrics may not have been updated.');
    }
  }

  // ── 7. Future matching impact ─────────────────────────────────────
  const futureMatchingImpact: FutureMatchingImpact = {
    factors: [
      `Completed jobs increased: improves "data completeness" ranking factor.`,
      `Rating ${newRating} > 4.0: strong positive signal for future 12-factor scoring.`,
      `On-time arrival: no cancellation penalty — improves reliability score.`,
      isRegistered
        ? `Registered status maintained: full booking eligibility in future.`
        : `Provider still unregistered: cannot be booked until onboarded.`,
      `Customer recommendation: positive word-of-mouth signal for future matching.`,
    ],
    explanation: isRegistered
      ? `This positive completion strengthens ${providerName}'s position in future rankings. Their higher rating and job count will result in better scores across service_relevance, data_completeness, and registered_provider factors.`
      : `Although rated positively, ${providerName} cannot benefit from ranking improvements until they register on the platform. This feedback is stored internally for when they onboard.`,
  };

  // ── 8. Save timeline events to Firestore ──────────────────────────
  let firestoreSaved = false;
  try {
    const batch = db.batch();

    // Save each timeline event
    for (const event of timeline) {
      const ref = db.collection('follow_up_events').doc(event.eventId);
      batch.set(ref, {
        ...event,
        workflowId,
        bookingId,
        createdAt: Timestamp.now(),
      });
    }

    // Save checklist
    batch.set(db.collection('diagnosis_checklists').doc(`checklist_${bookingId}`), {
      workflowId,
      bookingId,
      serviceType,
      items: checklist,
      createdAt: Timestamp.now(),
    });

    // Save feedback
    batch.set(db.collection('service_feedback').doc(`feedback_${bookingId}`), {
      workflowId,
      bookingId,
      providerId,
      providerName,
      ...feedback,
      createdAt: Timestamp.now(),
    });

    // Save follow-up simulation log (does NOT change booking status)
    // The booking stays as 'pending_provider_confirmation' so providers
    // can Accept/Reject from the Provider Dashboard
    batch.set(db.collection('booking_events').doc(`evt_${bookingId}_followup_sim`), {
      bookingId,
      workflowId,
      eventType: 'followup_simulation_completed',
      description: `Follow-up simulation completed. Rating: ${feedback.rating}/5. Provider: ${providerName}. Booking status preserved for Provider Dashboard.`,
      simulatedStatus: 'completed',
      actualStatus: 'pending_provider_confirmation',
      actor: 'followup_agent_simulation',
      createdAt: Timestamp.now(),
    });

    await batch.commit();
    firestoreSaved = true;
    safeLog.info('FollowUpService', `Follow-up saved: ${timeline.length} events, checklist, feedback for ${bookingId}`);
  } catch (err: any) {
    safeLog.error('FollowUpService', 'Failed to save follow-up events', err);
    warnings.push('Follow-up events may not have been saved to Firestore.');
  }

  return {
    workflowId,
    bookingId,
    timeline,
    checklist,
    feedback,
    reputationUpdate,
    futureMatchingImpact,
    firestoreSaved,
    warnings,
  };
}

// ============================================================================
// Checklist Builder
// ============================================================================

function buildChecklist(serviceType: string): DiagnosisChecklistItem[] {
  const lower = serviceType.toLowerCase();

  if (lower.includes('ac') || lower.includes('air condition') || lower.includes('cooling')) {
    return [
      { item: 'Inspected AC unit', checked: true, note: 'Visual inspection completed' },
      { item: 'Checked power supply', checked: true, note: '220V confirmed, no voltage drops' },
      { item: 'Checked cooling output', checked: true, note: 'Weak cooling detected before repair' },
      { item: 'Checked refrigerant/gas level', checked: true, note: 'Gas pressure low — refilled R-410A' },
      { item: 'Checked compressor', checked: true, note: 'Compressor running normally' },
      { item: 'Checked air filter', checked: true, note: 'Filter was clogged — cleaned' },
      { item: 'Diagnosed root issue', checked: true, note: 'Low gas + dirty filter causing weak cooling' },
      { item: 'Shared repair estimate with customer', checked: true, note: 'PKR 2,500 for gas refill + cleaning' },
      { item: 'Customer approved work', checked: true, note: 'Verbal approval received' },
      { item: 'Work completed', checked: true, note: 'Gas refilled, filter cleaned, AC tested' },
      { item: 'Customer confirmed satisfaction', checked: true, note: 'Customer confirmed cooling restored' },
    ];
  }

  if (lower.includes('plumb')) {
    return [
      { item: 'Inspected plumbing area', checked: true, note: 'Leak identified under sink' },
      { item: 'Checked water pressure', checked: true, note: 'Pressure normal' },
      { item: 'Identified leak source', checked: true, note: 'Worn pipe joint' },
      { item: 'Shared repair estimate', checked: true, note: 'PKR 1,800 for joint replacement' },
      { item: 'Customer approved', checked: true, note: 'Approved' },
      { item: 'Work completed', checked: true, note: 'Joint replaced, tested for leaks' },
      { item: 'Customer confirmed', checked: true, note: 'No more leaks' },
    ];
  }

  if (lower.includes('electric')) {
    return [
      { item: 'Inspected electrical panel', checked: true, note: 'Panel inspected' },
      { item: 'Checked wiring', checked: true, note: 'Loose connection found' },
      { item: 'Tested circuits', checked: true, note: 'All circuits tested' },
      { item: 'Diagnosed issue', checked: true, note: 'Loose wire at breaker' },
      { item: 'Shared estimate', checked: true, note: 'PKR 1,200 for repair' },
      { item: 'Customer approved', checked: true, note: 'Approved' },
      { item: 'Work completed', checked: true, note: 'Wire secured, tested' },
      { item: 'Customer confirmed', checked: true, note: 'Power restored' },
    ];
  }

  // Generic fallback
  return [
    { item: 'Inspected issue area', checked: true, note: 'Initial inspection done' },
    { item: 'Diagnosed problem', checked: true, note: 'Issue identified' },
    { item: 'Shared estimate with customer', checked: true, note: 'Cost discussed' },
    { item: 'Customer approved', checked: true, note: 'Approved' },
    { item: 'Work completed', checked: true, note: 'Service completed' },
    { item: 'Customer confirmed satisfaction', checked: true, note: 'Customer satisfied' },
  ];
}
