# KaamWala AI — Provider Onboarding Flow

**Last Updated:** 2026-05-16

---

## Overview

KaamWala AI has two types of service providers:

| Type | Source | Bookable? | Label |
|------|--------|-----------|-------|
| **Discovered** | Google Places API | ❌ No | "Discovered — onboarding required" |
| **Registered** | Our Firestore `provider_profiles` | ✅ Yes | "KaamWala Provider" or "Verified KaamWala Provider" |

---

## Why This Matters

Real booking confirmation is only allowed for registered providers because:

1. **Safety** — We can't book a service at a random Google listing
2. **Accountability** — Registered providers have profiles, ratings, and history
3. **Transparency** — Judges can see the clear boundary between discovered and bookable
4. **Honesty** — We never falsely claim a Google Places provider has accepted a booking

---

## Demo Registered Providers

For hackathon judging, 3 controlled demo providers are seeded:

| Provider | Service | Area | Visit Fee | Rating |
|----------|---------|------|-----------|--------|
| CoolTech AC Solutions | AC Repair, HVAC | G-13 area | PKR 1,500 | 4.5 |
| Bright Sparks Electrical | Electrical, Wiring | F-10 area | PKR 1,200 | 4.2 |
| PakFlow Plumbing Services | Plumbing, Pipes, Geyser | G-14 area | PKR 1,000 | 4.7 |

### Important Clarifications

- ✅ These are **demo-controlled** providers created for safe judging
- ✅ Contact emails use `@kaamwala-demo.test` domain (non-routable)
- ✅ No real phone numbers are stored
- ❌ They are NOT random Google businesses
- ❌ They are NOT real providers accepting real jobs

---

## Seed Process

### Via Mobile App

1. Open KaamWala AI
2. Navigate to **🔧 Providers** from Home
3. Tap **🌱 Seed Controlled Demo Providers**
4. Providers appear in the list

### Via API

```bash
# Seed providers
curl -X POST http://localhost:5001/kaamwala-ai/us-central1/api/seedDemoProviders

# List all providers
curl http://localhost:5001/kaamwala-ai/us-central1/api/providers

# Get one provider
curl http://localhost:5001/kaamwala-ai/us-central1/api/providers/prov_demo_ac_01
```

---

## Provider Profile Fields

| Field | Type | Demo Value Example |
|-------|------|-------------------|
| providerId | string | `prov_demo_ac_01` |
| ownerUid | string | `demo_owner_01` |
| businessName | string | `CoolTech AC Solutions` |
| serviceCategories | string[] | `['ac_repair', 'hvac']` |
| serviceAreas | string[] | `['G-13', 'G-12', 'G-11']` |
| contactEmail | string? | `demo-cooltech@kaamwala-demo.test` |
| contactPhone | string? | `undefined` (no real numbers) |
| verified | boolean | `true` |
| active | boolean | `true` |
| source | enum | `demo-controlled` |
| locationArea | string | `G-13, Islamabad` |
| geo | object? | `{ lat: 33.631, lng: 73.027 }` |
| baseVisitFee | number | `1500` (PKR) |
| availability | object | `{ days: [...], timeSlots: [...] }` |
| internalRating | number | `4.5` |
| completedJobs | number | `47` |
| cancellationCount | number | `2` |

---

## Matching Logic

When Google Places results arrive, each is checked against registered providers:

```
For each Google Place result:
  1. Check placeId match → upgrade to registered
  2. Check name similarity → upgrade to registered
  3. Check geo proximity (< 500m) → upgrade to registered
  4. No match → remains "Discovered — onboarding required"
```

---

## Future: Real Provider Onboarding

In a production system, the onboarding flow would be:

1. Provider finds their Google Places listing
2. Provider claims the listing
3. KaamWala verifies ownership
4. Provider sets pricing, availability, and service areas
5. Provider is marked as `source: 'registered'`
6. Provider becomes bookable

*This is not implemented in the MVP — only demo-controlled providers are seeded.*
