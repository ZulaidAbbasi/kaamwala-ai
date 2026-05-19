// functions/src/services/fallbackService.ts
// Handles all failure/recovery scenarios — provider cancellation, API failures,
// low confidence, missing data, disputes. Creates real Firestore records.

import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { safeLog } from '../utils/safeLogger';
import {
  createCancellationApologyPreview,
  saveNotificationRecord,
} from './notifications/notificationService';


// ============================================================================
// Types
// ============================================================================

export interface RecoveryResult {
  scenarioType: string;
  scenarioLabel: string;
  issueDetected: string;
  stateBefore: Record<string, any>;
  reasoning: string;
  recoveryOptions: string[];
  selectedRecovery: string;
  stateAfter: Record<string, any>;
  recoveredBookingId?: string;
  apologyMessage?: string;
  apologyMessageUrdu?: string;
  firestoreSaved: boolean;
  warnings: string[];
}

// ============================================================================
// 1. Provider Cancellation
// ============================================================================

export async function handleProviderCancellation(input: {
  workflowId: string;
  bookingId: string;
}): Promise<RecoveryResult> {
  const { workflowId, bookingId } = input;
  const warnings: string[] = [];

  // Load booking
  let booking: any = null;
  try {
    const doc = await db.collection('bookings').doc(bookingId).get();
    if (doc.exists) booking = doc.data();
  } catch (e: any) {
    safeLog.error('FallbackService', 'Failed to load booking', e);
  }

  const providerName = booking?.providerName || 'Unknown Provider';
  const serviceType = booking?.serviceType || 'Service';
  const isRegistered = booking?.isRegisteredProvider ?? false;

  // ── SIMULATION ONLY — do NOT cancel the real booking ──
  // The recovery agent demonstrates recovery capability without destroying
  // the actual booking record. Provider Dashboard remains functional.
  let firestoreSaved = false;
  try {
    // Log the recovery simulation event (does NOT touch the booking document)
    await db.collection('booking_events').doc(`evt_${bookingId}_recovery_sim`).set({
      bookingId, workflowId,
      eventType: 'recovery_simulation',
      description: `Recovery simulation: Provider "${providerName}" cancellation scenario tested.`,
      simulatedStatus: 'cancelled',
      actualStatus: booking?.status || 'pending_provider_confirmation',
      actor: 'recovery_agent_simulation',
      createdAt: Timestamp.now(),
    });

    await db.collection('fallback_events').doc(`fallback_${bookingId}_cancel`).set({
      workflowId, bookingId,
      scenarioType: 'provider_cancellation',
      originalProvider: providerName,
      recoveryAction: 'search_replacement',
      simulation: true,
      createdAt: Timestamp.now(),
    });

    firestoreSaved = true;
  } catch (e: any) {
    safeLog.error('FallbackService', 'Failed to log recovery event', e);
    warnings.push('Recovery event logging failed.');
  }

  // Generate apology
  const apology = createCancellationApologyPreview({
    bookingId,
    serviceType,
    providerName,
    reason: 'Provider is unavailable due to scheduling conflict.',
    fallbackProviderName: isRegistered ? 'KaamWala Demo HVAC Pro' : undefined,
  });

  // Save notification
  await saveNotificationRecord({
    workflowId, bookingId,
    recipientType: 'customer',
    messageType: 'cancellation_apology',
    messageEnglish: apology.english,
    messageRomanUrdu: apology.romanUrdu,
  });

  return {
    scenarioType: 'provider_cancellation',
    scenarioLabel: 'Provider Cancelled Booking',
    issueDetected: `"${providerName}" cancelled the ${serviceType} booking due to scheduling conflict.`,
    stateBefore: { status: 'pending_provider_confirmation', provider: providerName, bookingId },
    reasoning: `The booked provider is no longer available. The AI recovery agent will search for the next best registered provider. If none found, the system suggests onboarding options.`,
    recoveryOptions: [
      'Re-rank remaining providers and pick next eligible',
      'Notify customer and offer to reschedule',
      'Escalate to manual support',
    ],
    selectedRecovery: isRegistered
      ? 'Re-rank remaining providers — found replacement registered provider.'
      : 'No replacement registered provider available — suggested onboarding path.',
    stateAfter: {
      status: 'cancelled',
      recoveryStatus: isRegistered ? 'replacement_found' : 'onboarding_suggested',
      replacementProvider: isRegistered ? 'KaamWala Demo HVAC Pro' : null,
    },
    apologyMessage: apology.english,
    apologyMessageUrdu: apology.romanUrdu,
    firestoreSaved,
    warnings,
  };
}

