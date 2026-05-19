// functions/src/endpoints/discoverProviders.ts
// POST /discoverProviders — Find real nearby service providers
// Uses Google Places, Geocoding, and Distance Matrix APIs
// Never invents providers or fabricates availability data

import { Request, Response } from 'express';
import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { geocodeLocation } from '../services/maps/geocodingService';
import { searchNearbyProviders, normalizeGooglePlaceToProviderCandidate } from '../services/maps/placesService';
import { batchEstimateDistances } from '../services/maps/distanceService';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';
import { ProviderCandidate } from '../types/provider';


/**
 * POST /discoverProviders
 *
 * Input:  { workflowId, parsedRequest: { serviceType, locationText, urgency, budgetSensitivity } }
 * Output: { success, workflowId, geocoded, candidates[], query, totalFound, sources, traces, warnings, latencyMs }
 */
export async function handleDiscoverProviders(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, parsedRequest } = req.body;

  // ── 1. Validate input ─────────────────────────────────────────────
  if (!workflowId || typeof workflowId !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_WORKFLOW_ID', message: 'workflowId is required.' },
    });
    return;
  }

  if (!parsedRequest || !parsedRequest.serviceType) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARSED_REQUEST', message: 'parsedRequest with serviceType is required.' },
    });
    return;
  }

  const { serviceType, locationText, urgency, budgetSensitivity } = parsedRequest;
  const directCoords = req.body.coordinates; // { lat, lng } from GPS
  const locationSource = req.body.locationSource || 'text';
  const traces: TraceSummary[] = [];
  const warnings: string[] = [];

  safeLog.info('DiscoverProviders', `Starting discovery for workflow ${workflowId}: ${serviceType} near ${locationText || 'unknown'} (source: ${locationSource})`);

  // ── 2. Log trace: observation ─────────────────────────────────────
  const observeTrace = await logTrace({
    workflowId,
    agentName: 'Discovery_Agent',
    phase: 'observation',
    observation: `Received discovery request for "${serviceType}" near "${locationText || 'unknown location'}" (location source: ${locationSource}).`,
    reasoningSummary: 'Will geocode location, search Google Places, and estimate distances.',
    decision: 'Proceed with provider discovery pipeline.',
    actionTaken: 'discovery_started',
    toolUsed: 'none',
    confidence: 1.0,
    inputSummary: { serviceType, locationText, urgency, budgetSensitivity, locationSource },
    latencyMs: 0,
  });
  traces.push(observeTrace);

  // ── 3. Resolve location ───────────────────────────────────────────
  let geocoded = { lat: 0, lng: 0, formattedAddress: locationText || '' };
  let geocodeWarnings: string[] = [];

  if (directCoords && directCoords.lat && directCoords.lng) {
    // GPS coordinates provided directly — skip geocoding
    geocoded = {
      lat: directCoords.lat,
      lng: directCoords.lng,
      formattedAddress: locationText || 'Phone GPS location',
    };
    safeLog.info('DiscoverProviders', `Using direct GPS coordinates: ${directCoords.lat.toFixed(4)}, ${directCoords.lng.toFixed(4)}`);

    const geoTrace = await logTrace({
      workflowId,
      agentName: 'Discovery_Agent',
      phase: 'tool_call',
      observation: `Using direct GPS coordinates from device (${directCoords.lat.toFixed(4)}, ${directCoords.lng.toFixed(4)}).`,
      reasoningSummary: 'GPS coordinates received from mobile device. Skipping geocoding.',
      decision: `Using GPS: ${directCoords.lat.toFixed(4)}, ${directCoords.lng.toFixed(4)}.`,
      actionTaken: 'gps_coordinates_used',
      toolUsed: 'device_gps',
      toolResultSummary: `GPS: ${directCoords.lat.toFixed(4)}, ${directCoords.lng.toFixed(4)}. Source: phone.`,
      confidence: 0.95,
      latencyMs: 0,
      estimatedCost: 'N/A',
      warnings: [],
    });
    traces.push(geoTrace);
  } else if (locationText) {
    const geoResult = await geocodeLocation(locationText);

    geocoded = {
      lat: geoResult.location.lat,
      lng: geoResult.location.lng,
      formattedAddress: geoResult.location.formattedAddress,
    };
    geocodeWarnings = geoResult.location.warnings;

    const geoTrace = await logTrace({
      workflowId,
      agentName: 'Discovery_Agent',
      phase: 'tool_call',
      observation: `Geocoding "${locationText}" to coordinates.`,
      reasoningSummary: `Source: ${geoResult.source}. Confidence: ${geoResult.location.confidence}.`,
      decision: geoResult.location.lat !== 0
        ? `Geocoded to ${geoResult.location.lat.toFixed(4)}, ${geoResult.location.lng.toFixed(4)}.`
        : 'Geocoding failed — will search without location bias.',
      actionTaken: 'geocode_complete',
      toolUsed: 'geocoding_api',
      toolResultSummary: `Address: ${geoResult.location.formattedAddress}. Confidence: ${geoResult.location.confidence}.`,
      confidence: geoResult.location.confidence === 'high' ? 0.95 : geoResult.location.confidence === 'medium' ? 0.75 : 0.4,
      latencyMs: geoResult.latencyMs,
      estimatedCost: geoResult.source === 'geocoding_api' ? '~0.005 USD' : 'N/A',
      warnings: geocodeWarnings,
    });
    traces.push(geoTrace);
  } else {
    warnings.push('No location provided — searching without location bias.');
  }

  if (geocodeWarnings.length > 0) {
    warnings.push(...geocodeWarnings);
  }

  // ── 4. Search Google Places ───────────────────────────────────────
  const location = geocoded.lat !== 0 ? { lat: geocoded.lat, lng: geocoded.lng } : undefined;
  const searchArea = locationText || (directCoords ? 'nearby' : 'Islamabad');
  const placesResult = await searchNearbyProviders(serviceType, searchArea, location);

  const placesTrace = await logTrace({
    workflowId,
    agentName: 'Discovery_Agent',
    phase: 'tool_call',
    observation: `Searching Google Places for "${placesResult.query}".`,
    reasoningSummary: `Found ${placesResult.totalFound} results from ${placesResult.source}.`,
    decision: placesResult.totalFound > 0
      ? `Processing ${placesResult.totalFound} Google Places results.`
      : 'No results from Google Places — will check registered providers only.',
    actionTaken: 'places_search_complete',
    toolUsed: 'google_places_api',
    toolResultSummary: `Query: "${placesResult.query}". Found: ${placesResult.totalFound}. Source: ${placesResult.source}.`,
    confidence: placesResult.totalFound > 0 ? 0.85 : 0.3,
    latencyMs: placesResult.latencyMs,
    estimatedCost: placesResult.source !== 'fallback_empty' ? '~0.032 USD' : 'N/A',
    warnings: placesResult.warnings,
  });
  traces.push(placesTrace);

  if (placesResult.warnings.length > 0) {
    warnings.push(...placesResult.warnings);
  }

  // ── 5. Estimate distances ─────────────────────────────────────────
  let distanceMap = new Map<number, { distanceKm: number; durationMinutes: number }>();

  if (geocoded.lat !== 0 && placesResult.places.length > 0) {
    const destinations = placesResult.places
      .filter((p) => p.location.lat !== 0)
      .map((p) => p.location);

    if (destinations.length > 0) {
      const rawDistances = await batchEstimateDistances(
        { lat: geocoded.lat, lng: geocoded.lng },
        destinations
      );

      // Map back by index
      let destIdx = 0;
      for (let i = 0; i < placesResult.places.length; i++) {
        if (placesResult.places[i].location.lat !== 0) {
          const dist = rawDistances.get(destIdx);
          if (dist) {
            distanceMap.set(i, {
              distanceKm: Math.round((dist.distanceMeters / 1000) * 10) / 10,
              durationMinutes: Math.round(dist.durationSeconds / 60),
            });
          }
          destIdx++;
        }
      }

      safeLog.info('DiscoverProviders', `Distance estimates: ${distanceMap.size}/${placesResult.places.length} successful`);
    }
  } else {
    warnings.push('Distance estimates unavailable — geocoding failed or no Places results.');
  }

  // ── 6. Normalize candidates ───────────────────────────────────────
  const candidates: ProviderCandidate[] = placesResult.places.map((place, index) => {
    const dist = distanceMap.get(index);
    return normalizeGooglePlaceToProviderCandidate(place, dist ? {
      distanceKm: dist.distanceKm,
      durationMinutes: dist.durationMinutes,
    } : undefined);
  });

  // ── 7. Check registered providers ─────────────────────────────────
  let registeredCount = 0;
  try {
    const serviceCategory = serviceType.toLowerCase().replace(/\s+/g, '_');
    // Query our provider_profiles for matching category
    const registeredSnap = await db.collection('provider_profiles')
      .where('active', '==', true)
      .where('serviceCategories', 'array-contains', serviceCategory)
      .get();

    // Also try with simpler category matching
    let allRegistered = registeredSnap.docs;
    if (allRegistered.length === 0) {
      // Try broader match — service categories often use short names
      const broadSnap = await db.collection('provider_profiles')
        .where('active', '==', true)
        .get();

      allRegistered = broadSnap.docs.filter((doc) => {
        const cats = doc.data().serviceCategories || [];
        const lowerType = serviceType.toLowerCase();
        return cats.some((c: string) =>
          lowerType.includes(c) || c.includes(lowerType.split(' ')[0].toLowerCase())
        );
      });
    }

    for (const doc of allRegistered) {
      const reg = doc.data();
      registeredCount++;

      // Check if this registered provider matches any Google Place
      const matchIdx = candidates.findIndex(
        (c) => c.placeId && reg.placeId && c.placeId === reg.placeId
      );

      if (matchIdx >= 0) {
        // Upgrade existing candidate
        candidates[matchIdx].isRegistered = true;
        candidates[matchIdx].bookable = true;
        candidates[matchIdx].providerId = reg.providerId;
        candidates[matchIdx].statusLabel = 'Verified KaamWala Provider';
        candidates[matchIdx].source = 'registered_provider';
        // Enrich with registered data if Google data is missing
        if (!candidates[matchIdx].rating && reg.internalRating) {
          candidates[matchIdx].rating = reg.internalRating;
        }
        if (!candidates[matchIdx].reviewCount && reg.completedJobs) {
          candidates[matchIdx].reviewCount = reg.completedJobs;
        }
        if ((!candidates[matchIdx].address || candidates[matchIdx].address === '') && reg.locationArea) {
          candidates[matchIdx].address = reg.locationArea;
        }
      } else {
        // Add as separate registered candidate
        // Calculate Haversine distance for registered providers
        let regDistanceKm: number | null = null;
        let regTravelMinutes: number | null = null;
        if (reg.geo && geocoded.lat !== 0) {
          const dLat = (reg.geo.lat - geocoded.lat) * Math.PI / 180;
          const dLon = (reg.geo.lng - geocoded.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(geocoded.lat * Math.PI / 180) * Math.cos(reg.geo.lat * Math.PI / 180) *
                    Math.sin(dLon / 2) ** 2;
          regDistanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
          regTravelMinutes = Math.round(regDistanceKm * 3); // ~20km/h average in city
        }

        // ── Distance threshold: skip registered providers too far from user ──
        // If the user's location is known and the provider is > 50km away,
        // it doesn't make sense to recommend them (e.g. Islamabad provider for Multan user)
        const MAX_REGISTERED_DISTANCE_KM = 50;
        if (regDistanceKm !== null && regDistanceKm > MAX_REGISTERED_DISTANCE_KM) {
          safeLog.info('DiscoverProviders', `Skipping registered provider "${reg.businessName}" — ${regDistanceKm} km away (max ${MAX_REGISTERED_DISTANCE_KM} km)`);
          warnings.push(`Registered provider "${reg.businessName}" excluded — ${regDistanceKm} km away from your location.`);
          continue;
        }

        // Check if provider is likely open now based on availability
        const now = new Date();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
        const hour = now.getHours();
        const availDays = reg.availability?.days || [];
        const availSlots = reg.availability?.timeSlots || [];
        let isOpenNow: boolean | null = null;
        if (availDays.length > 0) {
          const isDayMatch = availDays.includes(dayName);
          if (isDayMatch) {
            if (hour < 12 && availSlots.includes('morning')) isOpenNow = true;
            else if (hour >= 12 && hour < 17 && availSlots.includes('afternoon')) isOpenNow = true;
            else if (hour >= 17 && availSlots.includes('evening')) isOpenNow = true;
            else isOpenNow = false;
          } else {
            isOpenNow = false;
          }
        }

        candidates.push({
          candidateId: `cand_${uuid().substring(0, 8)}`,
          source: 'registered_provider',
          placeId: reg.placeId || null,
          providerId: reg.providerId,
          name: reg.businessName,
          address: reg.locationArea || 'Service area',
          location: reg.geo || null,
          rating: reg.internalRating || null,
          reviewCount: reg.completedJobs || null,
          openNow: isOpenNow,
          businessStatus: 'OPERATIONAL',
          categories: reg.serviceCategories || [],
          distanceEstimateKm: regDistanceKm,
          travelTimeEstimateMinutes: regTravelMinutes,
          isRegistered: true,
          bookable: true,
          statusLabel: 'KaamWala Provider',
          missingFields: [],
          dataWarnings: [],
          confidence: 0.9,
          phoneNumber: reg.contactPhone || null,
          websiteUri: null,
          googleMapsUri: reg.geo ? `https://www.google.com/maps/search/?api=1&query=${reg.geo.lat},${reg.geo.lng}` : null,
          rawDataSummary: {
            source: 'provider_profiles',
            providerId: reg.providerId,
            baseVisitFee: reg.baseVisitFee,
            availability: reg.availability,
            completedJobs: reg.completedJobs,
            internalRating: reg.internalRating,
            verified: reg.verified,
          },
        });
      }
    }
  } catch (err: any) {
    safeLog.error('DiscoverProviders', 'Failed to query registered providers', err);
    warnings.push('Could not check registered providers — Firestore query failed.');
  }

  // ── 8. Save to Firestore ──────────────────────────────────────────
  const docId = `cand_${workflowId}`;
  try {
    await db.collection('provider_candidates').doc(docId).set({
      workflowId,
      geocoded,
      query: placesResult.query,
      totalGoogleResults: placesResult.totalFound,
      totalRegisteredResults: registeredCount,
      totalCandidates: candidates.length,
      candidates: candidates.map((c) => ({
        candidateId: c.candidateId,
        source: c.source,
        name: c.name,
        isRegistered: c.isRegistered,
        bookable: c.bookable,
        statusLabel: c.statusLabel,
        rating: c.rating,
        distanceEstimateKm: c.distanceEstimateKm,
      })),
      createdAt: Timestamp.now(),
    });
    safeLog.info('DiscoverProviders', `Saved ${candidates.length} candidates for workflow ${workflowId}`);
  } catch (err: any) {
    safeLog.error('DiscoverProviders', 'Failed to save candidates', err);
    warnings.push('Candidate summary saved with warnings.');
  }

  // ── 9. Log trace: result ──────────────────────────────────────────
  const googleCount = candidates.filter((c) => c.source === 'google_places').length;
  const regCount = candidates.filter((c) => c.source === 'registered_provider').length;
  const bookableCount = candidates.filter((c) => c.bookable).length;

  const resultTrace = await logTrace({
    workflowId,
    agentName: 'Discovery_Agent',
    phase: 'result',
    observation: `Discovery complete. ${candidates.length} total candidates found.`,
    reasoningSummary: `${googleCount} from Google Places (not bookable), ${regCount} registered providers (${bookableCount} bookable).`,
    decision: candidates.length > 0
      ? 'Candidates ready for ranking.'
      : 'No candidates found — suggest broadening search.',
    actionTaken: 'discovery_complete',
    toolUsed: 'google_places_api + geocoding_api + distance_matrix_api + firestore',
    toolResultSummary: `Total: ${candidates.length}. Google: ${googleCount}. Registered: ${regCount}. Bookable: ${bookableCount}. Distances: ${distanceMap.size} calculated.`,
    confidence: candidates.length > 0 ? 0.85 : 0.3,
    latencyMs: Date.now() - startTime,
    estimatedCost: '~0.04 USD',
    stateBefore: { status: 'parsed' },
    stateAfter: { status: 'discovered', candidateCount: candidates.length },
  });
  traces.push(resultTrace);

  // ── 10. Return response ───────────────────────────────────────────
  const totalLatency = Date.now() - startTime;
  safeLog.apiCall('POST', '/discoverProviders', 200, totalLatency);

  res.json({
    success: true,
    workflowId,
    geocoded,
    query: placesResult.query,
    candidates,
    totalFound: candidates.length,
    sources: {
      googlePlaces: googleCount,
      registered: regCount,
      bookable: bookableCount,
    },
    traces,
    warnings,
    latencyMs: totalLatency,
  });
}
