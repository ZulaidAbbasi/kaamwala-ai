// functions/src/agents/serviceOrchestrator.ts
// Central orchestrator — chains all agentic steps into one workflow
// Never crashes; returns partial results on failure with fallback recommendations

import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { parseServiceRequest } from '../services/gemini/geminiClient';
import { geocodeLocation } from '../services/maps/geocodingService';
import { searchNearbyProviders } from '../services/maps/placesService';
import { listRegisteredProviders, matchDiscoveredToRegisteredProvider } from '../services/providerService';
import { rankProviders } from '../services/rankingService';
import { estimatePrice } from '../services/pricingService';
import { createBooking } from '../services/bookingService';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';

import { matchServiceFromText, isVagueServiceType, canonicalizeServiceType } from '../services/serviceTaxonomy';


// ============================================================================
// Types
// ============================================================================

export interface OrchestratorInput {
  rawText: string;
  customerUid?: string;
  mode: 'full' | 'step_by_step';
}

export interface OrchestratorResult {
  success: boolean;
  workflowId: string;
  completedSteps: string[];
  failedStep: string | null;
  parsedRequest: any | null;
  providerCandidates: any[];
  rankedProviders: any[];
  selectedProvider: any | null;
  priceEstimate: any | null;
  bookingResult: any | null;
  outcomeEvaluation: any | null;
  traces: TraceSummary[];
  warnings: string[];
  latencyMs: number;
}

// ============================================================================
// Main Orchestrator
// ============================================================================

