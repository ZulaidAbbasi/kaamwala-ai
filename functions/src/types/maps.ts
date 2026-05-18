// functions/src/types/maps.ts
// Type definitions for Google Maps API responses and internal map data

/**
 * Geocoded location result.
 */
export interface GeocodedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId?: string;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

/**
 * Distance/duration estimate between two points.
 */
export interface DistanceEstimate {
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
  mode: 'driving';
  warnings: string[];
}

/**
 * Raw Google Places result — subset of fields we use.
 */
export interface GooglePlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  openNow?: boolean;
  types?: string[];
  phoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
}

/**
 * Google Places API response container.
 */
export interface PlacesSearchResult {
  places: GooglePlaceResult[];
  totalFound: number;
  query: string;
  source: 'places_api_new' | 'places_api_legacy' | 'fallback_empty';
  latencyMs: number;
  warnings: string[];
}

/**
 * Geocoding API raw response types.
 */
export interface GeocodingApiResult {
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
    location_type: string;
  };
  place_id: string;
  types: string[];
}
