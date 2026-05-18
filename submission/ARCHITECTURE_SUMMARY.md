# Architecture Summary

> Quick-reference architecture for hackathon judges.

---

## System Architecture

```
┌─────────────────────────────────────┐
│  📱 Mobile App (Expo + TypeScript)  │
│  17 screens, pipeline animation     │
│  Firebase Auth (anonymous)          │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│  ☁️ Cloud Functions (Express + TS)  │
│  18 routes, 11 endpoint handlers    │
│  try/catch on ALL endpoints         │
├─────────────────────────────────────┤
│  🤖 Gemini 2.0 Flash               │
│  • Multilingual NLU (parse)         │
│  • Ranking explanation              │
│  • Message generation               │
│  • Dispute analysis                  │
├─────────────────────────────────────┤
│  🗺️ Google Maps Platform           │
│  • Places API (New) — discovery     │
│  • Geocoding API — location         │
│  • Distance Matrix — travel time    │
├─────────────────────────────────────┤
│  🔥 Firebase Firestore             │
│  15 collections, 31 write ops       │
│  Real persistence, not localStorage │
└─────────────────────────────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Backend-only API keys | Mobile apps can be decompiled |
| Deterministic ranking | Reproducible, auditable — Gemini explains, doesn't choose |
| Honest null handling | Missing data = null, not fabricated defaults |
| Registered vs discovered distinction | Cannot book unregistered businesses |
| Simulation labels | Ethical — no random provider contact |
| Keyword fallback parser | Graceful degradation when Gemini is unavailable |

## Agentic Pipeline

```
Step 1: UNDERSTAND  → Gemini NLU (Roman Urdu/English)
Step 2: DISCOVER    → Places API + registered provider DB
Step 3: RANK        → 12-factor deterministic scoring
Step 4: PRICE       → Market-rate estimation (PKR)
Step 5: BOOK        → Firestore record (registered only)
Step 6: FOLLOW-UP   → 10-step lifecycle (optional)
Step 7: RECOVER     → 6 fallback scenarios
Step 8: EVALUATE    → 12 metrics + baseline comparison
```
