# KaamWala AI — Firestore Schema (v4)

**Last Updated:** 2026-05-16 | **Mode:** Production | **Region:** asia-south1

---

## Schema Overview

| # | Collection | Write By | Read By | Documents |
|---|-----------|----------|---------|-----------|
| 1 | `users` | Admin SDK | Owner | Per-user profile |
| 2 | `provider_profiles` | Admin SDK | Public (limited) | Per-provider |
| 3 | `service_requests` | Admin SDK | Owner | Per-request |
| 4 | `provider_candidates` | Admin SDK | Workflow owner | Per-workflow |
| 5 | `ranking_decisions` | Admin SDK | Workflow owner | Per-workflow |
| 6 | `price_estimates` | Admin SDK | Workflow owner | Per-workflow |
| 7 | `bookings` | Admin SDK | Customer + Provider | Per-booking |
| 8 | `booking_events` | Admin SDK | Booking owner | Per-event |
| 9 | `notifications` | Admin SDK | Recipient | Per-notification |
| 10 | `fallback_events` | Admin SDK | Workflow owner | Per-event |
| 11 | `agent_traces` | Admin SDK | Workflow owner | Per-trace-step |
| 12 | `app_metrics` | Admin SDK | Admin only | Aggregates |

> **All writes go through the backend Admin SDK.** Mobile app has read-only access scoped to authenticated user.

---

## 1. users

**Document ID:** Firebase Auth UID

```typescript
interface User {
  uid: string;                              // Firebase Auth UID
  authProvider: 'anonymous' | 'email' | 'google';
  displayName?: string;
  email?: string;                           // Only if email auth
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
  role: 'customer' | 'provider' | 'admin' | 'demo';
  privacySafe: boolean;                     // true = no real PII stored
}
```

---

## 2. provider_profiles

**Document ID:** `prov_{category}_{nn}` (e.g., `prov_hvac_01`)

```typescript
interface ProviderProfile {
  providerId: string;                       // Same as doc ID
  ownerUid: string;                         // Firebase UID of profile owner
  businessName: string;
  serviceCategories: string[];              // ['hvac', 'appliance']
  serviceAreas: string[];                   // ['G-13', 'G-12', 'G-11']
  contactEmail?: string;                    // Optional — demo profiles use @kaamwala.test
  contactPhone?: string;                    // Optional — never a real stranger's number
  verified: boolean;                        // Manually verified by us
  active: boolean;                          // Currently accepting jobs
  source: 'registered' | 'imported' | 'demo-controlled';
  locationArea: string;                     // Primary area
  geo?: { lat: number; lng: number };       // Optional coordinates
  baseVisitFee: number;                     // PKR — minimum visit charge
  availability: {
    days: string[];                         // ['Mon', 'Tue', ...]
    timeSlots: string[];                    // ['morning', 'afternoon', 'evening']
  };
  internalRating: number;                   // 0.0 – 5.0
  completedJobs: number;
  cancellationCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. service_requests

**Document ID:** `req_{uuid}`

```typescript
interface ServiceRequest {
  requestId: string;                        // Same as doc ID
  workflowId: string;                       // Links all workflow docs together
  customerUid: string;                      // Firebase Auth UID
  rawText: string;                          // Original user input
  normalizedSummary: string;                // Gemini-generated English summary
  serviceType: string;                      // e.g., 'AC Repair'
  serviceCategory: string;                  // e.g., 'hvac'
  issueDescription: string;                 // Extracted problem description
  locationArea: string;                     // e.g., 'G-13'
  locationCity: string;                     // e.g., 'Islamabad'
  preferredDate?: string;                   // e.g., 'tomorrow'
  preferredTimeWindow?: string;             // e.g., 'morning'
  urgency: 'emergency' | 'today' | 'tomorrow_morning' | 'this_week' | 'flexible';
  budgetSensitivity: 'low' | 'medium' | 'high' | 'unspecified';
  languageDetected: string;                 // 'urdu' | 'roman_urdu' | 'english' | 'mixed'
  confidenceScore: number;                  // 0.0 – 1.0
  missingFields: string[];                  // Fields Gemini couldn't extract
  status: 'parsed' | 'discovering' | 'ranked' | 'estimated' | 'booked' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}
```

---

## 4. provider_candidates

**Document ID:** `cand_{workflowId}` (one doc per workflow, array of candidates inside)

```typescript
interface ProviderCandidatesDoc {
  workflowId: string;
  geocoded: {
    lat: number;
    lng: number;
    formattedAddress: string;
  };
  candidates: ProviderCandidate[];
  totalGoogleResults: number;
  totalRegisteredResults: number;
  createdAt: Timestamp;
}

interface ProviderCandidate {
  candidateId: string;                      // Unique per candidate
  source: 'google_places' | 'registered_provider';
  placeId?: string;                         // Google Places ID (if from Places)
  providerId?: string;                      // Our provider ID (if registered)
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  openNow?: boolean;
  distanceEstimate: { text: string; meters: number };
  travelTimeEstimate: { text: string; seconds: number };
  isRegistered: boolean;
  bookable: boolean;
  statusLabel: string;                      // 'Verified KaamWala Provider' | 'Discovered — onboarding required'
  missingFields: string[];                  // Data not available from API
  dataWarnings: string[];                   // e.g., 'No phone number available'
  createdAt: Timestamp;
}
```

---

## 5. ranking_decisions

**Document ID:** `rank_{workflowId}`

```typescript
interface RankingDecision {
  workflowId: string;
  ranked: RankedProvider[];
  rankingMethod: 'gemini_multi_factor' | 'fallback_distance_only';
  baselineComparison: {
    withoutAI: string;
    withAI: string;
  };
  createdAt: Timestamp;
}

