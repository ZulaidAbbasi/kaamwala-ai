# Tool Calls & Actions — KaamWala AI

> Files created, edited, and commands executed by Antigravity.

---

## Files Created by Antigravity

### Backend (functions/src/)

| File | Purpose |
|------|---------|
| `index.ts` | Express app with 13 routes |
| `endpoints/parseRequest.ts` | Gemini NLU endpoint |
| `endpoints/discoverProviders.ts` | Places + registered provider search |
| `endpoints/rankProviders.ts` | 12-factor ranking |
| `endpoints/estimatePrice.ts` | Dynamic pricing |
| `endpoints/createBooking.ts` | Booking with eligibility checks |
| `endpoints/simulateFollowUp.ts` | Service lifecycle |
| `endpoints/fallbackRecovery.ts` | 4 recovery endpoints |
| `endpoints/runWorkflow.ts` | Full pipeline orchestrator |
| `endpoints/evaluateOutcome.ts` | 12-metric evaluation |
| `endpoints/diagnostics.ts` | 7-test system diagnostics |
| `endpoints/providers.ts` | Registered provider CRUD |
| `services/gemini/geminiClient.ts` | Gemini API client + fallback |
| `services/gemini/geminiFallback.ts` | Keyword-based NLU fallback |
| `services/maps/mapsClient.ts` | HTTP client for Google APIs |
| `services/maps/placesService.ts` | Places API (New) search |
| `services/maps/geocodingService.ts` | Geocoding API |
| `services/maps/distanceService.ts` | Distance Matrix API |
| `services/rankingEngine.ts` | 12-factor scoring |
| `services/pricingEngine.ts` | Market-rate estimation |
| `services/bookingService.ts` | Firestore booking records |
| `services/registeredProviderService.ts` | Demo provider registry |
| `services/notifications/notificationService.ts` | Bilingual message preview |
| `services/traceService.ts` | Agent trace logging |
| `agents/serviceOrchestrator.ts` | Pipeline orchestrator |
| `agents/outcomeEvaluatorAgent.ts` | 12-metric evaluator |
| `utils/safeLogger.ts` | Redacted logging |
| `types/*.ts` | TypeScript interfaces |

### Mobile (src/)

| File | Purpose |
|------|---------|
| `screens/HomeScreen.tsx` | Orchestrator hub with pipeline animation |
| `screens/ServiceRequestScreen.tsx` | Roman Urdu input + AI understanding |
| `screens/AIUnderstandingScreen.tsx` | Detailed NLU breakdown |
| `screens/ProviderDiscoveryScreen.tsx` | Real provider cards |
| `screens/ProviderRankingScreen.tsx` | 12-factor ranking visualization |
| `screens/DynamicPricingScreen.tsx` | Price estimate + breakdown |
| `screens/BookingScreen.tsx` | Booking with Firestore badge |
| `screens/FollowUpTimelineScreen.tsx` | 10-step lifecycle |
| `screens/FallbackRecoveryScreen.tsx` | 6 scenario buttons |
| `screens/OutcomeEvaluationScreen.tsx` | Score circle + before/after |
| `screens/AgentTraceScreen.tsx` | 7-phase trace viewer |
| `screens/BaselineComparisonScreen.tsx` | 9-dimension comparison |
| `screens/AntigravityEvidenceScreen.tsx` | Capability categories |
| `screens/FinalSubmissionChecklistScreen.tsx` | Live health + checklist |
| `screens/ProviderOnboardingScreen.tsx` | 5-step onboarding flow |
| `screens/RegisteredProvidersScreen.tsx` | Provider list |
| `screens/ApiSetupStatusScreen.tsx` | 10-test diagnostics |

### Documentation (docs/)

29 files — see `docs/` folder listing.

---

## Commands Executed

| Command | Purpose | Count |
|---------|---------|-------|
| `npm run build` | Backend TypeScript compilation | 20+ |
| `npm run typecheck` | Mobile TypeScript verification | 20+ |
| `npx expo start --web` | Web bundle verification | 3 |
| `Select-String` | File content search | 50+ |
| `Get-ChildItem` | Directory listing | 30+ |

---

## 📸 Screenshot Placeholder

```
[ ] Screenshot: Antigravity creating an endpoint file
[ ] Screenshot: Terminal showing npm run build → exit 0
[ ] Screenshot: Antigravity running typecheck
```
