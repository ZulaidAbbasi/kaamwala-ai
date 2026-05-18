# KaamWala AI — API Setup Guide

**Last Updated:** 2026-05-16

---

## Required APIs

| API | Where | Purpose | How to Enable |
|-----|-------|---------|---------------|
| Gemini API | Backend only | NLU, ranking, pricing, messages, disputes | [AI Studio](https://aistudio.google.com/apikey) |
| Places API (New) | Backend only | Provider discovery | [GCP Console](https://console.cloud.google.com/apis/library) |
| Geocoding API | Backend only | Area name → coordinates | GCP Console |
| Distance Matrix API | Backend only | Travel distance/time | GCP Console |

---

## Key Configuration

### Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create or copy your API key
3. Set in backend:
   ```bash
   # In functions/.env
   GEMINI_API_KEY=your_key_here
   ```

### Google Maps/Places API Key

1. Go to [GCP Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create or copy your API key (restricted to Places, Geocoding, Distance Matrix)
3. Set in backend:
   ```bash
   # In functions/.env
   GOOGLE_MAPS_API_KEY=your_key_here
   ```

---

## Gemini Service Architecture

```
Mobile App
  └→ POST /parseRequest (backend)
       └→ geminiClient.parseServiceRequest(rawText)
            ├→ Gemini API call (server-side, using GEMINI_API_KEY)
            ├→ JSON extraction + validation
            ├→ If valid: return parsed result (source: "gemini")
            ├→ If invalid JSON: repair once, then fallback
            └→ If API fails: keyword fallback (source: "fallback")
```

### Gemini Client Methods

| # | Method | Gemini Model | Purpose |
|---|--------|-------------|---------|
| 1 | `parseServiceRequest(rawText)` | gemini-2.0-flash | Multilingual NLU |
| 2 | `explainRankingDecision(data)` | gemini-2.0-flash | Provider ranking explanation |
| 3 | `generateCustomerMessage(data)` | gemini-2.0-flash | Customer notification text |
| 4 | `generateProviderMessagePreview(data)` | gemini-2.0-flash | Provider notification preview |
| 5 | `generateDisputeResolutionMessage(data)` | gemini-2.0-flash | Dispute analysis |

### Fallback Behavior

Every Gemini call has a deterministic fallback:

| Failure | Fallback | Confidence |
|---------|----------|------------|
| API unavailable | Keyword-based extraction | 0.35 |
| Invalid JSON | Repair attempt → keyword fallback | 0.35 |
| Validation fails | Patch missing fields | 0.50 |

---

## Testing Without API Key

Run the fallback parser test (no API key needed):

```bash
cd functions
npm run build
node lib/utils/testGemini.js
```

Expected output:
```
=== KaamWala AI — Fallback Parser Test ===

--- romanUrdu ---
Input: "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai."
Service Type: AC Repair
Location: G-13
Urgency: tomorrow_morning
Budget: low
Language: roman_urdu
Confidence: 0.35
```

---

## Security Rules

- ❌ Gemini key is NEVER in mobile app code
- ❌ Gemini key is NEVER logged (safeLog redacts it)
- ❌ Gemini key is NEVER in response payloads
- ✅ Gemini key is read from `process.env.GEMINI_API_KEY`
- ✅ All Gemini calls go through `geminiClient.ts`
- ✅ All Gemini errors are caught and produce fallback responses

---

## Maps/Places Service Architecture

```
Mobile App
  └→ POST /discoverProviders (backend)
       ├→ geocodingService.geocodeLocation("G-13 Islamabad")
       │     └→ Geocoding API → { lat: 33.631, lng: 73.027 }
       ├→ placesService.searchNearbyProviders("AC repair", "G-13 Islamabad")
       │     └→ Places API (New) Text Search → 8 results
       ├→ distanceService.batchEstimateDistances(origin, destinations)
       │     └→ Distance Matrix API → km + minutes per result
       └→ placesService.normalizeGooglePlaceToProviderCandidate(place)
             └→ Honest normalization: null for missing, warnings for gaps
```

### Maps Service Modules

| File | Method | API Used | Purpose |
|------|--------|----------|---------|
| `mapsClient.ts` | `mapsGet()`, `placesPost()` | — | Shared HTTP client |
| `geocodingService.ts` | `geocodeLocation(text)` | Geocoding API | Area → coordinates |
| `placesService.ts` | `searchNearbyProviders(type, loc)` | Places API (New) | Find real providers |
| `placesService.ts` | `getPlaceDetails(placeId)` | Places Detail | Rich place info |
| `placesService.ts` | `normalizeGooglePlaceToProviderCandidate(place)` | — | Honest normalization |
| `distanceService.ts` | `estimateDistance(origin, dest)` | Distance Matrix | Travel distance |
| `distanceService.ts` | `batchEstimateDistances(origin, dests)` | Distance Matrix | Batch distances |

### Missing Data Handling

| Missing Field | What We Do | What We DON'T Do |
|--------------|------------|-----------------|
| Rating | `rating: null`, warning added | ❌ Don't invent a rating |
| Review count | `reviewCount: null` | ❌ Don't fabricate reviews |
| Open status | `openNow: null`, warning added | ❌ Don't guess availability |
| Phone number | Added to `missingFields` | ❌ Don't invent contact info |
| Distance | `distanceEstimateKm: null` | ❌ Don't estimate manually |

### Testing Maps Normalization (no API key needed)

```bash
cd functions
npm run build
node lib/utils/testMaps.js
```

### Security Rules (Maps Key)

- ❌ Maps key is NEVER in mobile app code
- ❌ Maps key is NEVER logged (safeLog redacts it)
- ❌ Maps key is NEVER in response payloads
- ✅ Maps key is read from `process.env.GOOGLE_MAPS_API_KEY`
- ✅ All Maps calls go through `mapsClient.ts`
- ✅ All API errors return degraded responses, never crash

---

## In-App Diagnostics

### System Status Screen

The `ApiSetupStatusScreen` runs 10 individual tests:

**Mobile Tests (client-side):**

| # | Test | What It Checks |
|---|------|---------------|
| 1 | Firebase Config | Firestore SDK initialized and reachable |
| 2 | Anonymous Auth | Firebase Auth sign-in working |
| 3 | Backend Health | Cloud Functions /health endpoint responding |

**Backend Tests (via POST /diagnostics):**

| # | Test | What It Checks |
|---|------|---------------|
| 4 | Gemini API Key | GEMINI_API_KEY present in environment |
| 5 | Maps API Key | GOOGLE_MAPS_API_KEY present in environment |
| 6 | Firestore Write | Admin SDK can write + delete a test document |
| 7 | Gemini NLU Parse | Gemini can parse "AC repair test" |
| 8 | Places API Search | Places API can search "AC repair" near "G-13 Islamabad" |
| 9 | Geocoding API | Geocoding can resolve "G-13 Islamabad" |
| 10 | Distance/Routes | Distance Matrix can estimate between two Islamabad points |

### Demo Readiness Indicator

| Color | Meaning |
|-------|---------|
| 🟢 Green | All core services pass |
| 🟡 Yellow | Optional services have warnings |
| 🔴 Red | Core services (auth, backend, keys, Firestore) failing |

### Safety

- API key previews show first/last 4 characters only
- No full secrets are ever returned
- Each test returns: status, latencyMs, message, warning, hint


