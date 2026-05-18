# KaamWala AI — Risk & Fallback Plan

**Last Updated:** 2026-05-16

---

## Overview

KaamWala AI handles 10 failure scenarios with graceful AI-powered recovery. Each scenario is traceable with 3 agent traces (observation → action → evaluation) and creates real Firestore records.

---

## Scenarios

### 1. Provider Cancellation ⚡
| Aspect | Detail |
|--------|--------|
| Trigger | Provider cancels after booking confirmed |
| Detection | Simulated via POST `/simulateProviderCancellation` |
| Recovery | Re-rank remaining providers, pick next registered, generate bilingual apology |
| Firestore | `bookings` status → cancelled, `booking_events`, `fallback_events`, `notifications` |
| UI | Apology preview (English + Roman Urdu), PREVIEW ONLY badge |

### 2. No Provider Found 🔍
| Aspect | Detail |
|--------|--------|
| Trigger | Google Places returns zero results |
| Recovery | Expand search radius 50%, suggest alternative terms, offer retry |
| Status | `awaiting_retry` |

### 3. Low Confidence Request ❓
| Aspect | Detail |
|--------|--------|
| Trigger | NLU confidence < 60% |
| Recovery | Ask clarification question, pause automatic processing |
| Status | `awaiting_clarification` |

### 4. Missing Location 📍
| Aspect | Detail |
|--------|--------|
| Trigger | No recognizable location in user request |
| Recovery | Ask user to specify area, offer default (Islamabad) |
| Status | `awaiting_location` |

### 5. Google Places API Failure ⚡
| Aspect | Detail |
|--------|--------|
| Trigger | Places API error or timeout |
| Recovery | Fall back to registered provider database only |
| Mode | Degraded — clearly labeled |

### 6. Gemini API Failure ⚡
| Aspect | Detail |
|--------|--------|
| Trigger | Gemini returns error or invalid JSON |
| Recovery | Use deterministic keyword-based fallback parser, confidence → 35% |
| Mode | Degraded — clearly labeled |

### 7. Firestore Write Failure ⚡
| Aspect | Detail |
|--------|--------|
| Trigger | Firestore operation fails |
| Recovery | Retry once, return volatile response if still failing |
| Warning | "Results may not be persisted" |

### 8. Price Dispute 💰
| Aspect | Detail |
|--------|--------|
| Trigger | Customer disputes estimated price |
| Recovery | Show original breakdown with assumptions, offer recalculation |
| Status | `dispute_under_review` |

### 9. User Changes Time (via resolveDispute)
| Aspect | Detail |
|--------|--------|
| Trigger | Customer requests time change after booking |
| Recovery | Check provider availability, update or suggest alternatives |

### 10. Unregistered Provider (via booking flow)
| Aspect | Detail |
|--------|--------|
| Trigger | Selected provider is Google Places only |
| Recovery | Status → `onboarding_required`, cannot confirm booking |
| Note | Provider must register before real booking |

---

## Architecture

```
POST /resolveDispute (unified router)
  ├── scenario: provider_cancellation  → handleProviderCancellation()
  ├── scenario: no_provider_found      → handleNoProviderFound()
  ├── scenario: low_confidence         → handleLowConfidenceRequest()
  ├── scenario: api_failure            → handleApiFailure()
  ├── scenario: price_dispute          → handlePriceDispute()
  └── scenario: missing_location       → handleMissingLocation()

POST /simulateProviderCancellation  → Direct cancellation handler
POST /handleNoProviderFound          → Direct no-provider handler
POST /handleLowConfidenceRequest     → Direct low-confidence handler
```

---

## Recovery Result Structure

Every scenario returns:

| Field | Type | Purpose |
|-------|------|---------|
| scenarioType | string | Which failure occurred |
| scenarioLabel | string | Human-readable label |
| issueDetected | string | What went wrong |
| stateBefore | object | System state before recovery |
| reasoning | string | AI's reasoning for recovery approach |
| recoveryOptions | string[] | All options considered |
| selectedRecovery | string | Which option was chosen |
| stateAfter | object | System state after recovery |
| apologyMessage | string? | Bilingual apology (if applicable) |
| firestoreSaved | boolean | Whether records were persisted |
| warnings | string[] | Any caveats |

---

## Trace Logging

Each recovery generates 3 traces:

| Phase | Content |
|-------|---------|
| observation | Failure detected, scenario identified |
| action | Recovery executed, Firestore updated |
| evaluation | Outcome assessed, options reviewed |

---

## Mobile UI

FallbackRecoveryScreen shows:
- 6 scenario buttons in a 2-column grid
- Structured result for each scenario
- Issue → Reasoning → Options → Recovery → State Change
- Apology preview with PREVIEW ONLY badge
- Firestore Saved badge
- Trace viewer button

---

## Safety Rules

| Rule | Enforced |
|------|---------|
| No real SMS/WhatsApp sent during recovery | ✅ |
| No real provider contacted | ✅ |
| Apology messages are preview-only | ✅ |
| Unregistered providers never get reputation updates | ✅ |
| All recovery events saved to Firestore | ✅ |
