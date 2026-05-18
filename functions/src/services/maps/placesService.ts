// functions/src/services/maps/placesService.ts
// Google Places API (New) — searches for real nearby service providers
// Never invents data. Missing fields are marked honestly.

import { placesPost, mapsGet } from './mapsClient';
import { GooglePlaceResult, PlacesSearchResult } from '../../types/maps';
import { ProviderCandidate } from '../../types/provider';
import { safeLog } from '../../utils/safeLogger';
import { v4 as uuid } from 'uuid';
import { getSearchQueryForService, scoreProviderRelevance, isVagueServiceType } from '../serviceTaxonomy';

// ============================================================================
// Places API (New) — Text Search
// ============================================================================

interface PlacesNewSearchResponse {
  places?: PlacesNewPlace[];
}

interface PlacesNewPlace {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: { openNow?: boolean };
  businessStatus?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
}

const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.currentOpeningHours',
  'places.businessStatus',
  'places.types',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.primaryType',
].join(',');

/**
 * Search for nearby service providers using Places API (New) Text Search.
 * Uses taxonomy-based search queries and post-search relevance filtering.
 */
export async function searchNearbyProviders(
  serviceType: string,
  locationText: string,
  location?: { lat: number; lng: number },
  radiusMeters: number = 5000
): Promise<PlacesSearchResult> {
  // Use taxonomy to get the best search query
  const searchQuery = getSearchQueryForService(serviceType);
  
  // Guard against vague/useless queries
  const effectiveQuery = isVagueServiceType(serviceType) ? 'service' : searchQuery;
  const query = location ? effectiveQuery : `${effectiveQuery} near ${locationText}`;
  const start = Date.now();

  safeLog.info('PlacesService', `Search query: "${query}" (serviceType: "${serviceType}", taxonomyQuery: "${searchQuery}")`);

  // Build request body for Places API (New) Text Search
  const body: Record<string, any> = {
    textQuery: query,
    languageCode: 'en',
    maxResultCount: 10,
  };

  // Add location bias if coordinates available
  if (location && location.lat !== 0 && location.lng !== 0) {
    body.locationBias = {
      circle: {
        center: { latitude: location.lat, longitude: location.lng },
        radius: radiusMeters,
      },
    };
  }

  const result = await placesPost<PlacesNewSearchResponse>(
    '/places:searchText',
    body,
    PLACES_FIELD_MASK,
    `searchProviders("${query}")`
  );

  const latencyMs = Date.now() - start;

  if (!result || !result.data.places || result.data.places.length === 0) {
    safeLog.warn('PlacesService', `No results for "${query}"`);
    return {
      places: [],
      totalFound: 0,
      query,
      source: result ? 'places_api_new' : 'fallback_empty',
      latencyMs,
      warnings: result ? ['No places found for query'] : ['Places API unavailable'],
    };
  }

  const rawPlaces: GooglePlaceResult[] = result.data.places.map((p) => ({
    placeId: p.id,
    name: p.displayName?.text || 'Unknown',
    formattedAddress: p.formattedAddress || '',
    location: p.location
      ? { lat: p.location.latitude, lng: p.location.longitude }
      : { lat: 0, lng: 0 },
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    businessStatus: p.businessStatus,
    openNow: p.currentOpeningHours?.openNow,
    types: p.types,
    phoneNumber: p.nationalPhoneNumber || p.internationalPhoneNumber,
    websiteUri: p.websiteUri,
    googleMapsUri: p.googleMapsUri,
  }));

  // ── Post-search relevance filtering ────────────────────────────────
  const warnings: string[] = [];
  const filtered: GooglePlaceResult[] = [];
  let rejectedCount = 0;

  for (const place of rawPlaces) {
    const rel = scoreProviderRelevance(place.name, place.types || [], serviceType);
    if (rel.relevant) {
      filtered.push(place);
    } else {
      rejectedCount++;
      safeLog.info('PlacesService', `Rejected irrelevant: "${place.name}" — ${rel.reason}`);
    }
  }

  if (rejectedCount > 0) {
    warnings.push(`Filtered out ${rejectedCount} irrelevant results (e.g., dental for car wash)`);
  }

  if (filtered.length === 0 && rawPlaces.length > 0) {
    // If ALL results were filtered out, keep top 3 with warning
    warnings.push('All Google Places results were irrelevant to the service type. Showing best available.');
    filtered.push(...rawPlaces.slice(0, 3));
  }

  return {
    places: filtered,
    totalFound: filtered.length,
    query,
    source: 'places_api_new',
    latencyMs: result.latencyMs,
    warnings,
  };
}

