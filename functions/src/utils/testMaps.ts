// functions/src/utils/testMaps.ts
// Test helper for Google Maps/Places services
// Run: cd functions && npm run build && node lib/utils/testMaps.js
//
// Requires GOOGLE_MAPS_API_KEY in functions/.env
// This file is NOT deployed — local development tool only.

import { normalizeGooglePlaceToProviderCandidate } from '../services/maps/placesService';
import { GooglePlaceResult } from '../types/maps';

/**
 * Test queries to validate provider discovery.
 */
export const TEST_QUERIES = [
  { serviceType: 'AC repair', location: 'G-13 Islamabad' },
  { serviceType: 'electrician', location: 'F-10 Islamabad' },
  { serviceType: 'plumber', location: 'DHA Lahore' },
];

/**
 * Mock Google Places data for testing normalization without API calls.
 */
const MOCK_PLACES: GooglePlaceResult[] = [
  {
    placeId: 'ChIJ_mock_ac_01',
    name: 'Cool Tech AC Services',
    formattedAddress: 'G-13/1, Islamabad, Pakistan',
    location: { lat: 33.6310, lng: 73.0271 },
    rating: 4.2,
    userRatingCount: 45,
    businessStatus: 'OPERATIONAL',
    openNow: true,
    types: ['point_of_interest', 'establishment'],
  },
  {
    placeId: 'ChIJ_mock_ac_02',
    name: 'Islamabad AC & Refrigeration',
    formattedAddress: 'G-13/4, Islamabad, Pakistan',
    location: { lat: 33.6320, lng: 73.0280 },
    rating: 3.8,
    userRatingCount: 12,
    businessStatus: 'OPERATIONAL',
    openNow: undefined, // Unknown
    types: ['point_of_interest'],
  },
  {
    placeId: 'ChIJ_mock_ac_03',
    name: 'Pakistan Cooling Solutions',
    formattedAddress: 'G-12, Islamabad, Pakistan',
    location: { lat: 33.6400, lng: 73.0200 },
    // No rating — will be marked as missing
    businessStatus: 'OPERATIONAL',
    types: ['establishment'],
  },
];

/**
 * Test the normalization function without API calls.
 */
export function testNormalization(): void {
  console.log('=== KaamWala AI — Provider Normalization Test ===\n');

  for (const place of MOCK_PLACES) {
    const candidate = normalizeGooglePlaceToProviderCandidate(place, {
      distanceKm: Math.random() * 5,
      durationMinutes: Math.random() * 15,
    });

    console.log(`--- ${place.name} ---`);
    console.log(`  Source: ${candidate.source}`);
    console.log(`  Rating: ${candidate.rating ?? 'UNKNOWN'}`);
    console.log(`  Reviews: ${candidate.reviewCount ?? 'UNKNOWN'}`);
    console.log(`  Open Now: ${candidate.openNow ?? 'UNKNOWN'}`);
    console.log(`  Bookable: ${candidate.bookable}`);
    console.log(`  Status: ${candidate.statusLabel}`);
    console.log(`  Confidence: ${candidate.confidence}`);
    console.log(`  Missing: ${candidate.missingFields.join(', ') || 'none'}`);
    console.log(`  Warnings: ${candidate.dataWarnings.join(', ') || 'none'}`);
    console.log('');
  }
}

/**
 * Print test queries that would be sent to the API.
 * Does NOT call the API — just shows what would be searched.
 */
export function printTestQueries(): void {
  console.log('=== Test Queries (for manual API testing) ===\n');
  for (const q of TEST_QUERIES) {
    console.log(`Query: "${q.serviceType} near ${q.location}"`);
  }
  console.log('\nTo test with real API, call searchNearbyProviders() with GOOGLE_MAPS_API_KEY configured.');
}

// Run if executed directly
if (require.main === module) {
  testNormalization();
  console.log('---\n');
  printTestQueries();
}