export async function runWorkflow(input: OrchestratorInput): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const workflowId = `wf_${uuid().substring(0, 12)}`;
  const customerUid = input.customerUid || `anon_${uuid().substring(0, 8)}`;
  const traces: TraceSummary[] = [];
  const warnings: string[] = [];
  const completedSteps: string[] = [];
  let failedStep: string | null = null;

  let parsedRequest: any = null;
  let providerCandidates: any[] = [];
  let rankedProviders: any[] = [];
  let selectedProvider: any = null;
  let priceEstimate: any = null;
  let bookingResult: any = null;

  // ── STEP 1: Parse Request ─────────────────────────────────────────
  const t1 = await logTrace({
    workflowId, agentName: 'Orchestrator', phase: 'observation',
    observation: `Workflow started. Input: ${input.rawText.substring(0, 80)}...`,
    reasoningSummary: 'Will chain: parse → discover → rank → price → book.',
    decision: 'Begin with NLU parsing.',
    actionTaken: 'workflow_started', toolUsed: 'none',
    confidence: 1.0, latencyMs: 0,
  });
  traces.push(t1);

  try {
    const geminiResult = await parseServiceRequest(input.rawText);
    parsedRequest = geminiResult.parsed;

    // Post-parse: fix "Other" or vague service types using taxonomy
    const originalType = parsedRequest.serviceType;
    if (isVagueServiceType(originalType)) {
      const taxonomyMatch = matchServiceFromText(input.rawText);
      if (taxonomyMatch) {
        parsedRequest.serviceType = taxonomyMatch;
        warnings.push(`Corrected "${originalType}" → "${taxonomyMatch}" via taxonomy.`);
      }
    } else {
      const canonical = canonicalizeServiceType(originalType);
      if (canonical !== originalType) {
        parsedRequest.serviceType = canonical;
      }
    }

    // Save to Firestore
    const requestId = `req_${uuid().substring(0, 8)}`;
    await db.collection('service_requests').doc(requestId).set({
      requestId, workflowId, customerUid,
      rawText: input.rawText,
      serviceType: parsedRequest.serviceType,
      issueDescription: parsedRequest.issueDescription,
      locationArea: parsedRequest.locationText,
      urgency: parsedRequest.urgency,
      budgetSensitivity: parsedRequest.budgetSensitivity,
      confidenceScore: parsedRequest.confidenceScore,
      normalizedSummary: parsedRequest.normalizedEnglishSummary,
      source: geminiResult.source,
      status: 'parsed',
      createdAt: Timestamp.now(),
    }).catch(() => warnings.push('service_request save may have failed.'));

    completedSteps.push('parseRequest');

    if (geminiResult.source === 'fallback') {
      warnings.push('Gemini unavailable — used keyword fallback parser.');
    }

    const t1r = await logTrace({
      workflowId, agentName: 'NLU_Agent', phase: 'understanding',
      observation: `Parsed: ${parsedRequest.serviceType} in ${parsedRequest.locationText || 'unknown'}`,
      reasoningSummary: parsedRequest.normalizedEnglishSummary,
      decision: `Confidence: ${parsedRequest.confidenceScore}. Source: ${geminiResult.source}.`,
      actionTaken: 'parse_complete', toolUsed: geminiResult.source === 'gemini' ? 'gemini_api' : 'keyword_fallback',
      confidence: parsedRequest.confidenceScore, latencyMs: geminiResult.latencyMs,
    });
    traces.push(t1r);
  } catch (err: any) {
    failedStep = 'parseRequest';
    warnings.push(`Parse failed: ${err.message}`);
    safeLog.error('Orchestrator', 'Step 1 failed', err);
  }

  if (!parsedRequest || failedStep) {
    return buildResult(workflowId, startTime, completedSteps, failedStep, parsedRequest, providerCandidates, rankedProviders, selectedProvider, priceEstimate, bookingResult, traces, warnings);
  }

  // ── Quality gate: reject vague service types ──────────────────────
  if (isVagueServiceType(parsedRequest.serviceType)) {
    warnings.push('Service type could not be identified. Please specify what service you need (e.g., AC repair, plumber, car wash, electrician).');
    parsedRequest.clarificationQuestion = 'What specific service do you need? Examples: AC repair, plumber, electrician, car wash, beautician, tutor, painter, carpenter.';
    parsedRequest.missingFields = [...(parsedRequest.missingFields || []), 'serviceType'];

    const clarifyTrace = await logTrace({
      workflowId, agentName: 'NLU_Agent', phase: 'decision',
      observation: `Service type is vague: "${parsedRequest.serviceType}". Cannot search Google Places safely.`,
      reasoningSummary: 'Vague service request would return random unrelated providers. Requesting clarification.',
      decision: 'Skip discovery. Ask user to specify service type.',
      actionTaken: 'clarification_requested', toolUsed: 'none',
      confidence: 0.2, latencyMs: Date.now() - startTime,
    });
    traces.push(clarifyTrace);

    return buildResult(workflowId, startTime, completedSteps, 'clarification_needed', parsedRequest, providerCandidates, rankedProviders, selectedProvider, priceEstimate, bookingResult, traces, warnings);
  }
  // ── STEP 2: Discover Providers ────────────────────────────────────
  try {
    const locationText = parsedRequest.locationText || 'Islamabad';

    // Geocode
    let geocodeResult: any = null;
    try {
      geocodeResult = await geocodeLocation(locationText);
    } catch {
      warnings.push('Geocoding failed — proceeding without coordinates.');
    }

    // Places search
    let placesResults: any[] = [];
    try {
      const placesSearchResult = await searchNearbyProviders(
        parsedRequest.serviceType, locationText,
        geocodeResult?.coordinates ? geocodeResult.coordinates : undefined,
      );
      placesResults = placesSearchResult.places || [];
    } catch {
      warnings.push('Google Places search failed — using registered providers only.');
    }

    // Get registered providers
    let registeredProviders: any[] = [];
    try {
      registeredProviders = await listRegisteredProviders(
        parsedRequest.serviceType?.toLowerCase().replace(/\s+/g, '_'),
        locationText,
      );
    } catch {
      warnings.push('Registered provider lookup failed.');
    }

    // Merge candidates
    const candidates: any[] = [];

    for (const rp of registeredProviders) {
      // Calculate Haversine distance if coordinates available
      let distKm: number | null = null;
      let travelMin: number | null = null;
      if (rp.geo && geocodeResult?.location?.lat) {
        const dLat = (rp.geo.lat - geocodeResult.location.lat) * Math.PI / 180;
        const dLon = (rp.geo.lng - geocodeResult.location.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(geocodeResult.location.lat * Math.PI / 180) * Math.cos(rp.geo.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        distKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
        travelMin = Math.round(distKm * 3);
      }

      // Check availability
      const now = new Date();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      const hour = now.getHours();
      const availDays = rp.availability?.days || [];
      const availSlots = rp.availability?.timeSlots || [];
      let isOpen: boolean | null = null;
      if (availDays.length > 0) {
        const dayMatch = availDays.includes(dayName);
        if (dayMatch) {
          if (hour < 12 && availSlots.includes('morning')) isOpen = true;
          else if (hour >= 12 && hour < 17 && availSlots.includes('afternoon')) isOpen = true;
          else if (hour >= 17 && availSlots.includes('evening')) isOpen = true;
          else isOpen = false;
        } else {
          isOpen = false;
        }
      }

      candidates.push({
        candidateId: rp.providerId,
        providerId: rp.providerId,
        name: rp.businessName,
        source: rp.source || 'registered',
        isRegistered: true,
        bookable: true,
        bookingEligible: true,
        bookingStatus: 'available',
        rating: rp.internalRating || null,
        reviewCount: rp.completedJobs || 0,
        address: rp.locationArea.toLowerCase().includes('islamabad') ? rp.locationArea : `${rp.locationArea}, Islamabad`,
        location: rp.geo || null,
        distanceEstimateKm: distKm,
        travelTimeEstimateMinutes: travelMin,
        openNow: isOpen,
        businessStatus: 'OPERATIONAL',
        serviceCategories: rp.serviceCategories,
        categories: rp.serviceCategories,
        phoneNumber: rp.contactPhone || null,
        websiteUri: null,
        googleMapsUri: rp.geo ? `https://www.google.com/maps/search/?api=1&query=${rp.geo.lat},${rp.geo.lng}` : null,
        statusLabel: 'KaamWala Provider',
        confidence: 0.9,
        rawDataSummary: {
          source: 'provider_profiles',
          providerId: rp.providerId,
          baseVisitFee: rp.baseVisitFee,
          availability: rp.availability,
          completedJobs: rp.completedJobs,
          internalRating: rp.internalRating,
          verified: rp.verified,
        },
      });
    }

    for (const place of placesResults) {
      const matchResult = await matchDiscoveredToRegisteredProvider(
        place.placeId || null, place.name || '', null,
      ).catch(() => null);

      if (!matchResult) {
        candidates.push({
          candidateId: `gp_${place.placeId || uuid().substring(0, 8)}`,
          name: place.name || 'Unknown',
          source: 'google_places',
          isRegistered: false,
          bookable: false,
          bookingEligible: false,
          bookingStatus: 'onboarding_required',
          rating: place.rating || null,
          reviewCount: place.userRatingCount || 0,
          address: place.formattedAddress || '',
          location: place.location || null,
          placeId: place.placeId,
          openNow: place.openNow ?? null,
          phoneNumber: place.phoneNumber || null,
          websiteUri: place.websiteUri || null,
          googleMapsUri: place.googleMapsUri || (place.placeId ? `https://www.google.com/maps/place/?q=place_id:${place.placeId}` : null),
          distanceEstimateKm: null,
          travelTimeEstimateMinutes: null,
          statusLabel: 'Google Places',
          confidence: 0.7,
          rawDataSummary: place,
        });
      }
    }

    providerCandidates = candidates;
    completedSteps.push('discoverProviders');

    const t2 = await logTrace({
      workflowId, agentName: 'Discovery_Agent', phase: 'tool_call',
      observation: `Found ${candidates.length} candidates (${registeredProviders.length} registered, ${placesResults.length} Places).`,
      reasoningSummary: `Geocode: ${geocodeResult ? 'success' : 'failed'}.`,
      decision: candidates.length > 0 ? 'Proceed to ranking.' : 'No candidates — fallback needed.',
      actionTaken: 'discovery_complete', toolUsed: 'google_places_api',
      confidence: candidates.length > 0 ? 0.85 : 0.2,
      latencyMs: Date.now() - startTime,
    });
    traces.push(t2);
  } catch (err: any) {
    failedStep = 'discoverProviders';
    warnings.push(`Discovery failed: ${err.message}`);
    safeLog.error('Orchestrator', 'Step 2 failed', err);
  }

  if (failedStep || providerCandidates.length === 0) {
    if (!failedStep) warnings.push('No providers found for this service/location.');
    return buildResult(workflowId, startTime, completedSteps, failedStep || 'discoverProviders', parsedRequest, providerCandidates, rankedProviders, selectedProvider, priceEstimate, bookingResult, traces, warnings);
  }

  // ── STEP 3: Rank Providers ────────────────────────────────────────
  try {
    const rankResult = rankProviders(providerCandidates, {
      serviceType: parsedRequest.serviceType,
      urgency: parsedRequest.urgency || 'standard',
      budgetSensitivity: parsedRequest.budgetSensitivity || 'moderate',
      locationText: parsedRequest.locationText || 'Islamabad',
    });

    rankedProviders = rankResult.rankedProviders || [];
    selectedProvider = rankResult.selectedProvider || rankedProviders[0] || null;
    completedSteps.push('rankProviders');

    const t3 = await logTrace({
      workflowId, agentName: 'Ranking_Agent', phase: 'reasoning',
      observation: `Ranked ${rankedProviders.length} providers. Top: "${selectedProvider?.name}".`,
      reasoningSummary: `12-factor scoring. Selected: ${selectedProvider?.name} (${selectedProvider?.isRegistered ? 'registered' : 'unregistered'}).`,
      decision: selectedProvider?.bookingEligible ? 'Provider is booking-eligible.' : 'Selected provider requires onboarding.',
      actionTaken: 'ranking_complete', toolUsed: 'ranking_engine',
      confidence: 0.85, latencyMs: Date.now() - startTime,
    });
    traces.push(t3);
  } catch (err: any) {
    failedStep = 'rankProviders';
    warnings.push(`Ranking failed: ${err.message}`);
    selectedProvider = providerCandidates[0] || null;
    completedSteps.push('rankProviders_fallback');
    safeLog.error('Orchestrator', 'Step 3 failed, using first candidate', err);
  }

  if (!selectedProvider) {
    return buildResult(workflowId, startTime, completedSteps, 'rankProviders', parsedRequest, providerCandidates, rankedProviders, selectedProvider, priceEstimate, bookingResult, traces, warnings);
  }

  // ── STEP 4: Estimate Price ────────────────────────────────────────
  try {
    const estimateResult = estimatePrice({
      serviceType: parsedRequest.serviceType,
      issueDescription: parsedRequest.issueDescription,
      urgency: parsedRequest.urgency || 'standard',
      budgetSensitivity: parsedRequest.budgetSensitivity || 'moderate',
      preferredTimeWindow: parsedRequest.preferredTimeWindow,
      distanceKm: selectedProvider.distanceEstimateKm || null,
      isRegistered: selectedProvider.isRegistered ?? false,
      providerBaseVisitFee: selectedProvider.rawDataSummary?.baseVisitFee || null,
      providerRating: selectedProvider.rating || null,
      providerName: selectedProvider.name,
    });

    priceEstimate = estimateResult;
    completedSteps.push('estimatePrice');

    const t4 = await logTrace({
      workflowId, agentName: 'Pricing_Agent', phase: 'decision',
      observation: `Price estimate: ${estimateResult.currency} ${estimateResult.recommendedEstimate}.`,
      reasoningSummary: `Range: ${estimateResult.currency} ${estimateResult.estimateLow}–${estimateResult.estimateHigh}.`,
      decision: 'Price estimated. Proceed to booking.',
      actionTaken: 'pricing_complete', toolUsed: 'pricing_engine',
      confidence: 0.8, latencyMs: Date.now() - startTime,
    });
    traces.push(t4);
  } catch (err: any) {
    warnings.push(`Pricing failed: ${err.message}. Using default estimate.`);
    priceEstimate = { estimateLow: 1500, estimateHigh: 5000, recommendedEstimate: 3000, currency: 'PKR' };
    completedSteps.push('estimatePrice_fallback');
    safeLog.error('Orchestrator', 'Step 4 failed, using default', err);
  }

  // ── STEP 5: Create Booking ────────────────────────────────────────
  try {
    bookingResult = await createBooking({
      workflowId,
      customerUid,
      selectedProvider,
      parsedRequest,
      priceEstimate,
    });
    completedSteps.push('createBooking');

    const t5 = await logTrace({
      workflowId, agentName: 'Booking_Agent', phase: 'action',
      observation: `Booking created: ${bookingResult.bookingId}. Status: ${bookingResult.status}.`,
      reasoningSummary: `Provider: ${bookingResult.providerName}. Real booking: ${bookingResult.isRealBooking}.`,
      decision: bookingResult.isRealBooking ? 'Real booking confirmed.' : 'Onboarding required — informational booking.',
      actionTaken: 'booking_complete', toolUsed: 'firestore',
      confidence: 0.95, latencyMs: Date.now() - startTime,
      stateBefore: { status: 'priced' },
      stateAfter: { status: bookingResult.status, bookingId: bookingResult.bookingId },
    });
    traces.push(t5);
  } catch (err: any) {
    failedStep = 'createBooking';
    warnings.push(`Booking failed: ${err.message}`);
    safeLog.error('Orchestrator', 'Step 5 failed', err);
  }

  // ── STEP 6: Outcome Evaluation ────────────────────────────────────
  const outcomeEvaluation = {
    workflowComplete: !failedStep,
    stepsCompleted: completedSteps.length,
    totalSteps: 5,
    providerType: selectedProvider?.isRegistered ? 'registered' : 'google_places',
    bookingStatus: bookingResult?.status || 'not_created',
    isRealBooking: bookingResult?.isRealBooking ?? false,
    confidenceScore: parsedRequest?.confidenceScore ?? 0,
    priceRange: priceEstimate ? `${priceEstimate.currency} ${priceEstimate.estimateLow}–${priceEstimate.estimateHigh}` : 'N/A',
    traceCount: traces.length,
    warningCount: warnings.length,
    totalLatencyMs: Date.now() - startTime,
    recommendation: buildRecommendation(bookingResult, selectedProvider),
  };

  const tFinal = await logTrace({
    workflowId, agentName: 'Orchestrator', phase: 'evaluation',
    observation: `Workflow ${failedStep ? 'partial' : 'complete'}. ${completedSteps.length}/5 steps.`,
    reasoningSummary: outcomeEvaluation.recommendation,
    decision: failedStep ? `Failed at: ${failedStep}. Partial result returned.` : 'All steps completed successfully.',
    actionTaken: 'workflow_evaluated', toolUsed: 'none',
    confidence: failedStep ? 0.5 : 0.95,
    latencyMs: Date.now() - startTime,
    stateBefore: { rawText: input.rawText.substring(0, 50) },
    stateAfter: { status: bookingResult?.status || 'incomplete', steps: completedSteps.length },
  });
  traces.push(tFinal);

  // Save workflow summary
  try {
    await db.collection('workflow_summaries').doc(workflowId).set({
      workflowId, customerUid,
      rawText: input.rawText.substring(0, 200),
      mode: input.mode,
      completedSteps,
      failedStep,
      serviceType: parsedRequest?.serviceType,
      providerName: selectedProvider?.name,
      bookingId: bookingResult?.bookingId || null,
      bookingStatus: bookingResult?.status || null,
      traceCount: traces.length,
      warningCount: warnings.length,
      totalLatencyMs: Date.now() - startTime,
      createdAt: Timestamp.now(),
    });
  } catch {
    warnings.push('Workflow summary save may have failed.');
  }

  return {
    success: !failedStep,
    workflowId,
    completedSteps,
    failedStep,
    parsedRequest,
    providerCandidates,
    rankedProviders,
    selectedProvider,
    priceEstimate,
    bookingResult,
    outcomeEvaluation,
    traces,
    warnings,
    latencyMs: Date.now() - startTime,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function buildResult(
  workflowId: string, startTime: number,
  completedSteps: string[], failedStep: string | null,
  parsedRequest: any, providerCandidates: any[], rankedProviders: any[],
  selectedProvider: any, priceEstimate: any, bookingResult: any,
  traces: TraceSummary[], warnings: string[],
): OrchestratorResult {
  return {
    success: false,
    workflowId, completedSteps, failedStep,
    parsedRequest, providerCandidates, rankedProviders,
    selectedProvider, priceEstimate, bookingResult,
    outcomeEvaluation: {
      workflowComplete: false,
      stepsCompleted: completedSteps.length,
      failedAt: failedStep,
      recommendation: `Workflow stopped at ${failedStep}. ${warnings[warnings.length - 1] || ''}`,
    },
    traces, warnings,
    latencyMs: Date.now() - startTime,
  };
}

function buildRecommendation(booking: any, provider: any): string {
  if (!booking) return 'Booking was not created. Review earlier steps for failures.';
  if (booking.isRealBooking) return `Real booking created for registered provider "${provider?.name}". In production, provider would receive a notification.`;
  return `Discovery booking logged. "${provider?.name}" is not registered — onboarding required before real service dispatch.`;
}
