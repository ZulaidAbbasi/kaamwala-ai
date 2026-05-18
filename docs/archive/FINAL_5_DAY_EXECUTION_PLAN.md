# KaamWala AI — Final 5-Day Execution Plan (Real MVP)

**Deadline:** May 21, 2026
**Start Date:** May 16, 2026
**Architecture:** Real backend (Firebase Cloud Functions) + Expo mobile app

---

## Priority Rules

> [!CAUTION]
> **Real working MVP first. No fake data. No secrets in mobile app. Mandatory submissions only.**

| Priority | Deliverable | Status |
|----------|------------|--------|
| 🔴 P0 | Mobile App (real backend, real APIs) | ⬜ |
| 🔴 P0 | GitHub Repository (clean, secure) | ⬜ |
| 🔴 P0 | Demo Video | ⬜ |
| 🔴 P0 | Antigravity Usage Video | ⬜ |
| 🔴 P0 | README / Documentation | ⬜ |
| 🔴 P0 | Antigravity Traces | ⬜ |
| 🟡 Skip | Web App | ❌ |

---

## Day-by-Day Breakdown

### Day 1 — May 16 (Friday): Backend + Firebase + NLU

**Goal:** Cloud Functions deployed with parse-request endpoint. Mobile app skeleton calling backend.

| # | Task | Hours | Deliverable |
|---|------|-------|-------------|
| 1 | Confirm cloud setup (19-item checklist) | 0.5 | All APIs enabled, keys ready |
| 2 | Create service account `kaamwala-backend` | 0.25 | Service account created |
| 3 | Initialize Firebase project with Cloud Functions | 0.5 | `firebase init functions` done |
| 4 | Configure backend secrets (Gemini + Maps keys) | 0.25 | `firebase functions:config:set` |
| 5 | Build `POST /api/parse-request` endpoint | 2.0 | Gemini NLU via backend |
| 6 | Scaffold Expo + TypeScript mobile app | 0.5 | App runs on device |
| 7 | Set up mobile `.env` (Firebase config + API URL) | 0.25 | Config ready |
| 8 | Build request input screen | 1.0 | User can type Urdu text |
| 9 | Connect mobile → backend → show parsed result | 1.5 | End-to-end NLU flow |
| 10 | Deploy Cloud Functions | 0.25 | Backend live |
| 11 | Seed 3 test provider profiles in Firestore | 0.5 | Providers in DB |
| 12 | Git init + first commit + push | 0.25 | Repo live |

**Day 1 Exit Criteria:**
- [ ] Cloud Function `parse-request` deployed and responding
- [ ] Mobile app calls backend → Gemini parses demo request
- [ ] 3 test providers seeded in Firestore
- [ ] No API keys in mobile app code
- [ ] GitHub repo has first commit

---

### Day 2 — May 17 (Saturday): Discovery + Ranking + Booking

**Goal:** Full discovery → rank → book flow via backend. Bookings only for registered providers.

| # | Task | Hours | Deliverable |
|---|------|-------|-------------|
| 1 | Build `POST /api/discover-providers` | 2.0 | Places + Geocoding + Distance Matrix |
| 2 | Build `POST /api/rank-providers` | 2.0 | Gemini ranking with registered merge |
| 3 | Build `POST /api/create-booking` | 1.5 | Real booking for registered only |
| 4 | Build provider results screen (ranked list) | 1.5 | Shows bookable vs not-registered |
| 5 | Build booking confirmation screen | 1.0 | Real booking record created |
| 6 | Agent trace logging for all 3 endpoints | 1.0 | Traces stored in Firestore |
| 7 | Deploy updated functions | 0.25 | Backend updated |
| 8 | Commit + push | 0.25 | Repo updated |

**Day 2 Exit Criteria:**
- [ ] Real Google Places providers found for G-13
- [ ] Registered + Google providers merged in ranking
- [ ] Registered providers show "Book Now"
- [ ] Unregistered show "Not yet on KaamWala"
- [ ] Booking creates real Firestore document
- [ ] Agent traces logged for each step

---

### Day 3 — May 18 (Sunday): Notifications + Recovery + Traces

**Goal:** Complete agentic loop with fallback recovery and full trace viewer.

| # | Task | Hours | Deliverable |
|---|------|-------|-------------|
| 1 | Build `POST /api/send-notification` | 1.0 | Notification record/preview |
| 2 | Build `POST /api/fallback/provider-cancelled` | 2.0 | Cancellation + re-rank + rebook |
| 3 | Build `GET /api/traces/:workflowId` | 0.5 | Return full trace |
| 4 | Build notification preview screen | 0.75 | Shows message that would be sent |
| 5 | Build cancellation + recovery screen | 1.5 | Fallback provider shown |
| 6 | Build agent trace viewer screen | 1.5 | All 7 steps visible |
| 7 | Build baseline comparison view | 1.0 | Side-by-side comparison |
| 8 | End-to-end test: full demo flow | 1.0 | All 11 steps work |
| 9 | Deploy + commit + push | 0.5 | Everything deployed |

**Day 3 Exit Criteria:**
- [ ] Full demo flow works end-to-end
- [ ] Cancellation triggers recovery with fallback provider
- [ ] Agent trace shows all 7 agentic steps
- [ ] Baseline comparison renders
- [ ] All backend endpoints deployed and working

---

### Day 4 — May 19 (Monday): Polish + Documentation + QA

**Goal:** App is demo-ready. README complete. All submission materials prepared.

| # | Task | Hours | Deliverable |
|---|------|-------|-------------|
| 1 | UI polish — colors, typography, animations | 2.0 | Professional look |
| 2 | Error handling + loading states | 1.0 | No crashes |
| 3 | Write README.md (full hackathon quality) | 1.5 | README complete |
| 4 | Export Antigravity traces | 0.5 | Traces saved |
| 5 | Finalize Firestore security rules | 0.5 | Rules applied |
| 6 | Run full QA checklist | 1.0 | All items pass |
| 7 | Clean GitHub repo | 0.5 | Repo ready |
| 8 | Security scan — no keys in code | 0.25 | Scan clean |
| 9 | Final deploy + commit | 0.25 | Everything live |

**Day 4 Exit Criteria:**
- [ ] App runs flawlessly on demo device
- [ ] README is complete
- [ ] QA checklist fully passed
- [ ] Security scan shows no leaked keys
- [ ] Feature freeze — no more code changes

---

### Day 5 — May 20–21 (Tuesday): Videos + Submission

| # | Task | Hours | Who |
|---|------|-------|-----|
| 1 | Record product demo video | 1.0 | YOU |
| 2 | Record Antigravity usage video | 1.0 | YOU |
| 3 | Upload videos | 0.5 | YOU |
| 4 | Final GitHub push | 0.25 | Both |
| 5 | Submit all deliverables | 0.5 | YOU |
| 6 | Verify submission | 0.25 | YOU |

---

## What We Are NOT Building

- ❌ Web dashboard
- ❌ User authentication (use demo mode if time short)
- ❌ Real SMS/WhatsApp sending
- ❌ Provider-side app
- ❌ Interactive maps
- ❌ Payment integration
- ❌ Push notifications
- ❌ Voice input
- ❌ Chat interface

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Cloud Functions cold start in demo | Warm up before recording |
| Places API no results for G-13 | Pre-test with multiple search terms |
| Gemini rate limits | Cache responses during dev |
| Backend deploy fails | Test locally with emulator first |
| Running out of credits | Budget alert at 40% |
