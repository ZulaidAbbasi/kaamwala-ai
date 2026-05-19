# KaamWala AI — Technical Documentation

## #AISeekho 2026 · Challenge 2: Agentic AI · Team Panthers

🌐 **Live Web Demo:** https://kaamwala-ai.psychemetric.org/
📦 **GitHub:** https://github.com/ZulaidAbbasi/kaamwala-ai
📱 **APK:** https://expo.dev/accounts/zulaidabbasi/projects/kaamwala-ai/builds/b6a1bf1d-a19d-4032-bf87-349818bd2ec3

---

## 1. Solution Overview

**KaamWala AI** is an autonomous, agentic service orchestrator that transforms unstructured Roman Urdu/Urdu/English requests into fully traced, transparently priced bookings — without any human intervention.

**One-Line Pitch:**
> KaamWala AI turns "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye" into a fully executed, AI-reasoned, transparently priced booking using real Google APIs, real Firestore records, and a complete Observe → Reason → Act → Recover agent loop.

### What Makes It Truly Agentic

KaamWala AI is **NOT** a listing app. It is an **autonomous agent** that:

| Traditional Booking App | KaamWala AI (Agentic) |
|------------------------|----------------------|
| User searches manually by keyword | Agent understands natural-language intent in Roman Urdu |
| Shows nearest provider, no reasoning | Agent ranks using 12 weighted factors with explanations |
| No pricing information | Agent estimates fair market price with PKR breakdown |
| Crashes on failure | Agent detects failure, reasons about cause, recovers automatically |
| No audit trail | Every decision traced with agent name, phase, confidence, latency |
| Single path: search → list → pick | Full loop: Observe → Reason → Act → Evaluate → Recover |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│               MOBILE & WEB APP (Expo + React Native Web)           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ 23 React     │  │ Firebase     │  │ API Client (HTTPS)       │  │
│  │ Native       │  │ Anonymous    │  │ → Cloud Functions        │  │
│  │ Screens      │  │ Auth         │  │ → All keys backend-only  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS (secured)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│               CLOUD FUNCTIONS BACKEND (Express + TypeScript)       │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    14 API ENDPOINTS                            │ │
│  │  /parseRequest  /discoverProviders  /rankProviders             │ │
│  │  /estimatePrice /createBooking      /simulateFollowUp          │ │
│  │  /simulateProviderCancellation      /resolveDispute            │ │
│  │  /handleNoProviderFound             /handleLowConfidenceRequest│ │
│  │  /runWorkflow   /evaluateOutcome    /diagnostics   /health     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Gemini AI    │  │ Google       │  │ Service Orchestrator     │  │
│  │ (6-model     │  │ Places API   │  │ (8-Step Pipeline)        │  │
│  │  cascade)    │  │ Geocoding    │  │ 12-Factor Ranking        │  │
│  │ + Fallback   │  │ Distance     │  │ Market-Rate Pricing      │  │
│  │   Parser     │  │ Matrix       │  │ Trace Logger             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Admin SDK (server-side)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE (15 Collections)              │
│                                                                     │
│  service_requests │ provider_candidates │ ranking_decisions         │
│  price_estimates  │ bookings            │ booking_events            │
│  notifications    │ follow_up_plans     │ fallback_events           │
│  outcome_evaluations │ registered_providers │ provider_profiles     │
│  workflow_traces  │ agent_traces        │ _diagnostics              │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Design Principle:** The mobile/web app **NEVER** calls Google APIs directly. All API keys live in the backend only. The app communicates exclusively through secure Cloud Functions endpoints.

---

## 3. The 8-Step Agentic Workflow

Every user request triggers a fully autonomous 8-step pipeline. **No human intervention between steps.**

```
OBSERVE → UNDERSTAND → REASON → DECIDE → ACT → EVALUATE → RECOVER (if needed)
   ↑                                                          │
   └──────────────────────────────────────────────────────────┘
```