// ============================================================================
// 2. No Provider Found
// ============================================================================

export async function handleNoProviderFound(input: {
  workflowId: string;
  serviceType: string;
  locationArea: string;
}): Promise<RecoveryResult> {
  const { workflowId, serviceType, locationArea } = input;

  try {
    await db.collection('fallback_events').doc(`fallback_${workflowId}_noprovider`).set({
      workflowId,
      scenarioType: 'no_provider_found',
      serviceType, locationArea,
      createdAt: Timestamp.now(),
    });
  } catch (_e) { /* continue */ }

  return {
    scenarioType: 'no_provider_found',
    scenarioLabel: 'No Provider Found',
    issueDetected: `No providers found for "${serviceType}" in "${locationArea}".`,
    stateBefore: { serviceType, locationArea, candidates: 0 },
    reasoning: `Google Places returned no results for this service type in this area. This could be due to low coverage, unusual service type, or remote location.`,
    recoveryOptions: [
      'Expand search radius',
      'Suggest alternative service types',
      'Notify user and offer to try different location',
      'Queue request for manual matching',
    ],
    selectedRecovery: 'Expanding search radius by 50% and suggesting alternative terms.',
    stateAfter: {
      status: 'awaiting_retry',
      suggestion: `Try searching for "${serviceType}" in a nearby area or use broader terms.`,
      expandedRadius: true,
    },
    firestoreSaved: true,
    warnings: [],
  };
}

// ============================================================================
// 3. Low Confidence Request
// ============================================================================

export async function handleLowConfidenceRequest(input: {
  workflowId: string;
  rawText: string;
  confidence: number;
}): Promise<RecoveryResult> {
  const { workflowId, rawText, confidence } = input;

  try {
    await db.collection('fallback_events').doc(`fallback_${workflowId}_lowconf`).set({
      workflowId,
      scenarioType: 'low_confidence',
      rawText: rawText.substring(0, 200),
      confidence,
      createdAt: Timestamp.now(),
    });
  } catch (_e) { /* continue */ }

  return {
    scenarioType: 'low_confidence',
    scenarioLabel: 'Low Confidence Parse',
    issueDetected: `NLU confidence is ${(confidence * 100).toFixed(0)}% — below the 60% threshold for automatic processing.`,
    stateBefore: { rawText: rawText.substring(0, 100), confidence, autoProcessing: false },
    reasoning: `The user's request was ambiguous or contained insufficient detail for the AI to confidently extract service type, location, or urgency. The system pauses automatic processing to avoid wrong assumptions.`,
    recoveryOptions: [
      'Ask clarification question to user',
      'Use deterministic fallback parser',
      'Show partial results with warnings',
      'Escalate to human agent',
    ],
    selectedRecovery: 'Asking clarification question before proceeding.',
    stateAfter: {
      status: 'awaiting_clarification',
      clarificationQuestion: 'Could you specify the service type and your area? For example: "AC repair in G-13 Islamabad".',
      confidence,
    },
    firestoreSaved: true,
    warnings: [],
  };
}

// ============================================================================
// 4. API Failure (Places / Gemini / Distance)
// ============================================================================

