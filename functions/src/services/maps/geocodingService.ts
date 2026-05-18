// functions/src/services/maps/geocodingService.ts
// Google Geocoding API — converts area names to coordinates

import { mapsGet } from './mapsClient';
import { GeocodedLocation, GeocodingApiResult } from '../../types/maps';
import { safeLog } from '../../utils/safeLogger';

interface GeocodingApiResponse {
  results: GeocodingApiResult[];
  status: string;
}

/**
 * Geocode a location text string to coordinates.
 *
 * Input: "G-13 Islamabad" or "DHA Phase 5 Lahore"
 * Output: { lat, lng, formattedAddress, confidence, warnings }
 *
 * If the API fails, returns a degraded response with zero coords and a warning.
 */
export async function geocodeLocation(locationText: string): Promise<{
  location: GeocodedLocation;
  source: 'geocoding_api' | 'fallback';
  latencyMs: number;
}> {
  if (!locationText || locationText.trim().length === 0) {
    return {
      location: {
        lat: 0,
        lng: 0,
        formattedAddress: '',
        confidence: 'low',
        warnings: ['No location text provided'],
      },
      source: 'fallback',
      latencyMs: 0,
    };
  }

  // Ensure Pakistan context for better results
  const query = locationText.toLowerCase().includes('pakistan')
    ? locationText
    : `${locationText}, Pakistan`;

  const result = await mapsGet<GeocodingApiResponse>(
    '/geocode/json',
    { address: query },
    'geocodeLocation'
  );

  if (!result) {
    safeLog.warn('GeocodingService', `API failed for "${locationText}", returning degraded response`);
    return {
      location: {
        lat: 0,
        lng: 0,
        formattedAddress: locationText,
        confidence: 'low',
        warnings: ['Geocoding API unavailable — location not resolved'],
      },
      source: 'fallback',
      latencyMs: 0,
    };
  }

  const { data, latencyMs } = result;

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    safeLog.warn('GeocodingService', `No results for "${locationText}", status: ${data.status}`);
    return {
      location: {
        lat: 0,
        lng: 0,
        formattedAddress: locationText,
        confidence: 'low',
        warnings: [`Geocoding returned: ${data.status}`],
      },
      source: 'geocoding_api',
      latencyMs,
    };
  }

  const top = data.results[0];
  const locationType = top.geometry.location_type;

  // Map Google's location_type to our confidence levels
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (locationType === 'ROOFTOP' || locationType === 'RANGE_INTERPOLATED') {
    confidence = 'high';
  } else if (locationType === 'GEOMETRIC_CENTER') {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const warnings: string[] = [];
  if (data.results.length > 1) {
    warnings.push(`${data.results.length} possible locations found, using best match`);
  }

  return {
    location: {
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
      formattedAddress: top.formatted_address,
      placeId: top.place_id,
      confidence,
      warnings,
    },
    source: 'geocoding_api',
    latencyMs,
  };
}