| Step | Agent Phase | What Happens | Output |
|------|------------|-------------|--------|
| 1 | **UNDERSTAND** | Gemini NLU parses Roman Urdu → structured JSON | `service: AC Repair, location: G-13, urgency: tomorrow_morning, language: roman_urdu` |
| 2 | **DISCOVER** | Google Places API + Firestore registered providers | 5–12 real provider candidates with ratings, reviews, distance |
| 3 | **RANK** | 12-factor deterministic scoring engine | Provider A: 87/100, Provider B: 72/100 — with per-factor breakdown |
| 4 | **PRICE** | Market-rate estimation algorithm | PKR 2,500–4,500, recommended: 3,200, confidence: 78% |
| 5 | **BOOK** | Creates real Firestore booking record | `booking_abc123`, status: `pending_provider_confirmation` |
| 6 | **FOLLOW-UP** | Schedules 10-step lifecycle | Reminder → confirmation → completion → feedback timeline |
| 7 | **RECOVER** | Tests failure scenario — provider cancels → re-ranks | Backup provider found, bilingual apology generated |
| 8 | **TRACE** | Logs every decision to Firestore | 8–15 trace records per workflow, fully explainable |

**Implementation:** `functions/src/agents/serviceOrchestrator.ts`

---

## 4. Agents Developed

### 4.1 Service Orchestrator Agent (Master Pipeline)
- **File:** `functions/src/agents/serviceOrchestrator.ts`
- **Role:** Chains all 8 steps with typed inputs/outputs, 15-second timeouts per step, and step-by-step UI callbacks
- **Agency:** Autonomously decides next step, handles errors, triggers recovery

### 4.2 NLU Understanding Agent
- **File:** `functions/src/services/gemini/geminiClient.ts`
- **Role:** Multilingual NLU — parses Roman Urdu, Urdu, English, and mixed-language into structured JSON
- **Agency:** 6-model auto-switching cascade; if one model is rate-limited, automatically tries the next
- **Fallback:** `functions/src/services/gemini/geminiFallback.ts` — deterministic regex parser if all 6 AI models fail

### 4.3 Discovery Agent
- **Files:** `functions/src/services/maps/placesService.ts`, `geocodingService.ts`, `distanceService.ts`
- **Role:** Converts area names to coordinates (Geocoding), searches nearby providers (Places API), calculates travel time (Distance Matrix), merges with registered Firestore providers
- **Agency:** Autonomously handles API failures by serving registered providers only

### 4.4 Ranking Agent
- **File:** `functions/src/services/rankingService.ts` (457 lines)
- **Role:** 12-factor deterministic scoring engine (weights sum = 1.0)
- **Agency:** Same input always produces same ranking — fully transparent, never random
- **12 Factors:** distance (0.14), registered bonus (0.15), service relevance (0.12), rating (0.10), price fit (0.08), verified status (0.08), data completeness (0.07), review strength (0.06), availability (0.06), open status (0.05), missing penalty (0.05), urgency fit (0.04)

### 4.5 Pricing Agent
- **File:** `functions/src/services/pricingService.ts`
- **Role:** Market-rate estimation with complexity × urgency multipliers
- **Agency:** Produces PKR range (low/high/recommended) with confidence score

### 4.6 Recovery Agent
- **File:** `functions/src/services/fallbackService.ts`
- **Role:** Handles 6 autonomous failure scenarios
- **Agency:** Detects failure → reasons about cause → re-ranks → suggests backup → generates bilingual apology

| # | Scenario | Recovery Action |
|---|----------|----------------|
| 1 | Provider cancels | Re-rank remaining → assign backup → bilingual apology |
| 2 | No provider found | Expand search radius → suggest related categories |
| 3 | Low confidence parse | Show assumptions → ask clarifying questions |
| 4 | Google Places API failure | Serve registered providers only |
| 5 | Price dispute | Show detailed breakdown → adjust assumptions |
| 6 | Missing location | Prompt for location → use city default |

### 4.7 Outcome Evaluator Agent
- **File:** `functions/src/agents/outcomeEvaluatorAgent.ts`
- **Role:** Grades workflow performance across 12 metrics (A/B/C/D)
- **Agency:** Autonomous scoring with before/after comparison

### 4.8 Trace Logger Agent
- **File:** `functions/src/services/traceLogger.ts`
- **Role:** Records every decision with agent name, phase, reasoning, confidence score, and latency
- **Agency:** 8–15 trace records per workflow, stored in Firestore `agent_traces`

---

