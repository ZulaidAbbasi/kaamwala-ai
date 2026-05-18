# KaamWala AI — Privacy & Safety Plan

**Last Updated:** 2026-05-16

---

## Core Commitment

> **We do not store, process, or transmit real personal information of any person who has not explicitly opted in.**

---

## What We Store

| Data | Source | Contains Real PII? | Justification |
|------|--------|-------------------|---------------|
| Firebase Anonymous UID | Firebase Auth | ❌ No | Random identifier, no name/email/phone |
| Service request text | User input | ⚠️ Possible | User may type their own address — we don't extract or store PII fields separately |
| Provider profiles | Seeded by us | ❌ No | Demo data with `@kaamwala.test` emails |
| Google Places results | Google API | ❌ No | Public business listings |
| Booking records | System-generated | ❌ No | Links anonymous UID to demo provider |
| Agent traces | System-generated | ❌ No | Decision logs, no PII |

---

## What We Never Do

| Action | Status | Why |
|--------|--------|-----|
| Store real names of real people | ❌ Never | Privacy |
| Store real phone numbers | ❌ Never | Anti-spam, privacy |
| Store real email addresses (except team) | ❌ Never | Privacy |
| Store CNIC/national ID | ❌ Never | Legal requirement |
| Contact real Google Places businesses | ❌ Never | Harassment/spam |
| Send real SMS/WhatsApp to strangers | ❌ Never | Spam |
| Track real user location | ❌ Never | Privacy — we geocode area names, not GPS |
| Store payment information | ❌ Never | PCI compliance |
| Share data with third parties | ❌ Never | Data protection |

---

## Demo Provider Data

All test providers use controlled, non-real data:

| Field | Value Format | Real? |
|-------|-------------|-------|
| Business name | "KaamWala Demo [Service]" | ❌ Fake name |
| Email | `demo-*@kaamwala.test` | ❌ Non-routable domain |
| Phone | Not set | ❌ Empty |
| Address | Real area names (G-13, etc.) | ⚠️ Real area, not specific address |
| Rating | 4.1–4.5 | ❌ Demo values |
| Coordinates | Approximate area center | ⚠️ Real coordinates for area |

---

## Privacy Flags

Every user document has a `privacySafe` field:

```typescript
interface User {
  // ...
  privacySafe: boolean;  // true = no real PII stored for this user
}
```

For the hackathon, all users are anonymous → `privacySafe: true`.

---

## User Input Handling

Users may type personal information in their service request. Our approach:

1. **We don't ask for PII.** The input prompt says "describe what you need" not "enter your name and phone."
2. **Gemini extracts service intent only.** The NLU prompt explicitly instructs Gemini to extract service type, location area, urgency, and budget — not personal information.
3. **Raw text is stored** in `service_requests.rawText` for debugging. If a user typed their phone number, it would be in this field. This is acceptable because:
   - The user is anonymous (no identity linked)
   - The data is in a user-owned document (only they can read it)
   - We don't process or use any PII from the text

---

## Data Retention

| Data Type | Retention | Reason |
|-----------|----------|--------|
| Anonymous auth session | Until app cleared | Firebase default |
| Service requests | Indefinite (hackathon) | Demo evidence |
| Bookings | Indefinite (hackathon) | Demo evidence |
| Agent traces | Indefinite (hackathon) | Judge review |
| Provider profiles | Indefinite | Seeded data |

**Post-hackathon:** All Firestore data can be deleted by deleting the Firebase project.

---

## Google API Data Handling

| API | Data Received | Data Stored | Data Returned to User |
|-----|--------------|-------------|----------------------|
| Google Places | Public business listings | Place ID, name, rating, address | All (it's public data) |
| Geocoding | Coordinates for area names | lat/lng for area center | Area name + coordinates |
| Distance Matrix | Travel distance/time | Distance + duration values | Distance + duration |
| Gemini | AI-generated analysis | Reasoning text + structured output | All (no PII in prompts) |

We do NOT send personal information to any Google API. Our Gemini prompts contain only the service request text (which we instruct to contain service needs, not PII).

---

## Notification Safety

All notifications are **preview-only** — no real messages are ever dispatched.

| Rule | Enforced? | How |
|------|----------|-----|
| No real SMS sent | ✅ Yes | `notificationService.ts` — channel is always `preview` |
| No real WhatsApp sent | ✅ Yes | No WhatsApp integration configured |
| No real email sent | ✅ Yes | `sendEmailNotification()` returns `sent: false` |
| Opted-in provider required | ✅ Yes | No provider contacts stored without opt-in |
| Messages saved to Firestore | ✅ Yes | `notifications` collection with `status: preview_only` |
| `simulation: true` flag | ✅ Yes | Every notification record is flagged |
| `actuallyDelivered` field | ✅ Yes | Always `null` / not set |
| Bilingual previews | ✅ Yes | English + Roman Urdu generated for each message |
| Labels in mobile app | ✅ Yes | "PREVIEW ONLY — NOT SENT", channel badges, safety labels |

### Notification Types

| Type | Recipient | When Generated |
|------|----------|---------------|
| `booking_confirmation` | Customer | After booking created |
| `new_job_request` | Provider | After booking created |
| `cancellation_apology` | Customer | After provider cancels |
| `dispute_resolution` | Customer/Provider | After dispute resolved |

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| Authentication | Firebase Anonymous Auth (upgradeable) |
| Authorization | Firestore security rules + backend validation |
| Secret management | Backend env vars only, never in client |
| Transport | HTTPS for all API calls |
| Logging | safeLogger.ts redacts all key patterns |
| Data minimization | Only store what's needed for the workflow |
| No tracking | No analytics PII, no fingerprinting |

---

## Compliance Notes (Informational)

This is a hackathon prototype. In production, the following would need to be addressed:

| Requirement | Status | Production Path |
|-------------|--------|----------------|
| GDPR-style consent | Not applicable (no EU users, no PII) | Add consent flow |
| Pakistan's data protection | Informational only | PECA compliance review |
| Right to deletion | Supported (delete Firebase project) | Add per-user deletion API |
| Data breach notification | Not applicable (no PII stored) | Add incident response plan |
| Terms of Service | Not created | Required for production |
| Privacy Policy | Not created | Required for production |
