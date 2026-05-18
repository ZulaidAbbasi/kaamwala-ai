// functions/src/services/maps/distanceService.ts
// Distance estimation using Google Distance Matrix API
// Falls back to haversine straight-line distance if API fails

import { mapsGet } from './mapsClient';
import { safeLog } from '../../utils/safeLogger';

interface LatLng {
  lat: number;
  lng: number;
}

interface DistanceEstimate {
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
}

interface DistanceResult {
  estimate: DistanceEstimate | null;
  source: 'distance_matrix_api' | 'haversine_fallback';
  latencyMs: number;
}

/**
 * Estimate distance between two points using Google Distance Matrix API.
 * Falls back to haversine calculation if API fails.
 */
export async function estimateDistance(
  origin: LatLng,
  destination: LatLng,
): Promise<DistanceResult> {
  const start = Date.now();

  try {
    const result = await mapsGet<any>(
      '/distancematrix/json',
      {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        units: 'metric',
      },
      'DistanceMatrix',
    );

    if (result?.data?.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = result.data.rows[0].elements[0];
      return {
        estimate: {
          distanceMeters: element.distance.value,
          durationSeconds: element.duration.value,
          distanceText: element.distance.text,
          durationText: element.duration.text,
        },
        source: 'distance_matrix_api',
        latencyMs: result.latencyMs,
      };
    }

    safeLog.warn('DistanceService', 'Distance Matrix returned non-OK status, falling back to haversine');
  } catch (err: any) {
    safeLog.error('DistanceService', 'Distance Matrix API failed', err);
  }

  // Fallback: haversine straight-line distance
  const distKm = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const distMeters = Math.round(distKm * 1000);
  // Rough driving estimate: 1.4x straight-line, 30 km/h average in urban Pakistan
  const drivingMeters = Math.round(distMeters * 1.4);
  const drivingSeconds = Math.round((drivingMeters / 1000) / 30 * 3600);

  return {
    estimate: {
      distanceMeters: drivingMeters,
      durationSeconds: drivingSeconds,
      distanceText: `${(drivingMeters / 1000).toFixed(1)} km (est.)`,
      durationText: `${Math.round(drivingSeconds / 60)} min (est.)`,
    },
    source: 'haversine_fallback',
    latencyMs: Date.now() - start,
  };
}

/**
 * Batch estimate distances from one origin to multiple destinations.
 * Returns a Map of destination index → { distanceMeters, durationSeconds }.
 */
export async function batchEstimateDistances(
  origin: LatLng,
  destinations: LatLng[],
): Promise<Map<number, { distanceMeters: number; durationSeconds: number }>> {
  const resultMap = new Map<number, { distanceMeters: number; durationSeconds: number }>();

  if (destinations.length === 0) return resultMap;

  const start = Date.now();

  try {
    const destStr = destinations.map((d) => `${d.lat},${d.lng}`).join('|');

    const result = await mapsGet<any>(
      '/distancematrix/json',
      {
        origins: `${origin.lat},${origin.lng}`,
        destinations: destStr,
        mode: 'driving',
        units: 'metric',
      },
      'BatchDistanceMatrix',
    );

    if (result?.data?.rows?.[0]?.elements) {
      const elements = result.data.rows[0].elements;
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].status === 'OK') {
          resultMap.set(i, {
            distanceMeters: elements[i].distance.value,
            durationSeconds: elements[i].duration.value,
          });
        }
      }
      safeLog.info('DistanceService', `Batch distance: ${resultMap.size}/${destinations.length} successful in ${result.latencyMs}ms`);
      return resultMap;
    }
  } catch (err: any) {
    safeLog.error('DistanceService', 'Batch Distance Matrix failed, using haversine fallback', err);
  }

  // Fallback: haversine for all
  for (let i = 0; i < destinations.length; i++) {
    const distKm = haversineDistance(origin.lat, origin.lng, destinations[i].lat, destinations[i].lng);
    const drivingMeters = Math.round(distKm * 1000 * 1.4);
    const drivingSeconds = Math.round((drivingMeters / 1000) / 30 * 3600);
    resultMap.set(i, { distanceMeters: drivingMeters, durationSeconds: drivingSeconds });
  }

  safeLog.info('DistanceService', `Batch distance fallback: ${resultMap.size} haversine estimates in ${Date.now() - start}ms`);
  return resultMap;
}

/**
 * Haversine distance between two points in km.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
