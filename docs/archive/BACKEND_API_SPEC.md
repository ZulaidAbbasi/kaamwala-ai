# KaamWala AI — Backend API Specification (v3)

**Runtime:** Firebase Cloud Functions — Node.js 18, TypeScript, Express
**Base URL:** `https://[region]-kaamwala-ai.cloudfunctions.net/api`
**Auth:** Firebase Anonymous Auth token in `Authorization: Bearer <token>` header
**Last Updated:** 2026-05-16

---

## Endpoint Summary

| # | Method | Path | Purpose | External APIs |
|---|--------|------|---------|--------------|
| 1 | POST | `/parseRequest` | Gemini multilingual NLU | Gemini |
| 2 | POST | `/discoverProviders` | Find real nearby providers | Places, Geocoding, Distance Matrix |
| 3 | POST | `/rankProviders` | Multi-factor AI ranking | Gemini |
| 4 | POST | `/estimatePrice` | Dynamic price estimate | Gemini |
| 5 | POST | `/createBooking` | Book registered provider | None (Firestore) |
| 6 | POST | `/simulateFollowUp` | Follow-up / notification preview | None (Firestore) |
| 7 | POST | `/simulateProviderCancellation` | Cancellation + recovery | Gemini |
| 8 | POST | `/resolveDispute` | Dispute resolution | Gemini |
| 9 | GET | `/workflow/:workflowId` | Full workflow state | None (Firestore) |
| 10 | GET | `/traces/:workflowId` | Agent trace log | None (Firestore) |
| 11 | GET | `/health` | Health check | None |

---

## Common Error Response Format

```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Human-readable error description",
  "field": "text"
}
```

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Missing or invalid field |
| `AUTH_REQUIRED` | 401 | Missing or invalid auth token |
| `NOT_FOUND` | 404 | Resource not found |
| `PROVIDER_NOT_REGISTERED` | 403 | Cannot book unregistered provider |
| `GEMINI_ERROR` | 502 | Gemini API failed |
| `PLACES_ERROR` | 502 | Google Places API failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 1. POST /parseRequest

**Purpose:** Parse multilingual service request using Gemini.

### Request
```json
{
  "text": "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.",
  "userId": "firebase_anon_uid"
}
```

### Validation
- `text`: required, string, 5–1000 chars
- `userId`: required, must match auth token UID

### Response (200)
```json
{
  "workflowId": "wf_uuid",
  "parsed": {
    "serviceType": "AC Repair",
    "serviceCategory": "hvac",
    "location": { "area": "G-13", "city": "Islamabad", "raw": "G-13 mein" },
    "urgency": "tomorrow_morning",
    "budget": "low",
    "issueDescription": "AC is completely not working",
    "languageDetected": "roman_urdu",
    "confidence": 0.94
  },
  "geminiReasoning": "The user is requesting AC repair service in Roman Urdu..."
}
```

### Firestore Writes
- `service_requests/{workflowId}` — full parsed request
- `agent_traces/{traceId}` — phase: UNDERSTAND

### Fallback
If Gemini fails: return 502 with `GEMINI_ERROR`. Do NOT guess — fail cleanly.

---

## 2. POST /discoverProviders

**Purpose:** Find real providers using Google APIs + merge with registered providers.

### Request
```json
{
  "workflowId": "wf_uuid",
  "serviceCategory": "hvac",
  "location": { "area": "G-13", "city": "Islamabad" },
  "radiusMeters": 5000
}
```

### Validation
- `workflowId`: required, must exist in `service_requests`
- `serviceCategory`: required, from allowed list
- `location.area` + `location.city`: required
- `radiusMeters`: optional, default 5000, max 25000

