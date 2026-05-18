# KaamWala AI — Action Simulation Boundaries

**Last Updated:** 2026-05-16

---

## What Is Real vs Simulated

KaamWala AI is a demo-grade product. To ensure safety and honesty, we clearly separate
what is real and what is simulated.

### Real (Firestore Records)

| Action | Collection | Real? | Notes |
|--------|-----------|-------|-------|
| Parse user request | `service_requests` | ✅ Yes | Gemini NLU + fallback |
| Discover providers | `provider_candidates` | ✅ Yes | Google Places API |
| Rank providers | `ranking_decisions` | ✅ Yes | 12-factor scoring |
| Price estimate | `price_estimates` | ✅ Yes | Market-rate engine |
| Create booking | `bookings` | ✅ Yes | Real Firestore record |
| Booking events | `booking_events` | ✅ Yes | Event log |
| Agent traces | `agent_traces` | ✅ Yes | Full decision trail |
| Provider profiles | `provider_profiles` | ✅ Yes | 3 demo providers |

### Simulated (Preview Only)

| Action | Collection | Simulated? | Notes |
|--------|-----------|------------|-------|
| Customer notification | `notifications` | ✅ Preview | Bilingual message generated, NOT sent |
| Provider notification | `notifications` | ✅ Preview | Bilingual message generated, NOT sent |
| SMS/WhatsApp delivery | N/A | ✅ Not sent | No messaging provider configured |
| Email delivery | N/A | ✅ Not sent | `sendEmailNotification()` returns `sent: false` |
| Provider acceptance | N/A | ✅ Simulated | Provider doesn't actually respond |
| Payment processing | N/A | ❌ Not implemented | No payment gateway |

---

## Notification Service Architecture

```
notificationService.ts
├── createCustomerConfirmationPreview()    → English + Roman Urdu
├── createProviderJobPreview()              → English + Roman Urdu
├── createCancellationApologyPreview()      → English + Roman Urdu
├── createDisputeMessagePreview()           → English + Roman Urdu
├── saveNotificationRecord()               → Firestore `notifications`
└── sendEmailNotification()                → Returns { sent: false } always
```

### Notification Record Fields

| Field | Type | Purpose |
|-------|------|---------|
| notificationId | string | Unique ID |
| workflowId | string | Links to workflow |
| bookingId | string | Links to booking |
| recipientType | 'customer' \| 'provider' \| 'admin' | Who receives |
| channel | 'preview' \| 'email' \| 'sms' \| 'whatsapp' | Always `preview` now |
| messageEnglish | string | English message body |
| messageRomanUrdu | string | Roman Urdu translation |
| status | 'preview_only' \| 'queued' \| 'sent' \| 'failed' | Always `preview_only` |
| simulation | boolean | Always `true` |
| deliveredAt | timestamp \| null | Always `null` |
| labels | string[] | Safety labels for UI |

---

## Booking Status Flow

```
                    ┌──────────────────────┐
                    │   User submits       │
                    │   service request    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Provider is         │
                    │  registered?         │
                    └────┬─────────┬───────┘
                         │         │
                    YES  │         │  NO
                         │         │
              ┌──────────▼──┐  ┌──▼──────────────┐
              │ pending_    │  │ onboarding_      │
              │ provider_   │  │ required         │
              │ confirmation│  │ (not bookable)   │
              └──────┬──────┘  └──────────────────┘
                     │
              ┌──────▼──────┐
              │ confirmed_  │  (simulated in demo)
              │ internal    │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │ completed   │  (simulated in demo)
              └─────────────┘
```

---

## Labels Shown in Mobile App

| Condition | Label in App |
|-----------|-------------|
| Registered provider booking | 🟢 **Real Booking Record** |
| Google Places provider | 🟡 **Discovery Log Only** |
| Firestore saved | 🔥 **Firestore Saved** |
| Customer message | **PREVIEW ONLY — NOT SENT** |
| Provider message | **PREVIEW ONLY — NOT SENT** |
| Channel badge | **CH: preview** |
| Language toggle | 🌐 **Show Roman Urdu** / **Show English** |
| Notification strategy | 📡 section with safety rules |
| Booking note (registered) | "Provider would confirm in production" |
| Booking note (unregistered) | "Onboarding required before booking" |

---

## Why This Matters

1. **Hackathon judges** can verify we never falsely claim to contact real providers.
2. **Privacy** — no real phone numbers or SMS are sent.
3. **Integrity** — every action is either genuinely real (Firestore record) or transparently labeled as a preview.
4. **Auditability** — the `booking_events` + `notifications` collections provide a complete event trail.
5. **Bilingual** — messages are generated in both English and Roman Urdu to serve Pakistan market.