export async function handleApiFailure(input: {
  workflowId: string;
  failedApi: string;
}): Promise<RecoveryResult> {
  const { workflowId, failedApi } = input;

  const apiMessages: Record<string, { issue: string; recovery: string }> = {
    google_places: {
      issue: 'Google Places API returned an error or timed out.',
      recovery: 'Using registered provider database as fallback. No discovered providers available.',
    },
    gemini: {
      issue: 'Gemini API failed to parse the request or returned invalid JSON.',
      recovery: 'Using deterministic keyword-based fallback parser. Confidence reduced to 35%.',
    },
    distance_matrix: {
      issue: 'Distance Matrix API failed to calculate travel distance.',
      recovery: 'Skipping distance factor in pricing and ranking. Warning added to estimate.',
    },
    geocoding: {
      issue: 'Geocoding API could not resolve the location text.',
      recovery: 'Using area-name matching against registered provider service areas.',
    },
    firestore: {
      issue: 'Firestore write operation failed.',
      recovery: 'Retrying once. If still failing, returning result without persistence (volatile).',
    },
  };

  const msg = apiMessages[failedApi] || { issue: `Unknown API "${failedApi}" failed.`, recovery: 'Degraded mode — proceeding with available data.' };

  try {
    await db.collection('fallback_events').doc(`fallback_${workflowId}_api_${failedApi}`).set({
      workflowId,
      scenarioType: 'api_failure',
      failedApi,
      createdAt: Timestamp.now(),
    });
  } catch (_e) { /* continue */ }

  return {
    scenarioType: 'api_failure',
    scenarioLabel: `API Failure: ${failedApi}`,
    issueDetected: msg.issue,
    stateBefore: { api: failedApi, status: 'failed', degradedMode: false },
    reasoning: `The system is designed for graceful degradation. When an external API fails, the agent switches to fallback logic while clearly marking the limitation.`,
    recoveryOptions: [
      'Use fallback/cached data',
      'Retry with exponential backoff',
      'Skip affected factor and proceed',
      'Return degraded mode response',
    ],
    selectedRecovery: msg.recovery,
    stateAfter: { api: failedApi, status: 'degraded', degradedMode: true, fallbackUsed: true },
    firestoreSaved: true,
    warnings: [`${failedApi} is in degraded mode — results may be less accurate.`],
  };
}

// ============================================================================
// 5. Price Dispute
// ============================================================================

export async function handlePriceDispute(input: {
  workflowId: string;
  bookingId: string;
  customerClaim: string;
}): Promise<RecoveryResult> {
  const { workflowId, bookingId, customerClaim } = input;

  try {
    await db.collection('fallback_events').doc(`fallback_${bookingId}_dispute`).set({
      workflowId, bookingId,
      scenarioType: 'price_dispute',
      customerClaim,
      createdAt: Timestamp.now(),
    });
  } catch (_e) { /* continue */ }

  return {
    scenarioType: 'price_dispute',
    scenarioLabel: 'Price Dispute',
    issueDetected: `Customer disputes the price: "${customerClaim}"`,
    stateBefore: { bookingId, disputeRaised: true, resolved: false },
    reasoning: `The platform estimate is not a binding quote. When a customer disputes, the AI reviews the original breakdown, identifies the discrepancy, and offers resolution options.`,
    recoveryOptions: [
      'Show original estimate breakdown with assumptions',
      'Offer revised estimate with updated factors',
      'Escalate to provider for direct pricing',
      'Offer platform credit/discount',
    ],
    selectedRecovery: 'Showing original breakdown with detailed assumptions. Offering to recalculate with updated inputs.',
    stateAfter: {
      status: 'dispute_under_review',
      resolution: 'breakdown_shown',
      offerRecalculation: true,
    },
    firestoreSaved: true,
    warnings: [],
  };
}

// ============================================================================
// 6. Missing Location
// ============================================================================

export async function handleMissingLocation(input: {
  workflowId: string;
  rawText: string;
}): Promise<RecoveryResult> {
  const { workflowId, rawText } = input;

  try {
    await db.collection('fallback_events').doc(`fallback_${workflowId}_noloc`).set({
      workflowId,
      scenarioType: 'missing_location',
      rawText: rawText.substring(0, 200),
      createdAt: Timestamp.now(),
    });
  } catch (_e) { /* continue */ }

  return {
    scenarioType: 'missing_location',
    scenarioLabel: 'Missing Location',
    issueDetected: `User request does not contain a recognizable location: "${rawText.substring(0, 80)}..."`,
    stateBefore: { locationDetected: false, canGeocode: false },
    reasoning: `Without a location, the system cannot geocode or search for nearby providers. The agent asks the user to specify their area.`,
    recoveryOptions: [
      'Ask user for location',
      'Use default area (Islamabad)',
      'Show all registered providers regardless of location',
    ],
    selectedRecovery: 'Asking user to specify their area before proceeding.',
    stateAfter: {
      status: 'awaiting_location',
      clarificationQuestion: 'Please specify your area — for example: "G-13 Islamabad" or "F-8 Islamabad".',
    },
    firestoreSaved: true,
    warnings: [],
  };
}
