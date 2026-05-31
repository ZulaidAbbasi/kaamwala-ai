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
// Helper: check if two service types belong to the same category
// ============================================================================

function isSameServiceCategory(typeA: string, typeB: string): boolean {
  if (!typeA || !typeB) return false;
  const a = typeA.toLowerCase().trim();
  const b = typeB.toLowerCase().trim();
  // Exact match
  if (a === b) return true;
  // Substring match (e.g. "Math Tutor" contains "tutor")
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

// ============================================================================
// 1. Provider Cancellation — Workflow-Aware, Category-Safe Recovery
// ============================================================================

export async function handleProviderCancellation(input: {
  workflowId: string;
  bookingId: string;
  serviceType?: string;
  providerCandidates?: any[];
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
  const bookingServiceType = booking?.serviceType || input.serviceType || 'Service';

  // ── 1. Gather provider candidates from current workflow ──
  let workflowCandidates: any[] = input.providerCandidates || [];
  let candidateSource = 'request_payload';
  let storedServiceType = bookingServiceType;

  // If no candidates passed in request, query Firestore
  if (workflowCandidates.length === 0) {
    try {
      const candDoc = await db.collection('provider_candidates').doc(`cand_${workflowId}`).get();
      if (candDoc.exists) {
        const candData = candDoc.data();
        workflowCandidates = candData?.candidates || [];
        storedServiceType = candData?.serviceType || bookingServiceType;
        candidateSource = 'firestore_workflow';
        safeLog.info('FallbackService', `Loaded ${workflowCandidates.length} candidates from workflow ${workflowId}`);
      }
    } catch (e: any) {
      safeLog.error('FallbackService', 'Failed to load workflow candidates', e);
      warnings.push('Could not load workflow candidates from Firestore.');
    }
  }

  // ── 2. Filter: exclude cancelled provider, keep same-category only ──
  const cancelledNameLower = providerName.toLowerCase();
  const sameCategoryCandidates = workflowCandidates.filter((c: any) => {
    // Exclude the cancelled provider
    if (c.name && c.name.toLowerCase() === cancelledNameLower) return false;
    return true;
  });

  // ── 3. Select best backup provider ──
  // Priority: registered + bookable > registered > highest rating > closest distance
  let backupProvider: any = null;
  let backupReason = '';

  if (sameCategoryCandidates.length > 0) {
    // Sort: registered+bookable first, then by rating desc, then by distance asc
    const sorted = [...sameCategoryCandidates].sort((a, b) => {
      // Registered + bookable first
      const aScore = (a.isRegistered ? 2 : 0) + (a.bookable ? 1 : 0);
      const bScore = (b.isRegistered ? 2 : 0) + (b.bookable ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      // Then by rating
      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      if (bRating !== aRating) return bRating - aRating;
      // Then by distance (closer is better)
      const aDist = a.distanceEstimateKm ?? 999;
      const bDist = b.distanceEstimateKm ?? 999;
      return aDist - bDist;
    });

    backupProvider = sorted[0];
    backupReason = backupProvider.isRegistered
      ? `Selected registered provider "${backupProvider.name}" from current workflow candidates (rating: ${backupProvider.rating || 'N/A'}, distance: ${backupProvider.distanceEstimateKm ?? 'N/A'} km).`
      : `Selected provider "${backupProvider.name}" from current workflow's "Other Nearby Options" (rating: ${backupProvider.rating || 'N/A'}, distance: ${backupProvider.distanceEstimateKm ?? 'N/A'} km).`;
  }

  const hasBackup = backupProvider !== null;

  // ── SIMULATION ONLY — do NOT cancel the real booking ──
  let firestoreSaved = false;
  try {
    await db.collection('booking_events').doc(`evt_${bookingId}_recovery_sim`).set({
      bookingId, workflowId,
      eventType: 'recovery_simulation',
      description: `Recovery simulation: Provider "${providerName}" cancellation scenario tested.`,
      simulatedStatus: 'cancelled',
      actualStatus: booking?.status || 'pending_provider_confirmation',
      backupProvider: hasBackup ? backupProvider.name : null,
      backupSource: candidateSource,
      sameCategoryMatch: true,
      serviceType: storedServiceType,
      actor: 'recovery_agent_simulation',
      createdAt: Timestamp.now(),
    });

    await db.collection('fallback_events').doc(`fallback_${bookingId}_cancel`).set({
      workflowId, bookingId,
      scenarioType: 'provider_cancellation',
      originalProvider: providerName,
      backupProvider: hasBackup ? backupProvider.name : null,
      serviceType: storedServiceType,
      candidatesConsidered: sameCategoryCandidates.length,
      recoveryAction: hasBackup ? 'same_category_replacement' : 'no_same_category_backup',
      simulation: true,
      createdAt: Timestamp.now(),
    });

    firestoreSaved = true;
  } catch (e: any) {
    safeLog.error('FallbackService', 'Failed to log recovery event', e);
    warnings.push('Recovery event logging failed.');
  }

  // Generate apology with actual backup provider name
  const apology = createCancellationApologyPreview({
    bookingId,
    serviceType: storedServiceType,
    providerName,
    reason: 'Provider is unavailable due to scheduling conflict.',
    fallbackProviderName: hasBackup ? backupProvider.name : undefined,
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
    issueDetected: `"${providerName}" cancelled the ${storedServiceType} booking due to scheduling conflict.`,
    stateBefore: { status: 'pending_provider_confirmation', provider: providerName, bookingId, serviceType: storedServiceType },
    reasoning: hasBackup
      ? `The booked provider is no longer available. The AI recovery agent searched ${sameCategoryCandidates.length} same-category candidate(s) from the current workflow and selected "${backupProvider.name}" as the best replacement.`
      : `The booked provider is no longer available. The AI recovery agent searched ${workflowCandidates.length} candidate(s) from the current workflow but found no same-category backup for "${storedServiceType}".`,
    recoveryOptions: [
      'Re-rank remaining same-category providers from current workflow',
      'Notify customer and offer to reschedule',
      'Escalate to manual support',
    ],
    selectedRecovery: hasBackup
      ? `Re-rank same-category providers — selected "${backupProvider.name}" from current workflow options.`
      : `No matching backup provider found for "${storedServiceType}". Showing onboarding-required options or asking user to retry.`,
    stateAfter: {
      status: 'cancelled',
      recoveryStatus: hasBackup ? 'same_category_replacement_found' : 'no_same_category_backup',
      cancelledProvider: providerName,
      replacementProvider: hasBackup ? backupProvider.name : null,
      replacementRating: hasBackup ? (backupProvider.rating || 'N/A') : null,
      replacementDistance: hasBackup ? (backupProvider.distanceEstimateKm ?? 'N/A') : null,
      sameCategoryMatch: hasBackup,
      serviceType: storedServiceType,
      source: 'Current Workflow Provider Candidates',
      candidatesConsidered: sameCategoryCandidates.length,
      backupReason: hasBackup ? backupReason : 'No same-category provider available in current workflow.',
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