## 5. Real vs Simulated APIs

### ✅ REAL APIs (Live Data — Every Call Hits Production)

| # | API | Purpose | Evidence |
|---|-----|---------|----------|
| 1 | **Gemini API** (6-model cascade) | NLU, ranking explanation, pricing, messaging | Parses "AC kaam nahi kar raha" → `{service: "AC Repair", confidence: 0.92}` |
| 2 | **Google Places API (New)** | Real provider discovery | Returns actual businesses: Abbasi Electric, CoolTech AC |
| 3 | **Geocoding API** | Area names → coordinates | "G-13 Islamabad" → `{lat: 33.631, lng: 73.027}` |
| 4 | **Distance Matrix API** | Real travel distance/time | Real km + minutes per provider |
| 5 | **Firebase Firestore** | 15 collections, all writes real | Documents with IDs, timestamps, status machine |
| 6 | **Firebase Auth** | Anonymous authentication | Secure, zero-friction |
| 7 | **Firebase Cloud Functions** | 14 Express endpoints | All API keys stored here, never in client |

**Every API call is live. No hardcoded responses. No mock data.**

### ⚠️ SIMULATED (And Why — Ethically)

| Feature | Why Simulated | Honesty Label |
|---------|--------------|---------------|
| Provider acceptance | Cannot contact random businesses found on Google | `SIMULATION` |
| SMS/WhatsApp sending | Cannot message unknown numbers — unethical and illegal | `PREVIEW ONLY — NOT SENT` |
| Follow-up lifecycle | Real timeline would take hours/days | `SIMULATED TIMELINE` |

**Why?** Contacting random Google Places businesses or sending SMS to unknown numbers would be unethical and potentially illegal. We simulate these clearly and honestly — while keeping everything else real.

---

## 6. Integration Implementation

### 6.1 Gemini AI Integration (6-Model Cascade)

```
Request → gemini-3.1-flash-lite → If rate-limited → gemini-2.5-flash-lite →
  → gemini-3-flash-preview → gemini-2.5-flash → gemma-4-31b-it → gemma-4-26b-a4b-it
```

| Priority | Model | RPM | RPD | Role |
|----------|-------|-----|-----|------|
| 1 | `gemini-3.1-flash-lite` | 15 | 500 | Primary |
| 2 | `gemini-2.5-flash-lite` | 10 | 20 | Secondary |
| 3 | `gemini-3-flash-preview` | 5 | 20 | Tertiary |
| 4 | `gemini-2.5-flash` | 5 | 20 | Quaternary |
| 5 | `gemma-4-31b-it` | 15 | 1500 | Heavy fallback |
| 6 | `gemma-4-26b-a4b-it` | 15 | 1500 | Ultimate fallback |

**5 AI Functions:** parseServiceRequest, classifyServiceWithGemini, explainRankingDecision, generateCustomerMessage, generateDisputeResolutionMessage

### 6.2 Google Maps Integration

- **Places API (New):** Nearby business discovery with category filtering and reject types
- **Geocoding API:** Text → coordinates conversion for location-aware search
- **Distance Matrix API:** Real travel distance/time calculations for ranking

### 6.3 Firebase Integration

- **Cloud Functions:** 14 Express endpoints deployed as HTTPS callable functions
- **Firestore:** 15 collections with Admin SDK writes (client cannot write)
- **Auth:** Anonymous authentication for zero-friction demo

### 6.4 Service Taxonomy (14 Categories)

| Category | Roman Urdu Example | Google Places Types |
|----------|-------------------|---------------------|
| AC Repair | "ac kaam nahi kar raha" | hvac_contractor, electrician |
| Electrician | "bijli ka kaam chahiye" | electrician |
| Plumber | "pani leak ho raha hai" | plumber |
| Carpenter | "darwaza toot gaya" | carpenter |
| Car Wash | "gaari dhulwani hai" | car_wash |
| Mechanic | "gaari kharab ho gayi" | car_repair |
| Cleaning | "ghar saaf karwana hai" | cleaning_service |
| Painter | "kamra paint karwana" | painter |
| Tutor | "bachon ko padhana hai" | school |
| Beauty/Salon | "makeup karwana hai" | beauty_salon |
| Computer Repair | "laptop kharab hai" | electronics_store |
| Mobile Repair | "phone ki screen tooti" | cell_phone_store |
| Car Rental | "gaari kiraye pe chahiye" | car_rental |
| Cooking/Chef | "khana banane wala chahiye" | restaurant (filtered) |