### Response (200)
```json
{
  "workflowId": "wf_uuid",
  "geocoded": { "lat": 33.6310, "lng": 73.0271, "formattedAddress": "G-13, Islamabad" },
  "candidates": [
    {
      "candidateId": "cand_uuid",
      "source": "google_places",
      "placeId": "ChIJ...",
      "name": "Cool Tech AC Services",
      "rating": 4.2,
      "totalRatings": 45,
      "address": "G-13/1, Islamabad",
      "distance": { "text": "1.2 km", "meters": 1200 },
      "duration": { "text": "4 min", "seconds": 240 },
      "isRegistered": false,
      "registeredProviderId": null,
      "bookable": false,
      "statusLabel": "Discovered — onboarding required"
    },
    {
      "candidateId": "cand_uuid2",
      "source": "registered",
      "placeId": null,
      "name": "KaamWala Demo AC Services",
      "rating": 4.5,
      "totalRatings": 12,
      "address": "G-13/4, Islamabad",
      "distance": { "text": "0.8 km", "meters": 800 },
      "duration": { "text": "3 min", "seconds": 180 },
      "isRegistered": true,
      "registeredProviderId": "prov_abc123",
      "bookable": true,
      "statusLabel": "Verified KaamWala Provider"
    }
  ],
  "counts": { "google": 8, "registered": 2, "total": 10 }
}
```

### Firestore Writes
- `provider_candidates/{workflowId}` — all candidates
- `agent_traces/{traceId}` — phase: OBSERVE

### Fallback
- Geocoding fails: return 502 `PLACES_ERROR`
- Places returns 0 results: return empty candidates with `counts.google: 0` (still include registered)
- Distance Matrix fails: return candidates without distance data, note in response

---

## 3. POST /rankProviders

**Purpose:** Rank all candidates using multi-factor Gemini reasoning.

### Request
```json
{
  "workflowId": "wf_uuid",
  "userPreferences": { "budget": "low", "urgency": "tomorrow_morning" }
}
```

### Validation
- `workflowId`: required, must have `provider_candidates` doc
- `userPreferences`: required object

### Response (200)
```json
{
  "workflowId": "wf_uuid",
  "ranked": [
    {
      "rank": 1,
      "candidateId": "cand_uuid2",
      "name": "KaamWala Demo AC Services",
      "isRegistered": true,
      "bookable": true,
      "score": 0.89,
      "reasoning": "Closest at 0.8km, highest rating at 4.5, registered and available, fits low budget.",
      "factors": {
        "distance": { "score": 0.95, "detail": "0.8 km — excellent" },
        "rating": { "score": 0.90, "detail": "4.5 stars from 12 reviews" },
        "relevance": { "score": 0.85, "detail": "HVAC specialist, covers G-13" },
        "budgetFit": { "score": 0.80, "detail": "Base fee PKR 2,500 — within low budget" }
      }
    },
    {
      "rank": 2,
      "candidateId": "cand_uuid",
      "name": "Cool Tech AC Services",
      "isRegistered": false,
      "bookable": false,
      "statusLabel": "Discovered — onboarding required",
      "score": 0.72,
      "reasoning": "Good rating, slightly farther. Not registered — cannot verify availability."
    }
  ],
  "baselineComparison": {
    "withoutAI": "Manual search: 30-45 min, call 3-5 providers, no price transparency, no fallback.",
    "withAI": "KaamWala: 10 candidates found, ranked by 4 factors in 3 seconds, transparent scoring."
  }
}
```

### Firestore Writes
- `ranking_decisions/{workflowId}`
- `agent_traces/{traceId}` — phase: REASON
- `agent_traces/{traceId}` — phase: DECIDE

### Fallback
Gemini fails: return candidates sorted by distance only, note `"rankingMethod": "fallback_distance_only"`.

---

## 4. POST /estimatePrice

**Purpose:** Generate contextual price estimate using Gemini.

### Request
```json
{
  "workflowId": "wf_uuid",
  "providerId": "prov_abc123",
  "serviceCategory": "hvac",
  "issueDescription": "AC completely not working",
  "urgency": "tomorrow_morning",
  "budget": "low"
}
```

### Validation
- `workflowId`: required
- `providerId`: optional (uses top-ranked if omitted)
- `serviceCategory`: required

### Response (200)
```json
{
  "workflowId": "wf_uuid",
  "estimate": {
    "min": 2000,
    "max": 4500,
    "currency": "PKR",
    "confidence": 0.78,
    "factors": [
      { "factor": "Service type", "impact": "AC repair — moderate complexity" },
      { "factor": "Urgency", "impact": "Next-day — no rush premium" },
      { "factor": "Location", "impact": "G-13 Islamabad — urban rate" },
      { "factor": "Budget constraint", "impact": "User indicated low budget" },
      { "factor": "Provider base fee", "impact": "PKR 2,500 visit charge" }
    ],
    "reasoning": "Based on typical AC repair costs in Islamabad urban areas..."
  }
}
```