/**
 * Get detailed place information by Place ID.
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
  const result = await placesPost<PlacesNewPlace>(
    '',
    {},
    PLACES_FIELD_MASK.replace(/places\./g, ''),
    `getPlaceDetails(${placeId})`
  );

  // For Place Details (New), we use a GET to the place resource
  const detailResult = await mapsGet<any>(
    '/place/details/json',
    { place_id: placeId, fields: 'name,formatted_address,geometry,rating,user_ratings_total,opening_hours,business_status,types,formatted_phone_number,website' },
    `getPlaceDetails(${placeId})`
  );

  if (!detailResult || !detailResult.data.result) {
    safeLog.warn('PlacesService', `No details for placeId: ${placeId}`);
    return null;
  }

  const r = detailResult.data.result;
  return {
    placeId,
    name: r.name || 'Unknown',
    formattedAddress: r.formatted_address || '',
    location: r.geometry?.location || { lat: 0, lng: 0 },
    rating: r.rating,
    userRatingCount: r.user_ratings_total,
    businessStatus: r.business_status,
    openNow: r.opening_hours?.open_now,
    types: r.types,
    phoneNumber: r.formatted_phone_number,
    websiteUri: r.website,
  };
}

// ============================================================================
// Normalize Google Place → ProviderCandidate
// ============================================================================

/**
 * Convert a Google Places result to our normalized ProviderCandidate.
 * NEVER invents missing data — marks it honestly.
 */
export function normalizeGooglePlaceToProviderCandidate(
  place: GooglePlaceResult,
  distance?: { distanceKm: number; durationMinutes: number }
): ProviderCandidate {
  const missingFields: string[] = [];
  const dataWarnings: string[] = [];

  if (place.rating === undefined || place.rating === null) {
    missingFields.push('rating');
    dataWarnings.push('Rating not available from Google Places');
  }

  if (place.userRatingCount === undefined || place.userRatingCount === null) {
    missingFields.push('reviewCount');
    dataWarnings.push('Review count not available');
  }

  if (place.openNow === undefined || place.openNow === null) {
    missingFields.push('openNow');
    dataWarnings.push('Opening hours not available');
  }

  if (!place.phoneNumber) {
    missingFields.push('phoneNumber');
  }

  if (!distance) {
    missingFields.push('distanceEstimate');
    dataWarnings.push('Distance could not be calculated');
  }

  // Calculate confidence based on data completeness
  const totalFields = 6;
  const presentFields = totalFields - missingFields.length;
  const confidence = Math.round((presentFields / totalFields) * 100) / 100;

  return {
    candidateId: `cand_${uuid().substring(0, 8)}`,
    source: 'google_places',
    placeId: place.placeId,
    providerId: null,
    name: place.name,
    address: place.formattedAddress,
    location: place.location.lat !== 0 ? place.location : null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    openNow: place.openNow ?? null,
    businessStatus: place.businessStatus || 'UNKNOWN',
    categories: place.types || [],
    distanceEstimateKm: distance?.distanceKm ?? null,
    travelTimeEstimateMinutes: distance?.durationMinutes ?? null,
    isRegistered: false,
    bookable: false,
    statusLabel: 'Discovered — onboarding required',
    missingFields,
    dataWarnings,
    confidence,
    phoneNumber: place.phoneNumber || null,
    websiteUri: place.websiteUri || null,
    googleMapsUri: place.googleMapsUri || null,
    rawDataSummary: {
      placeId: place.placeId,
      source: 'Google Places API',
      fieldsPresent: presentFields,
      fieldsTotal: totalFields,
    },
  };
}
