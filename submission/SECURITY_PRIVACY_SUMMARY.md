# Security & Privacy Summary

> How KaamWala AI handles security and privacy responsibly.

---

## API Key Security

| Rule | How |
|------|-----|
| Keys in backend only | All keys in Cloud Functions env vars |
| No keys in mobile app | `src/` contains zero API keys |
| No keys in responses | Health endpoint shows `AIza...xxxx` (masked) |
| No keys in logs | `safeLogger.ts` redacts all key patterns |
| No keys in git | `.gitignore` blocks .env, *.key, service-account*.json |
| Security audit passed | `docs/GITHUB_SECURITY_AUDIT.md` — 10-section audit |

## Privacy Rules

| Rule | Implementation |
|------|---------------|
| No PII to Gemini | Prompts contain service type and location only |
| No random contacts | Only opted-in registered providers receive any communication |
| No real SMS/WhatsApp | Notifications are preview-only |
| Anonymous auth | No personal data collected for demo |
| Firestore rules | Access restricted to authenticated users |

## Simulation Boundaries

| Action | Status | Label |
|--------|--------|-------|
| Understanding request | 🟢 Real | `BACKEND DECISION` |
| Discovering providers | 🟢 Real | `REAL GOOGLE PLACES` |
| Ranking providers | 🟢 Real | `12-FACTOR SCORING` |
| Estimating price | 🟢 Real | `ESTIMATED` |
| Booking registered provider | 🟢 Real | `FIRESTORE SAVED` |
| Booking unregistered provider | ❌ Blocked | `ONBOARDING REQUIRED` |
| Sending SMS/WhatsApp | ❌ Blocked | `PREVIEW ONLY — NOT SENT` |
| Provider acceptance | 🔸 Simulated | `DEMO MODE` |
| Follow-up timeline | 🔸 Simulated | `SIMULATED TIMELINE` |

## What We Don't Do

- ❌ Contact random Google Places businesses
- ❌ Send SMS to unknown phone numbers
- ❌ Store personal customer data
- ❌ Claim unregistered providers are booked
- ❌ Log API keys anywhere
- ❌ Ship secrets in mobile bundle