### Firestore Writes
- `price_estimates/{workflowId}`
- `agent_traces/{traceId}` — phase: DECIDE

### Fallback
Gemini fails: return estimate from provider's `baseVisitFee` × 1.5 multiplier, note `"estimateMethod": "fallback_base_fee"`.

---

## 5. POST /createBooking

**Purpose:** Create a REAL booking for a REGISTERED provider only.

### Request
```json
{
  "workflowId": "wf_uuid",
  "customerId": "firebase_anon_uid",
  "providerId": "prov_abc123",
  "serviceType": "AC Repair",
  "issueDescription": "AC completely not working",
  "locationArea": "G-13, Islamabad",
  "requestedTimeWindow": "tomorrow_morning",
  "priceEstimate": { "min": 2000, "max": 4500, "currency": "PKR" }
}
```

### Validation
- `providerId`: **MUST exist** in `provider_profiles` with `active: true`
- `customerId`: must match auth token UID
- `workflowId`: must exist in `service_requests`
- If `providerId` not found or `isRegistered: false` → reject with `PROVIDER_NOT_REGISTERED`

### Response (201)
```json
{
  "bookingId": "book_uuid",
  "workflowId": "wf_uuid",
  "status": "confirmed_pending_provider",
  "provider": { "name": "KaamWala Demo AC Services", "isRegistered": true },
  "confirmedSlot": "2026-05-17 09:00-12:00",
  "message": "Booking created. Provider will be notified."
}
```

### Error (403)
```json
{
  "error": true,
  "code": "PROVIDER_NOT_REGISTERED",
  "message": "Cannot book this provider — they are discovered via Google Places but not registered on KaamWala. Onboarding required."
}
```

### Firestore Writes
- `bookings/{bookingId}`
- `booking_events/{eventId}` — type: `created`
- `agent_traces/{traceId}` — phase: ACT

### Fallback
None — booking either succeeds or fails cleanly.

---

## 6. POST /simulateFollowUp

**Purpose:** Simulate follow-up notifications and timeline events.

### Request
```json
{
  "bookingId": "book_uuid",
  "actions": ["reminder", "provider_enroute", "service_started", "service_completed"]
}
```

### Validation
- `bookingId`: must exist in `bookings`
- `actions`: array of allowed action types

### Response (200)
```json
{
  "bookingId": "book_uuid",
  "events": [
    { "type": "reminder", "timestamp": "...", "message": "Reminder: AC repair tomorrow at 9 AM", "label": "🔸 DEMO" },
    { "type": "provider_enroute", "timestamp": "...", "message": "Provider is on the way", "label": "🔸 DEMO" },
    { "type": "service_started", "timestamp": "...", "message": "Service has started", "label": "🔸 DEMO" },
    { "type": "service_completed", "timestamp": "...", "message": "Service completed", "label": "🔸 DEMO" }
  ],
  "notification": {
    "status": "preview_only",
    "channel": "whatsapp",
    "preview": "Reminder: Your AC repair appointment is tomorrow at 9 AM in G-13."
  }
}
```

### Firestore Writes
- `booking_events/{eventId}` — one per action
- `notifications/{notifId}` — notification record
- `agent_traces/{traceId}` — phase: EVALUATE

---

## 7. POST /simulateProviderCancellation

**Purpose:** Cancel booking, re-rank, and rebook with fallback provider.

### Request
```json
{
  "bookingId": "book_uuid",
  "reason": "provider_unavailable"
}
```

### Validation
- `bookingId`: must exist in `bookings` with status not already `cancelled`

### Response (200)
```json
{
  "cancelled": {
    "bookingId": "book_uuid",
    "previousStatus": "confirmed_pending_provider",
    "newStatus": "cancelled",
    "reason": "provider_unavailable"
  },
  "recovery": {
    "newBookingId": "book_uuid2",
    "provider": { "name": "KaamWala Demo Electrical", "providerId": "prov_def456" },
    "reasoning": "Next best registered provider. 1.5km away, 4.3 rating, available tomorrow morning.",
    "status": "confirmed_pending_provider"
  }
}
```