---

## 7. 14 Backend API Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/health` | Backend health check |
| 2 | POST | `/parseRequest` | Gemini NLU multilingual parsing |
| 3 | POST | `/discoverProviders` | Places + registered provider search |
| 4 | POST | `/rankProviders` | 12-factor ranking + Gemini explanation |
| 5 | POST | `/estimatePrice` | Dynamic price estimation (PKR) |
| 6 | POST | `/createBooking` | Booking with eligibility checks |
| 7 | POST | `/simulateFollowUp` | 10-step lifecycle simulation |
| 8 | POST | `/simulateProviderCancellation` | Cancellation recovery test |
| 9 | POST | `/resolveDispute` | Dispute / fallback scenarios |
| 10 | POST | `/handleNoProviderFound` | No-provider recovery |
| 11 | POST | `/handleLowConfidenceRequest` | Low-confidence handling |
| 12 | POST | `/runWorkflow` | Full 8-step pipeline orchestrator |
| 13 | POST | `/evaluateOutcome` | 12-metric outcome evaluation |
| 14 | POST | `/diagnostics` | System health diagnostics |

**Live Backend:** `https://api-zbyomuiceq-uc.a.run.app`

---

## 8. 23 Mobile & Web Screens

### Core Workflow (7 Screens)
| # | Screen | Purpose |
|---|--------|---------|
| 1 | PitchHomeScreen | Product landing — hero, status badges, pipeline visualization |
| 2 | HomeScreen | Quick actions hub — all navigation |
| 3 | ServiceRequestScreen | Free-text input with language detection |
| 4 | ServiceRequestEntryScreen | Editable parsed request with location/time |
| 5 | LiveWorkflowScreen | Real-time 8-step vertical stepper with animations |
| 6 | WorkflowResultScreen | 9-section pitch-deck results page |
| 7 | WinningDemoScreen | One-tap guided demo for judges |

### Agentic Pipeline (9 Screens)
| # | Screen | Purpose |
|---|--------|---------|
| 8 | AIUnderstandingScreen | NLU parse details, confidence, language |
| 9 | ProviderDiscoveryScreen | Real Google Places results + registered matches |
| 10 | ProviderRankingScreen | 12-factor scoring breakdown per provider |
| 11 | DynamicPricingScreen | PKR range, recommended, confidence, breakdown |
| 12 | BookingScreen | Booking creation with eligibility check |
| 13 | FollowUpTimelineScreen | 10-step lifecycle visualization |
| 14 | FallbackRecoveryScreen | 6 failure scenario tests with before/after |
| 15 | AgentTraceScreen | Full decision audit trail timeline |
| 16 | OutcomeEvaluationScreen | 12-metric performance scoring |

### Admin & System (7 Screens)
| # | Screen | Purpose |
|---|--------|---------|
| 17 | ProviderAdminScreen | Booking lifecycle dashboard |
| 18 | ProviderOnboardingScreen | Provider registration flow |
| 19 | RegisteredProvidersScreen | Registered provider list |
| 20 | ApiSetupStatusScreen | System architecture — 8 service checks |
| 21 | BaselineComparisonScreen | Normal app vs KaamWala AI side-by-side |
| 22 | AntigravityEvidenceScreen | Antigravity usage proof for judges |
| 23 | FinalSubmissionChecklistScreen | Pre-submission readiness checks |

---

