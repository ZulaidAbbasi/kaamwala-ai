# Security & Privacy — KaamWala AI

## Core Principle

All API keys and secrets are stored **backend-only**. The mobile app never contains Google API keys, Firebase Admin credentials, or any sensitive tokens.

## Architecture

```
Mobile App → Cloud Functions (backend) → Google APIs
                                       → Firestore
                                       → Gemini
                                       → Places
```

## What is Protected

| Item | Protection |
|------|-----------|
| Google Maps/Places API key | Backend environment only |
| Gemini API key | Backend environment only |
| Firebase Admin credentials | Auto-injected by Cloud Functions |
| User data | No PII collected; area-level location only |
| Firestore | Production security rules restrict client writes |
| SMS/WhatsApp | Never sent — all notifications are simulation previews |

## Mobile App Security

- Anonymous Firebase Auth (no passwords, no emails)
- Client Firestore SDK is restricted by production security rules
- No sensitive data in `.env` except public Firebase config (standard for mobile apps)
- No hardcoded API keys in source code

## Simulation Boundaries

All simulated actions are clearly labeled:
- "Safe Simulation"
- "No Real SMS Sent"
- "Onboarding Required"
- "Not Final Quote"
- "Fallback Used"

## Firestore Security Rules

See: [FIRESTORE_SECURITY_RULES.md](./FIRESTORE_SECURITY_RULES.md)