interface RankedProvider {
  rank: number;
  candidateId: string;
  name: string;
  isRegistered: boolean;
  bookable: boolean;
  statusLabel?: string;
  score: number;                            // 0.0 – 1.0
  reasoning: string;                        // Gemini explanation
  factors: {
    distance: { score: number; detail: string };
    rating: { score: number; detail: string };
    relevance: { score: number; detail: string };
    budgetFit: { score: number; detail: string };
  };
}
```

---

## 6. price_estimates

**Document ID:** `price_{workflowId}`

```typescript
interface PriceEstimate {
  workflowId: string;
  providerId?: string;
  estimate: {
    min: number;
    max: number;
    currency: 'PKR';
    confidence: number;
    factors: { factor: string; impact: string }[];
    reasoning: string;
  };
  estimateMethod: 'gemini_contextual' | 'fallback_base_fee';
  createdAt: Timestamp;
}
```

---

## 7. bookings

**Document ID:** `book_{uuid}`

```typescript
interface Booking {
  bookingId: string;
  workflowId: string;
  customerUid: string;
  providerId: string;                       // MUST exist in provider_profiles
  providerName: string;
  serviceType: string;
  issueDescription: string;
  locationArea: string;
  requestedTimeWindow: string;
  confirmedSlot: string;
  status: 'confirmed_pending_provider' | 'provider_accepted' | 'in_progress'
        | 'completed' | 'cancelled' | 'disputed';
  priceEstimate: { min: number; max: number; currency: string };
  providerAccepted: boolean;
  cancellationReason?: string;
  fallbackBookingId?: string;               // If rebooked after cancellation
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 8. booking_events

**Document ID:** `evt_{uuid}`

```typescript
interface BookingEvent {
  eventId: string;
  bookingId: string;
  workflowId: string;
  eventType: 'created' | 'provider_accepted' | 'reminder' | 'provider_enroute'
           | 'service_started' | 'service_completed' | 'provider_cancelled'
           | 'customer_cancelled' | 'dispute_opened';
  previousStatus: string;
  newStatus: string;
  label: string;                            // '🟢 REAL' | '🔸 DEMO'
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}
```

---

## 9. notifications

**Document ID:** `notif_{uuid}`

```typescript
interface Notification {
  notificationId: string;
  bookingId: string;
  workflowId: string;
  recipientType: 'provider' | 'customer';
  recipientId: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'in_app';
  status: 'sent' | 'preview_only' | 'failed';
  subject?: string;
  body: string;
  label: string;                            // '📋 PREVIEW' | '🟢 SENT'
  sentAt?: Timestamp;
  createdAt: Timestamp;
}
```

---

## 10. fallback_events

**Document ID:** `fb_{uuid}`

```typescript
interface FallbackEvent {
  eventId: string;
  workflowId: string;
  eventType: 'provider_cancellation' | 'dispute';
  originalBookingId: string;
  originalProviderId: string;
  reason: string;
  recovery: {
    newBookingId?: string;
    newProviderId?: string;
    newProviderName?: string;
    reasoning: string;
    status: 'rebooked' | 'no_fallback_available';
  };
  createdAt: Timestamp;
}
```

---

## 11. agent_traces

**Document ID:** `trace_{uuid}`

```typescript
interface AgentTrace {
  traceId: string;
  workflowId: string;
  agentName: string;                        // 'NLU_Agent', 'Discovery_Agent', etc.
  phase: 'OBSERVE' | 'UNDERSTAND' | 'REASON' | 'DECIDE' | 'ACT' | 'EVALUATE' | 'RECOVER';
  observation: string;                      // What the agent saw
  reasoningSummary: string;                 // How it thought
  decision: string;                         // What it decided
  actionTaken: string;                      // What it did
  toolUsed: string;                         // 'gemini_api', 'places_api', 'firestore', etc.
  inputSummary: Record<string, any>;        // Redacted input summary
  outputSummary: Record<string, any>;       // Redacted output summary
  confidence: number;                       // 0.0 – 1.0
  latencyMs: number;
  error?: string;
  recoveryAction?: string;
  createdAt: Timestamp;
}
```

---

## 12. app_metrics

**Document ID:** `metrics_{date}` (daily aggregate)

```typescript
interface AppMetrics {
  date: string;                             // '2026-05-16'
  totalRequests: number;
  totalBookings: number;
  totalCancellations: number;
  totalFallbacks: number;
  avgLatencyMs: number;
  geminiCalls: number;
  placesCalls: number;
  errors: number;
  updatedAt: Timestamp;
}
```

---

## Workflow ID Linking

All collections use `workflowId` as the primary link:

```
service_requests.workflowId
  ├── provider_candidates.workflowId
  ├── ranking_decisions.workflowId
  ├── price_estimates.workflowId
  ├── bookings.workflowId
  │     ├── booking_events.workflowId
  │     └── notifications.workflowId
  ├── fallback_events.workflowId
  └── agent_traces.workflowId
```