## 9. Firestore Database Schema (15 Collections)

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `service_requests` | Parsed NLU results | serviceType, location, urgency, confidence, language |
| `workflow_traces` | Agent decision logs | phase, action, confidence, reasoning, latencyMs |
| `provider_candidates` | Discovered providers | name, rating, source, distance, placeId |
| `ranking_decisions` | Ranking results | scores[], factors[], explanation, totalScore |
| `price_estimates` | Pricing results | low, high, recommended, breakdown[], confidence |
| `bookings` | Booking records | status, provider, price, timestamps, customerUid |
| `booking_events` | Lifecycle events | eventType, timestamp, previousStatus, newStatus |
| `notifications` | Message previews (never sent) | channel, messageEnglish, messageUrdu |
| `follow_up_plans` | Follow-up timelines | steps[], checklist[], scheduledTimes |
| `fallback_events` | Recovery records | scenario, stateBefore, recovery, stateAfter |
| `outcome_evaluations` | Performance scores | 12 metrics, grade (A/B/C/D) |
| `registered_providers` | Onboarded providers | name, services[], verified, active, location |
| `provider_profiles` | Extended profiles | ratings, completedJobs, availability |
| `agent_traces` | Per-decision audit trail | agentName, phase, reasoning, confidence, latencyMs |
| `_diagnostics` | System test records | (transient — auto-deleted) |

### Booking State Machine
```
pending_provider_confirmation → confirmed → completed
                              → rejected → (fallback recovery triggered)
                              → cancelled → (re-rank + backup found)
```

---

## 10. Security & Privacy

| Rule | Implementation |
|------|---------------|
| API keys backend-only | All keys in Cloud Functions env vars, never in mobile code |
| No key logging | `safeLogger.ts` redacts all sensitive values automatically |
| No random provider contact | Only registered providers receive any communication |
| No real SMS | All notifications are preview-only, clearly labeled |
| Anonymous auth | No personal data collected — Firebase Anonymous Auth |
| Firestore security rules | All writes denied at rule level, reads auth-gated |
| Admin SDK writes | All Firestore writes go through server-side Admin SDK |

---

## 11. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile & Web** | React Native (Expo SDK 53) + TypeScript | 23-screen app + Web Build |
| **Backend** | Firebase Cloud Functions (Node.js 22) + Express | 14 secure API endpoints |
| **Database** | Cloud Firestore | 15 collections, real-time data |
| **Auth** | Firebase Anonymous Auth | Zero-friction demo auth |
| **AI/NLU** | Gemini API (6-model cascade) | Multilingual understanding |
| **Discovery** | Google Places API (New) | Real provider search |
| **Location** | Geocoding API + Distance Matrix | Coordinates + travel time |
| **Development** | Google Antigravity | IDE + coding assistant |

---

## 12. How Google Antigravity Was Used

Google Antigravity was the **primary development IDE** for every phase. The entire project was built through Antigravity conversations.

| Phase | What Antigravity Did |
|-------|---------------------|
| Architecture Design | Designed agentic OBSERVE→RECOVER loop, 12-factor ranking, 15 Firestore collections |
| Backend Code Generation | Generated 40 TypeScript files for Firebase Cloud Functions |
| Mobile App Development | Built 23 React Native screens with premium dark theme |
| API Integration | Built Gemini 6-model cascade, Places API, Geocoding, Distance Matrix |
| Firebase/GCP Setup | Guided Firebase project creation, Firestore rules, Cloud Functions deployment |
| Error Recovery & Debugging | Fixed 15+ build errors, APK crash, Firebase init crash |
| UI Design & Polish | Created premium dark theme, 14 UI components |
| QA & Documentation | E2E workflow tests, secret scans, 52 documentation files |

---

## 13. Challenge 2 Requirements Compliance

| # | Requirement | Status | Implementation |
|---|-------------|--------|---------------|
| 1 | Intent Understanding | ✅ READY | 6-model Gemini cascade, Roman Urdu/Urdu/English support |
| 2 | Provider Discovery | ✅ READY | Google Places API + Firestore registered providers |
| 3 | Matching & Ranking | ✅ READY | 12-factor deterministic scoring engine (457 lines) |
| 4 | Decision & Recommendation | ✅ READY | Top provider + alternatives with explainable reasoning |
| 5 | Action Simulation | ✅ READY | Real Firestore bookings, notifications, state machine |
| 6 | Follow-Up Automation | ✅ READY | 10-step lifecycle timeline saved to Firestore |
| 7 | Agentic Workflow | ✅ READY | 8-step pipeline with full trace logging and recovery |

---

*Built by Team Panthers · Developed with Google Antigravity · Powered by Firebase + Gemini*
*#AISeekho 2026 · Challenge 2: Agentic AI*
