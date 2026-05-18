# KaamWala AI — Data Schema Reference

**Last Updated:** 2026-05-16

---

## TypeScript Type Locations

| Type | File | Layer |
|------|------|-------|
| `ProviderCandidate` | `functions/src/types/provider.ts` | Backend |
| `RegisteredProvider` | `functions/src/types/provider.ts` | Backend |
| `GeocodedLocation` | `functions/src/types/maps.ts` | Backend |
| `DistanceEstimate` | `functions/src/types/maps.ts` | Backend |
| `GooglePlaceResult` | `functions/src/types/maps.ts` | Backend |
| `PlacesSearchResult` | `functions/src/types/maps.ts` | Backend |
| `ParsedServiceRequest` | `functions/src/services/gemini/geminiSchemas.ts` | Backend |
| `RankingExplanation` | `functions/src/services/gemini/geminiSchemas.ts` | Backend |
| `AgentTrace` | `functions/src/types/agentTrace.ts` | Backend |
| `TraceSummary` | `functions/src/types/agentTrace.ts` | Backend |
| `TraceSummary` | `src/types/agentTrace.ts` | Mobile |

---

## ProviderCandidate (Normalized)

Produced by `normalizeGooglePlaceToProviderCandidate()`.

| Field | Type | Nullable | Source |
|-------|------|----------|--------|
| candidateId | string | No | Generated UUID |
| source | enum | No | `'google_places'` or `'registered_provider'` |
| placeId | string | Yes | Google Places |
| providerId | string | Yes | Our Firestore |
| name | string | No | API or registry |
| address | string | No | API |
| location | { lat, lng } | Yes | API |
| rating | number | **Yes** | API — null if unavailable |
| reviewCount | number | **Yes** | API — null if unavailable |
| openNow | boolean | **Yes** | API — null if unavailable |
| businessStatus | string | No | API — `'UNKNOWN'` if unavailable |
| categories | string[] | No | API types |
| distanceEstimateKm | number | **Yes** | Distance Matrix — null if unavailable |
| travelTimeEstimateMinutes | number | **Yes** | Distance Matrix — null if unavailable |
| isRegistered | boolean | No | Cross-referenced with `provider_profiles` |
| bookable | boolean | No | `true` only if in `provider_profiles` |
| statusLabel | string | No | UI display text |
| missingFields | string[] | No | List of fields that couldn't be determined |
| dataWarnings | string[] | No | Quality warnings for judges |
| confidence | number | No | 0.0–1.0 based on data completeness |
| rawDataSummary | object | No | Source metadata (no secrets) |

### Honesty Rules

```
Field unavailable? → null (not 0, not "", not fabricated)
Rating unknown?    → rating: null + warning
Distance failed?   → distanceEstimateKm: null + warning
Not registered?    → bookable: false + "Discovered — onboarding required"
```

---

## ParsedServiceRequest (Gemini NLU Output)

Produced by `parseServiceRequest()`.

| Field | Type | Values | Source |
|-------|------|--------|--------|
| serviceType | string | AC Repair, Plumbing, Electrical, etc. | Gemini or keyword |
| issueDescription | string | Free text | Gemini |
| locationText | string | Area name as stated | Gemini |
| preferredDate | string | today, tomorrow, etc. | Gemini |
| preferredTimeWindow | string | morning, afternoon, evening | Gemini |
| urgency | enum | emergency, today, tomorrow_morning, tomorrow, this_week, flexible, unspecified | Gemini |
| budgetSensitivity | enum | low, medium, high, unspecified | Gemini |
| qualityPreference | enum | budget, balanced, premium, unspecified | Gemini |
| constraints | string[] | Special requirements | Gemini |
| languageDetected | enum | urdu, roman_urdu, english, mixed, unknown | Gemini or regex |
| confidenceScore | number | 0.0–1.0 | Gemini |
| missingFields | string[] | Fields not extractable | Gemini |
| clarificationQuestion | string | Follow-up if needed | Gemini |
| normalizedEnglishSummary | string | English summary for non-Urdu speakers | Gemini |

---

## GeocodedLocation

Produced by `geocodeLocation()`.

| Field | Type | Source |
|-------|------|--------|
| lat | number | Geocoding API |
| lng | number | Geocoding API |
| formattedAddress | string | Geocoding API |
| placeId | string? | Geocoding API |
| confidence | enum | high, medium, low — mapped from Google's `location_type` |
| warnings | string[] | Multiple matches, low accuracy, etc. |

---

## DistanceEstimate

Produced by `estimateDistance()`.

| Field | Type | Source |
|-------|------|--------|
| distanceText | string | Distance Matrix API ("1.2 km") |
| distanceMeters | number | Distance Matrix API |
| durationText | string | Distance Matrix API ("5 mins") |
| durationSeconds | number | Distance Matrix API |
| mode | string | Always `'driving'` |
| warnings | string[] | API issues |

---

## Data Flow

```
User Input (Urdu/English/Mixed)
  │
  ▼
ParsedServiceRequest (Gemini NLU)
  │
  ├→ GeocodedLocation (Geocoding API)
  │
  ├→ PlacesSearchResult (Places API)
  │     └→ GooglePlaceResult[] (raw)
  │          └→ ProviderCandidate[] (normalized)
  │
  ├→ DistanceEstimate[] (Distance Matrix)
  │     └→ Merged into ProviderCandidate.distanceEstimateKm
  │
  ├→ RankingExplanation (Gemini)
  │
  ├→ PriceEstimate (Gemini)
  │
  └→ Booking (Firestore)
       └→ AgentTrace[] (every step logged)
```