### Firestore Writes
- `bookings/{bookingId}` — status → cancelled
- `booking_events/{eventId}` — type: `provider_cancelled`
- `fallback_events/{eventId}` — full recovery record
- `bookings/{newBookingId}` — fallback booking
- `agent_traces/{traceId}` — phase: RECOVER

### Fallback
No registered fallback available: return recovery with `"status": "no_fallback_available"`, suggest manual search.

---

## 8. POST /resolveDispute

**Purpose:** Handle edge cases — wrong service, pricing dispute, quality complaint.

### Request
```json
{
  "bookingId": "book_uuid",
  "disputeType": "pricing_mismatch",
  "description": "Provider charged PKR 6,000 but estimate was PKR 2,000-4,500",
  "requestedResolution": "refund_difference"
}
```

### Validation
- `bookingId`: must exist
- `disputeType`: one of `pricing_mismatch`, `wrong_service`, `no_show`, `quality_complaint`

### Response (200)
```json
{
  "disputeId": "disp_uuid",
  "bookingId": "book_uuid",
  "analysis": {
    "estimateWas": { "min": 2000, "max": 4500 },
    "actualCharge": 6000,
    "withinRange": false,
    "reasoning": "The actual charge exceeds the estimated range by 33%. Possible causes: additional parts needed, complexity higher than estimated."
  },
  "suggestedResolution": "Contact provider to clarify additional charges. If unjustified, escalate to platform review.",
  "status": "under_review",
  "label": "🔸 DEMO — Dispute resolution simulated"
}
```

### Firestore Writes
- `fallback_events/{eventId}` — type: dispute
- `agent_traces/{traceId}` — phase: RECOVER

---

## 9. GET /workflow/:workflowId

**Purpose:** Return complete workflow state for a request.

### Response (200)
```json
{
  "workflowId": "wf_uuid",
  "status": "booked",
  "request": { "...parsed request..." },
  "candidates": { "...discovered providers..." },
  "ranking": { "...ranked list..." },
  "priceEstimate": { "...estimate..." },
  "booking": { "...booking record..." },
  "events": [ "...timeline..." ],
  "traceSummary": { "totalSteps": 7, "totalLatencyMs": 4500 }
}
```

### Validation
- `workflowId`: must exist
- User's auth UID must match the workflow's `userId`

### Firestore Reads
- `service_requests`, `provider_candidates`, `ranking_decisions`, `price_estimates`, `bookings`, `booking_events`

---

## 10. GET /traces/:workflowId

**Purpose:** Return full agent trace log for a workflow.

### Response (200)
```json
{
  "workflowId": "wf_uuid",
  "traces": [
    {
      "traceId": "t1",
      "agentName": "NLU_Agent",
      "phase": "UNDERSTAND",
      "observation": "Received Roman Urdu input, 89 characters",
      "reasoningSummary": "Detected AC repair, location G-13, urgency tomorrow, budget low",
      "decision": "Proceed to provider discovery",
      "actionTaken": "parse_complete",
      "toolUsed": "gemini_api",
      "confidence": 0.94,
      "latencyMs": 1200,
      "createdAt": "2026-05-17T09:00:01Z"
    }
  ],
  "totalSteps": 7,
  "totalLatencyMs": 4500,
  "phases": ["UNDERSTAND", "OBSERVE", "REASON", "DECIDE", "ACT", "EVALUATE", "RECOVER"]
}
```

### Firestore Reads
- `agent_traces` where `workflowId` matches, ordered by `createdAt`

---

## 11. GET /health

**Purpose:** Backend health check. No auth required.

### Response (200)
```json
{
  "status": "ok",
  "service": "KaamWala AI Backend",
  "version": "1.0.0",
  "timestamp": "2026-05-16T07:25:00Z",
  "apis": {
    "gemini": "configured",
    "places": "configured",
    "firestore": "connected"
  }
}
```

### No Firestore writes. No auth. No external API calls.
