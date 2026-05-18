// functions/src/services/maps/mapsClient.ts
// Shared HTTP client for all Google Maps API calls
// API key is read from env — never exposed, never logged

import { getEnvConfig } from '../../config/env';
import { safeLog } from '../../utils/safeLogger';

const MAPS_BASE = 'https://maps.googleapis.com/maps/api';
const PLACES_NEW_BASE = 'https://places.googleapis.com/v1';

/**
 * Get the Maps API key from environment.
 * Throws if not configured.
 */
export function getMapsApiKey(): string {
  const config = getEnvConfig();
  if (!config.googleMapsApiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }
  return config.googleMapsApiKey;
}

/**
 * Make a GET request to Google Maps REST API.
 * Appends API key automatically.
 */
export async function mapsGet<T>(
  path: string,
  params: Record<string, string>,
  context: string
): Promise<{ data: T; latencyMs: number } | null> {
  const start = Date.now();

  try {
    const apiKey = getMapsApiKey();
    const url = new URL(`${MAPS_BASE}${path}`);
    url.searchParams.set('key', apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const response = await fetch(url.toString());
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      safeLog.error('MapsClient', `${context} HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as T;
    safeLog.info('MapsClient', `${context} completed in ${latencyMs}ms`);
    return { data, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    safeLog.error('MapsClient', `${context} failed after ${latencyMs}ms`, err);
    return null;
  }
}

/**
 * Make a POST request to Google Places API (New).
 * Uses X-Goog-Api-Key header instead of query param.
 */
export async function placesPost<T>(
  path: string,
  body: Record<string, any>,
  fieldMask: string,
  context: string
): Promise<{ data: T; latencyMs: number } | null> {
  const start = Date.now();

  try {
    const apiKey = getMapsApiKey();
    const url = `${PLACES_NEW_BASE}${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      safeLog.error('MapsClient', `${context} HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = (await response.json()) as T;
    safeLog.info('MapsClient', `${context} completed in ${latencyMs}ms`);
    return { data, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    safeLog.error('MapsClient', `${context} failed after ${latencyMs}ms`, err);
    return null;
  }
}
