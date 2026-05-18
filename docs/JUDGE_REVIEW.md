# Judge Review Guide — KaamWala AI

**Team Panthers** · Challenge 2: Agentic AI Application

---

## What KaamWala AI Does

KaamWala AI is an agentic service orchestrator for Pakistan's informal economy. A user types a natural-language request (in Roman Urdu, English, or mixed) and the AI agent:

1. **Understands** the intent (Gemini 2.0 Flash NLU)
2. **Discovers** real nearby providers (Google Places API + Registered Providers)
3. **Ranks** them intelligently (multi-factor scoring)
4. **Estimates** pricing (market-based algorithm with PKR range + confidence)
5. **Books** the service (real Firestore record for registered providers)
6. **Follows up** (reminder, confirmation, completion, feedback)
7. **Recovers** from failures (provider cancellation → backup search + bilingual apology)
8. **Traces** every decision (full agentic audit trail)

---

## How to Test

### Quick Demo (30 seconds)
1. Open the app → tap **"Run Demo Scenario"**
2. Watch the 8-step workflow animate in the live stepper
3. See the 9-section result: Request, Provider, Reasoning, Price, Booking, Follow-up, Recovery, Traces, Alternatives

### Custom Request
1. Tap **"Start Service Request"**
2. Type: `"Mujhe DHA Phase 2 mein plumber chahiye aaj shaam"`
3. Observe: service=Plumber, location=DHA Phase 2, time=evening
4. Results are NOT hardcoded — real Google Places providers

### GPS Search
1. Tap **"Use Current Location"** on the request screen
2. Type: `"Need electrician near me today"`
3. Results use actual GPS coordinates

### Provider Dashboard (Real Booking Lifecycle)
1. From Home → tap **"📋 Provider Dashboard"**
2. See pending bookings
3. **Accept** → status becomes `confirmed`
4. **Complete** → status becomes `completed` with feedback badge
5. **Reject** → fallback recovery triggers, backup found

### Fallback Recovery Testing
1. From Home → tap **"🔄 Fallback Recovery"**
2. Test all 6 scenarios: Provider Cancellation, No Provider Found, Low Confidence, API Failure, Price Dispute, Missing Location
3. Each shows: State Before → AI Reasoning → Recovery Action → State After

---

## Architecture

```
User → React Native App → Firebase Cloud Functions (Express)
                                  ├── Gemini 2.0 Flash (NLU)
                                  ├── Service Taxonomy (14 categories, keyword matching)
                                  ├── Google Places API (Discovery + Relevance Filter)
                                  ├── Firestore (Bookings, Traces, Providers)
                                  └── Recovery Agent (Fallback)
```

- **Development IDE:** Google Antigravity (as required)
- **Runtime:** App runs independently — no external orchestrator
- **Backend:** Firebase Cloud Functions (Node.js 22, TypeScript)
- **AI Model:** Gemini 2.0 Flash (free tier, with fallback parser)
- **Database:** Firestore (15 collections)
- **Maps:** Google Places API + Geocoding + Distance Matrix
- **Search Relevance:** Centralized taxonomy with post-search filtering (no dental for car wash)

---

## Result Screen — 9 Sections

| # | Section | What It Shows |
|---|---------|---------------|
| 1 | 📝 Service Request | Parsed intent, language, location, urgency, confidence |
| 2 | 🏆 Recommended Provider | Name, rating, distance, badges, action buttons (Maps/Call/Web) |
| 3 | 💡 Reasoning | Human-readable explanation + visual factor bars |
| 4 | 💰 Price Estimation | PKR range, recommended estimate, confidence %, breakdown |
| 5 | 📋 Booking | Real booking (registered) / Inquiry (Google Places) + Firestore |
| 6 | 📅 Follow-up | Reminder, confirmation, completion, feedback scheduled |
| 7 | 🔄 Recovery | Cancellation scenario, backup provider, bilingual apology |
| 8 | 🤖 Agent Workflow | 8-step trace checklist + "View Full Trace" button |
| 9 | 📍 Other Options | Alternative providers with expand/collapse |

---

## Key Differentiators

### 1. Real Booking Lifecycle (Not Simulated)
- Registered providers get real Firestore booking records
- Status machine: `pending` → `confirmed` → `completed`
- Provider Admin dashboard with Accept/Reject/Complete actions
- Google Places providers honestly labeled "Onboarding Required"

### 2. Honest About Limitations
- Never says "booking confirmed" when it isn't
- Never says "SMS sent" when no SMS was sent
- Clear distinction: "Real Booking Record" vs "Inquiry Record"
- Badges: "Registered Provider" vs "Onboarding Required"

### 3. Bilingual Recovery
- When provider cancels, the system:
  - Detects the issue
  - Re-ranks remaining providers
  - Finds a backup
  - Generates customer update in English AND Urdu

### 4. Full Agentic Trace
- Every decision logged with: agent name, phase, reasoning, confidence, latency
- Viewable in "Agent Traces" screen
- Proves the AI is making real decisions, not following a script

### 5. Search Relevance Guardrails
- "Car wash" → only car wash results (never dental/clinic/restaurant)
- "Need service near me" → asks clarification (never random search)
- Taxonomy-based filtering with 14 service categories

---

## Firestore Collections

| Collection | Records | Purpose |
|-----------|---------|---------| 
| `service_requests` | Per workflow | Parsed user intent |
| `provider_profiles` | 5 demo | Registered bookable providers |
| `bookings` | Per booking | Real booking records |
| `booking_events` | Per action | State transition audit |
| `follow_up_results` | Per booking | Timeline schedule |
| `notification_previews` | Per booking | Message previews |
| `agent_traces` | Per decision | Full agentic decision log |
| `price_estimates` | Per workflow | Pricing estimates |
| `fallback_events` | Per recovery | Recovery records |
| `outcome_evaluations` | Per workflow | Performance scores |

---

## Build Info

| Item | Value |
|------|-------|
| Frontend TypeScript | 0 errors |
| Backend TypeScript | 0 errors |
| Navigator Screens | 13 registered |
| Demo Providers | 5 seeded |
| API Endpoint | https://api-zbyomuiceq-uc.a.run.app |
| Backend Status | ok (Gemini ✓, Maps ✓, Firestore ✓) |
