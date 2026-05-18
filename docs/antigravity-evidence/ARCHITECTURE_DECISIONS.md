# Architecture Decisions — KaamWala AI

> Key architecture decisions made during Antigravity-assisted development.

---

## Decision 1: Backend-Only Secrets

**Problem:** Mobile apps can be decompiled. API keys must never be in client code.

**Decision:** All Google API keys (Gemini, Maps, Places, Geocoding, Distance) live exclusively in Cloud Functions environment variables. Mobile app communicates only via HTTPS to our backend.

**Evidence:**
- `functions/.env` contains keys (gitignored)
- `src/config/api.ts` contains only our backend URL
- No `GOOGLE_MAPS_API_KEY` anywhere in `src/`

---

## Decision 2: Deterministic Ranking

**Problem:** Using Gemini to rank providers would produce non-reproducible results.

**Decision:** 12-factor deterministic scoring engine. Gemini only explains decisions — it does NOT choose the provider.

**Factors:** service relevance, distance, rating, review count, open status, registration, verified status, availability, price fit, urgency fit, data completeness, risk flags.

**Evidence:** `functions/src/services/rankingEngine.ts`

---

## Decision 3: Honest Data Normalization

**Problem:** Google Places often returns incomplete data (missing rating, phone, hours).

**Decision:** Never invent data. Missing fields are `null` with warnings, not fabricated defaults.

**Evidence:** `functions/src/services/maps/placesService.ts` → `normalizeGooglePlaceToProviderCandidate()`

---

## Decision 4: Registered vs Discovered Provider Distinction

**Problem:** Google Places providers haven't agreed to our platform.

**Decision:** Only registered providers get confirmed bookings. Discovered-only providers show "ONBOARDING REQUIRED" — transparent about the boundary.

**Evidence:** `functions/src/services/registeredProviderService.ts`

---

## Decision 5: Simulation Boundaries

**Problem:** We cannot contact real providers or send real SMS in a demo.

**Decision:** All actions that would affect real people are labeled "SIMULATION" or "PREVIEW ONLY." Firestore records are real, but notifications are preview-only.

**Evidence:** `docs/PRIVACY_SAFETY.md`, booking screen labels

---

## Decision 6: Agent Trace Architecture

**Problem:** Judges need to see that the system reasons, not just outputs.

**Decision:** Every agentic step logged to Firestore `workflow_traces` collection with: phase, action, data, confidence, timestamp, reasoning chain.

**Evidence:** `functions/src/services/traceService.ts`, `src/screens/AgentTraceScreen.tsx`

---

## Decision 7: Fallback-First API Design

**Problem:** Gemini or Maps APIs can fail, but the app must not crash.

**Decision:** Every API call has a deterministic fallback. Fallback results are clearly labeled with lower confidence.

**Evidence:**
- `geminiClient.ts` → keyword fallback (confidence: 0.35)
- `placesService.ts` → empty result with warning
- `distanceService.ts` → straight-line calculation

---

## 📸 Screenshot Placeholder

> **ACTION REQUIRED:** Add screenshots of Antigravity conversations where these decisions were discussed.

```
[ ] Screenshot: "Backend-only secrets" discussion
[ ] Screenshot: "Deterministic ranking vs Gemini ranking" decision
[ ] Screenshot: "Honest normalization" decision
[ ] Screenshot: "Simulation boundaries" discussion
```
