<div align="center">

# KaamWala AI

### Agentic AI Service Orchestrator for Pakistan's Informal Economy

**#AISeekho 2026 — Google Antigravity Hackathon · Challenge 2: Agentic AI**

**Team Panthers** · Built with Google Antigravity · Powered by Firebase + Gemini

</div>

---

## One-Line Pitch

> **KaamWala AI turns an unstructured Roman Urdu service request into a fully traced, AI-reasoned, transparently priced booking -- using real Google APIs, real Firestore records, and a complete Observe -> Reason -> Act -> Recover agent loop.**

---

## Expected Output

```
Service Request:
  AC Technician
Location:
  G-13
Time:
  Tomorrow morning
Recommended Provider:
  CoolTech AC Solutions (2.1 km away)
Reasoning:
  Closest available registered provider with highest 12-factor score (87/100).
  Selected over 10 other candidates from Google Places API.
Simulated Booking:
  - Slot booked: 10:00 AM
  - Confirmation sent
Follow-up:
  Reminder scheduled 1 hour before appointment
```

### Extended Output (what KaamWala AI actually produces beyond the minimum)

```
Language Detection:
  Roman Urdu (detected by Gemini AI, confidence: 1.0)

Price Estimation:
  Range: PKR 945 - 4,620
  Recommended: PKR 2,100

Booking Details:
  - Booking ID: book_wf_cffb7600-377_1779046043792
  - Status: pending_provider_confirmation
  - Customer notification: preview sent (no real SMS)
  - Provider notification: preview sent (no real SMS)
  - Firestore record: created with event trail

Full Follow-up Lifecycle (10 steps):
  1. Booking Created
  2. Reminder scheduled 30 min before
  3. Provider en-route notification
  4. Provider arrived notification
  5. Diagnosis & inspection checklist (11 items)
  6. Work completed confirmation
  7. Feedback requested from customer
  8. Rating captured (4.5/5)
  9. Provider metrics updated in Firestore
  10. Future matching impact evaluated

Recovery (if provider cancels):
  - Auto re-rank remaining candidates
  - Backup provider assigned
  - Bilingual apology sent (English + Urdu)

Agent Trace (7 records):
  [orchestrator] parse -> discover -> rank -> price -> book
  [understand]   Gemini NLU: AC Repair, G-13, tomorrow_morning
  [discover]     Google Places: 10 providers + 1 registered
  [rank]         12-factor scoring: CoolTech selected
  [price]        PKR 945-4,620, recommended PKR 2,100
  [book]         Firestore booking + 2 notifications
  [evaluate]     5/5 steps, 0 warnings, 13.4s

All data verified from live API: POST /runWorkflow
```

---

## Challenge 2 Requirements Compliance

### 1. Intent Understanding -- READY

- Processes natural language input via AI (6-model auto-switching cascade)
- Supports: **Urdu**, **Roman Urdu**, **English**, and **mixed-language** input
- Extracts: **service type**, **location**, **time**, **urgency**, **budget**, **language**
- 100% AI-driven parsing with zero keyword dependencies
- Implementation: `functions/src/services/gemini/geminiClient.ts`

### 2. Provider Discovery -- READY

- Uses: **Google Places API (New)** for real nearby provider search
- Uses: **Firestore registered_providers** collection for opted-in providers
- Uses: **Geocoding API** to resolve area names to coordinates
- Uses: **Distance Matrix API** for real travel distance/time
- Identifies: nearby providers + service category match via taxonomy
- Implementation: `functions/src/services/maps/placesService.ts`

### 3. Matching & Ranking -- READY

- Ranks providers using **12 weighted factors** (sum = 1.0):
  - distance, availability, rating, review strength, open status
  - registered bonus, verified status, price fit, urgency fit
  - data completeness, service relevance, missing penalty
- Provides **clear reasoning** for selection with per-factor breakdown
- **Deterministic**: same input always produces same ranking
- Implementation: `functions/src/services/rankingService.ts` (457 lines)

### 4. Decision & Recommendation -- READY

- Selects **best provider** based on highest total score
- Shows **top 3-5 alternatives** with expand/collapse
- Explains decision in **simple terms** via Gemini-generated explanation
- Displays: name, rating, distance, badges, action buttons (Maps/Call/Web)

### 5. Action Simulation (CRITICAL) -- READY

System simulates all required actions:
- **Booking confirmation**: Real Firestore document with booking ID, timestamps, status
- **Provider assignment**: Selected provider linked to booking with eligibility check
- **Scheduling**: Time-aware slot assignment based on urgency extraction
- **Mock booking system**: Firestore `bookings` collection with state machine
- **Confirmation message**: Bilingual preview (English + Urdu) -- labeled "PREVIEW ONLY"
- **Database writes**: Real Firestore records in `bookings`, `booking_events`, `notifications`
- **Booking receipt**: Full breakdown shown in WorkflowResultScreen
- Implementation: `functions/src/endpoints/createBooking.ts`

### 6. Follow-Up Automation -- READY

Simulates complete post-booking lifecycle:
- **Reminders**: 1-hour pre-appointment reminder scheduled
- **Status updates**: Provider confirmation, en-route, arrived notifications
- **Completion confirmation**: Mark-as-completed step with timestamp
- **Feedback collection**: Post-service rating request (2 hours after)
- 10-step lifecycle timeline saved to Firestore
- Implementation: `functions/src/endpoints/simulateFollowUp.ts`

### 7. Agentic Workflow (MANDATORY) -- READY

System demonstrates:
- **8-step structured reasoning pipeline**: Understand -> Discover -> Rank -> Price -> Book -> Follow-Up -> Recover -> Trace
- **Planning -> Decision -> Action -> Follow-up** flow with no human intervention
- **Traceable logs** of:
  - All decisions (agent name, phase, reasoning, confidence score)
  - All tool usage (Gemini calls, Places API calls, Firestore writes)
  - All action execution (booking creation, notification generation, recovery)
- 8-15 agent trace records per workflow, stored in Firestore `agent_traces`
- **Recovery agent**: Detects failure, re-ranks, suggests backup, generates apology
- Implementation: `functions/src/agents/serviceOrchestrator.ts`

---


## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution — What Makes It Agentic](#solution--what-makes-it-agentic)
3. [System Architecture](#system-architecture)
4. [8-Step Agentic Workflow](#8-step-agentic-workflow)
5. [Gemini AI Model Cascade](#gemini-ai-model-cascade)
6. [Google APIs & Tools Used](#google-apis--tools-used)
7. [What Is Real vs Simulated](#what-is-real-vs-simulated)
8. [12-Factor Ranking Engine](#12-factor-ranking-engine)
9. [Service Taxonomy & NLU](#service-taxonomy--nlu)
10. [Backend API Endpoints](#backend-api-endpoints)
11. [Firestore Database Schema](#firestore-database-schema)
12. [Mobile Screens](#mobile-screens)
13. [Security & Privacy](#security--privacy)
14. [How Google Antigravity Was Used](#how-google-antigravity-was-used)
15. [Fallback & Recovery Scenarios](#fallback--recovery-scenarios)
16. [Baseline Comparison](#baseline-comparison)
17. [Demo Scenarios](#demo-scenarios)
18. [Setup Instructions](#setup-instructions)
19. [Cost & Scalability](#cost--scalability)
20. [Assumptions & Limitations](#assumptions--limitations)
21. [Future Improvements](#future-improvements)
22. [Project Structure](#project-structure)
23. [Tech Stack](#tech-stack)
24. [Documentation Index](#documentation-index)

---

## Problem Statement

In Pakistan, over **60 million informal workers** provide essential services — AC repair, plumbing, electrical, carpentry, beauty, tutoring. Yet finding the right provider is still:

| Pain Point | Impact |
|-----------|--------|
| **Word of mouth only** | Limited to personal networks; no discovery for newcomers |
| **WhatsApp groups** | Unstructured, no accountability, no quality tracking |
| **Door-to-door search** | Time-consuming, unsafe (especially for women and elderly) |
| **No price transparency** | Customers have zero reference for fair market rates |
| **No fallback system** | If a provider cancels, the customer starts over from zero |
| **No traceability** | No record of who was contacted, why chosen, what happened |
| **Language barrier** | No system works in Urdu or Roman Urdu — the language of 220M+ people |

**The gap:** There is no system that works in **Urdu/Roman Urdu**, discovers **real local providers**, ranks them **transparently with reasoning**, estimates **fair pricing**, and handles **failures gracefully** — all autonomously.

---

## Solution — What Makes It Agentic

KaamWala AI is **NOT** a provider listing app. It is an **agentic service orchestrator** — an autonomous AI system that:

1. **Understands** natural language in Roman Urdu, Urdu, English, and mixed input
2. **Discovers** real providers using Google Places API + registered provider database
3. **Reasons** over incomplete real-world data using 12-factor scoring
4. **Decides** transparently with explainable ranking rationale
5. **Acts** by creating real Firestore booking records
6. **Evaluates** outcomes with automated follow-up scheduling
7. **Recovers** from failure by re-ranking and suggesting replacements
8. **Traces** every decision with confidence scores for full accountability

### What Makes This Different From a Normal App

| Traditional Booking App | KaamWala AI (Agentic) |
|------------------------|----------------------|
| User searches manually by keyword | Agent understands natural-language intent in Roman Urdu |
| Shows nearest provider, no reasoning | Agent ranks using 12 weighted factors with explanations |
| No pricing information | Agent estimates fair market price with PKR breakdown |
| Crashes or shows error on failure | Agent detects failure, reasons about cause, recovers automatically |
| No audit trail | Every decision traced with agent name, phase, confidence, latency |
| Single path: search → list → pick | Full loop: Observe → Reason → Act → Evaluate → Recover |

### The Agentic Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTIC ORCHESTRATION LOOP                   │
│                                                                 │
│  OBSERVE → UNDERSTAND → REASON → DECIDE → ACT → EVALUATE →     │
│                          ↑                            │          │
│                          └──────── RECOVER ───────────┘          │
│                                                                 │
│  Every request passes through ALL 8 phases.                     │
│  Every phase is logged. Every decision is explainable.          │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MOBILE APP (Expo + TypeScript)                │
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
│               CLOUD FUNCTIONS BACKEND (Express + TypeScript)      │
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
│  │ Gemini 2.5   │  │ Google       │  │ Service Orchestrator     │  │
│  │ Flash        │  │ Places API   │  │ (8-Step Pipeline)        │  │
│  │ (6-model     │  │ Geocoding    │  │                          │  │
│  │  cascade)    │  │ Distance     │  │ 12-Factor Ranking        │  │
│  │              │  │ Matrix       │  │ Market-Rate Pricing      │  │
│  │ + Fallback   │  │              │  │ Trace Logger             │  │
│  │   Parser     │  │              │  │ Fallback Recovery Agent  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Admin SDK (server-side)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE (15 Collections)           │
│                                                                     │
│  service_requests │ provider_candidates │ ranking_decisions         │
│  price_estimates  │ bookings            │ booking_events            │
│  notifications    │ follow_up_plans     │ fallback_events           │
│  outcome_evaluations │ registered_providers │ provider_profiles     │
│  workflow_traces  │ agent_traces        │ _diagnostics              │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Design Principle:** The mobile app **NEVER** calls Google APIs directly. All API keys live in the backend only. The app communicates exclusively through secure Cloud Functions endpoints.

---

## 8-Step Agentic Workflow

Every user request triggers a fully autonomous 8-step pipeline. No human intervention between steps.

```
Input: "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye"
       (Translation: My AC is completely not working, I need a technician
        tomorrow morning in G-13, budget is not high)
```

| Step | Agent Phase | What Happens | Output |
|------|------------|-------------|--------|
| 1 | **UNDERSTAND** | Gemini NLU parses Roman Urdu → structured JSON | `service: AC Repair, location: G-13, urgency: tomorrow_morning, language: roman_urdu, confidence: 0.92` |
| 2 | **DISCOVER** | Google Places API searches near geocoded G-13 + queries registered providers from Firestore | 5–12 real provider candidates with ratings, reviews, distance |
| 3 | **RANK** | 12-factor deterministic scoring engine ranks all candidates | Provider A: 87/100, Provider B: 72/100 — with per-factor breakdown |
| 4 | **PRICE** | Market-rate estimation algorithm analyzes service type, location, urgency | PKR 2,500–4,500, recommended: 3,200, confidence: 78% |
| 5 | **BOOK** | Creates real Firestore booking record for registered providers | `booking_abc123`, status: `pending_provider_confirmation` |
| 6 | **FOLLOW-UP** | Schedules 10-step lifecycle: reminder → confirmation → completion → feedback | Firestore timeline with scheduled timestamps |
| 7 | **RECOVER** | Tests failure scenario — provider cancels → re-ranks → suggests replacement | Backup provider found, bilingual apology generated |
| 8 | **TRACE** | Logs every decision to `agent_traces` collection with confidence scores | 8–15 trace records per workflow, fully explainable |

### Orchestration Pipeline Code

The pipeline is implemented in `functions/src/agents/serviceOrchestrator.ts` with:
- **Typed step definitions** — each step has input/output types
- **15-second timeout per step** via AbortController
- **Step-by-step callbacks** for real-time UI updates
- **Defensive error handling** — no raw JS errors reach the user

---

## AI Model Cascade

KaamWala AI uses a **6-model auto-switching cascade** strategy to maximize reliability across rate limits, offering 3,000+ daily requests:

```
Request → Try Model 1 → If rate-limited/error → Auto-switch to Model 2 → ... → AI Unavailable
```

| Priority | Model | RPM | RPD | Role |
|----------|-------|-----|-----|------|
| 1 | `gemini-3.1-flash-lite` | 15 | 500 | Primary — highest quota |
| 2 | `gemini-2.5-flash-lite` | 10 | 20 | Secondary |
| 3 | `gemini-3-flash-preview` | 5 | 20 | Tertiary |
| 4 | `gemini-2.5-flash` | 5 | 20 | Quaternary |
| 5 | `gemma-4-31b-it` | 15 | 1500 | Heavy fallback (unlimited TPM) |
| 6 | `gemma-4-26b-a4b-it` | 15 | 1500 | Ultimate fallback (unlimited TPM) |

### 5 AI Functions

| # | Function | Purpose | Fallback |
|---|----------|---------|----------|
| 1 | `parseServiceRequest(rawText)` | Multilingual NLU — Roman Urdu/Urdu/English → structured JSON | Retry with simpler prompt → Graceful Error |
| 2 | `classifyServiceWithGemini(text)` | Semantic service categorization (14 categories) | Taxonomy keyword matching |
| 3 | `explainRankingDecision(data)` | Human-readable ranking explanation | Template-based explanation |
| 4 | `generateCustomerMessage(data)` | Bilingual customer notification (English + Urdu) | Template message |
| 5 | `generateDisputeResolutionMessage(data)` | Dispute analysis and resolution | Default resolution |

### Fallback Design Philosophy

Every AI call has a **deterministic fallback** — the system NEVER crashes:

| Failure Scenario | What Happens | Confidence |
|-----------------|-------------|------------|
| AI returns invalid JSON | Auto-repair attempt with simpler prompt | 0.50 |
| AI API unavailable (all 6 models) | Graceful error "AI unavailable, try again" | 0.00 |
| AI returns incomplete fields | Patch missing fields with defaults | 0.50 |
| AI fully works | Full AI understanding | 0.85–1.00 |

---

## Google APIs & Tools Used

### Runtime APIs (Live in Production)

| # | API | Purpose | Where Used | Evidence |
|---|-----|---------|-----------|----------|
| 1 | **Gemini API** (6-model cascade) | Natural language understanding, ranking explanation, pricing, messaging | `functions/src/services/gemini/geminiClient.ts` | Parses Roman Urdu, Urdu, English, mixed |
| 2 | **Google Places API (New)** | Real provider discovery — returns actual businesses near user location | `functions/src/services/maps/placesService.ts` | Real AC shops, plumbers, electricians from Google |
| 3 | **Geocoding API** | Converts area names ("G-13 Islamabad") to lat/lng coordinates | `functions/src/services/maps/geocodingService.ts` | Enables location-aware search |
| 4 | **Distance Matrix API** | Calculates real travel distance and time between user and providers | `functions/src/services/maps/distanceService.ts` | Used in ranking factor: `distanceProximity` |
| 5 | **Firebase Firestore** | Real-time database for bookings, traces, providers, evaluations | `functions/src/config/firebaseAdmin.ts` | 15 collections, all writes are real |
| 6 | **Firebase Auth** | Anonymous authentication for demo (no PII collected) | `src/services/auth/authService.ts` | Secure, zero-friction |
| 7 | **Firebase Cloud Functions** | Secure backend — all API keys stored here, never in mobile app | `functions/src/index.ts` | 14 Express endpoints |

### Development Tool

| Tool | Purpose |
|------|---------|
| **Google Antigravity** | Primary IDE and coding assistant — used for architecture design, code generation, debugging, API integration, UI design, QA, and documentation |

**Every API call is live.** No hardcoded responses. No mock data. If an API is down, the system falls back gracefully with lower confidence — and tells the user it did.

---

## What Is Real vs Simulated

### What Is Real (API-Powered — Live Data)

| Feature | API Used | Proof |
|---------|---------|-------|
| Roman Urdu understanding | Gemini AI | "AC kaam nahi kar raha" → `{service: "AC Repair", confidence: 0.92}` |
| Provider discovery | Google Places API | Returns real businesses — Abbasi Electric, CoolTech AC, PakFlow Plumbing |
| Location resolution | Geocoding API | "G-13 Islamabad" → `{lat: 33.631, lng: 73.027}` |
| Travel distance | Distance Matrix API | Real km + minutes per provider |
| Booking records | Firestore | Real documents with IDs, timestamps, status machine |
| Agent traces | Firestore | 8–15 trace records per workflow, fully queryable |
| Ranking scores | Deterministic engine | Same input always produces same ranking |

### What Is Simulated (And Why — Ethically)

| Feature | Why Simulated | Honesty Label |
|---------|--------------|---------------|
| Provider acceptance | Cannot contact random businesses found on Google | `SIMULATION` |
| SMS/WhatsApp sending | Cannot message unknown numbers — unethical and illegal | `PREVIEW ONLY — NOT SENT` |
| Provider confirmation | Requires real provider opt-in | `DEMO MODE` |
| Follow-up lifecycle | Real timeline would take hours/days | `SIMULATED TIMELINE` |

**Why simulate these?** Contacting random Google Places businesses or sending SMS to unknown numbers would be **unethical and potentially illegal**. We simulate these interactions clearly and honestly — while keeping everything else real.

---

## 12-Factor Ranking Engine

The ranking engine uses **12 weighted factors** (sum = 1.0) for deterministic, transparent scoring:

| # | Factor | Weight | What It Measures |
|---|--------|--------|-----------------|
| 1 | `serviceRelevance` | 0.12 | How well the provider's category matches the requested service |
| 2 | `distanceProximity` | 0.14 | Inverse distance from user — closer = higher score |
| 3 | `ratingScore` | 0.10 | Google/internal rating normalized to 0–1 |
| 4 | `reviewStrength` | 0.06 | Number of reviews (log-scaled) — more reviews = more reliable |
| 5 | `openStatus` | 0.05 | Is the provider currently open or within operating hours |
| 6 | `registeredBonus` | 0.15 | **Highest weight** — registered providers get significant bonus |
| 7 | `verifiedActive` | 0.08 | Is the provider verified and actively accepting bookings |
| 8 | `availabilityFit` | 0.06 | Does provider's schedule match the requested time |
| 9 | `priceFit` | 0.08 | Does the provider's pricing tier match the user's budget |
| 10 | `urgencyFit` | 0.04 | Can the provider handle the requested urgency level |
| 11 | `dataCompleteness` | 0.07 | How complete is the provider's data (rating, phone, address) |
| 12 | `missingPenalty` | 0.05 | Negative score for critical missing data fields |

### Key Design Decisions

- **Deterministic:** Same input always produces same ranking — no randomness
- **Transparent:** Every factor's raw value, normalized score, and weighted contribution is visible
- **Gemini explains but never overrides:** AI generates human-readable explanation AFTER scoring
- **Registered provider advantage:** `registeredBonus` (0.15) rewards providers who opted into the platform

**Implementation:** `functions/src/services/rankingService.ts` (457 lines)

---

## Service Taxonomy & NLU

KaamWala AI uses a **Gemini-first, taxonomy-fallback** approach to understand what service the user needs:

### 14+ Service Categories

| Category | Example Roman Urdu | Example English | Google Places Types |
|----------|-------------------|-----------------|-------------------|
| AC Repair | "ac kaam nahi kar raha" | "AC technician needed" | hvac_contractor, electrician |
| Electrician | "bijli ka kaam chahiye" | "electrical wiring fix" | electrician |
| Plumber | "pani leak ho raha hai" | "pipe is leaking" | plumber |
| Car Wash | "gaari dhulwani hai" | "need car wash" | car_wash |
| Mechanic | "gaari kharab ho gayi" | "car not starting" | car_repair |
| Cleaning | "ghar saaf karwana hai" | "house cleaning" | cleaning_service |
| Carpenter | "darwaza toot gaya" | "door repair" | carpenter |
| Painter | "kamra paint karwana" | "room painting" | painter |
| Tutor | "bachon ko padhana hai" | "home tutor needed" | school |
| Beauty/Salon | "makeup karwana hai" | "bridal makeup" | beauty_salon |
| Computer Repair | "laptop kharab hai" | "computer not working" | electronics_store |
| Mobile Repair | "phone ki screen tooti" | "screen cracked" | cell_phone_store |
| Car Rental | "gaari kiraye pe chahiye" | "rent a car" | car_rental |
| Cooking/Chef | "khana banane wala chahiye" | "need a cook" | restaurant (filtered) |

### Search Relevance Guardrails

Each category has **reject types** to prevent irrelevant results:
- "Car wash" → car_wash results,  Never dental/clinic/restaurant
- "AC repair" → hvac_contractor,  Never dentist/school/bank
- "Need service near me" → Asks clarification,  Never random results

**Implementation:** `functions/src/services/serviceTaxonomy.ts` (484 lines, 14 categories)

---

## Backend API Endpoints

All endpoints are Express routes deployed as Firebase Cloud Functions. Every endpoint returns structured JSON + agent traces.

| # | Method | Endpoint | Purpose | Key Logic |
|---|--------|----------|---------|-----------|
| 1 | GET | `/health` | Backend health check | Reports Gemini, Maps, Firestore status |
| 2 | POST | `/parseRequest` | Gemini NLU — multilingual parsing | 6-model cascade + fallback parser |
| 3 | POST | `/discoverProviders` | Places + registered provider search | Geocoding → Places API → merge with Firestore |
| 4 | POST | `/rankProviders` | 12-factor ranking + Gemini explanation | Deterministic scoring, never random |
| 5 | POST | `/estimatePrice` | Dynamic price estimation | Region/urgency/type adjustments, PKR range |
| 6 | POST | `/createBooking` | Booking with eligibility checks | Registered = real booking, Google Places = inquiry |
| 7 | POST | `/simulateFollowUp` | Service lifecycle simulation | 10-step timeline: reminder → feedback |
| 8 | POST | `/simulateProviderCancellation` | Cancellation recovery test | Re-rank → backup → bilingual apology |
| 9 | POST | `/resolveDispute` | Dispute / fallback scenarios | Price dispute, API failure handling |
| 10 | POST | `/handleNoProviderFound` | No-provider recovery | Expand search radius, suggest alternatives |
| 11 | POST | `/handleLowConfidenceRequest` | Low-confidence handling | Ask clarifying questions, show assumptions |
| 12 | POST | `/runWorkflow` | Full 8-step pipeline orchestrator | Chains all steps with timeouts + traces |
| 13 | POST | `/evaluateOutcome` | 12-metric outcome evaluation | Score, grade, before/after comparison |
| 14 | POST | `/diagnostics` | System health diagnostics | Tests Gemini, Places, Firestore, Geocoding |

### Provider Management Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 15 | GET | `/registeredProviders` | List all registered providers |
| 16 | POST | `/seedDemoProviders` | Seed 5 demo providers for judging |
| 17 | POST | `/bookingAction` | Accept/Reject/Complete booking lifecycle |

---

## Firestore Database Schema

15 collections — all writes go through Admin SDK (backend). Client reads are auth-gated.

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `service_requests` | Parsed NLU results | serviceType, location, urgency, confidence, language |
| `workflow_traces` | Agent decision logs | phase, action, confidence, reasoning, latencyMs |
| `provider_candidates` | Discovered providers per workflow | name, rating, source, distance, placeId |
| `ranking_decisions` | Ranking results with factor breakdown | scores[], factors[], explanation, totalScore |
| `price_estimates` | Pricing results | low, high, recommended, breakdown[], confidence |
| `bookings` | Booking records | status, provider, price, timestamps, customerUid |
| `booking_events` | Lifecycle events (state transitions) | eventType, timestamp, previousStatus, newStatus |
| `notifications` | Message previews (never sent) | channel, messageEnglish, messageUrdu, sentAt: null |
| `follow_up_plans` | Follow-up timelines | steps[], checklist[], scheduledTimes |
| `fallback_events` | Recovery records | scenario, stateBefore, recovery, stateAfter, reasoning |
| `outcome_evaluations` | Performance scores | 12 metrics, grade (A/B/C/D), comparison |
| `registered_providers` | Onboarded providers | name, services[], verified, active, location |
| `provider_profiles` | Extended profiles | ratings, completedJobs, availability, visitFee |
| `agent_traces` | Per-decision audit trail | agentName, phase, reasoning, confidence, latencyMs |
| `_diagnostics` | System test records | (transient — auto-deleted after tests) |

### Booking State Machine

```
pending_provider_confirmation → confirmed → completed
                              → rejected → (fallback recovery triggered)
                              → cancelled → (re-rank + backup found)
```

---

## Mobile Screens (23 Screens)

### Core Workflow Flow

| # | Screen | Purpose |
|---|--------|---------|
| 1 | `PitchHomeScreen` | Product landing — hero, status badges, pipeline viz |
| 2 | `HomeScreen` | Quick actions hub — all navigation |
| 3 | `ServiceRequestScreen` | Free-text input with language detection |
| 4 | `ServiceRequestEntryScreen` | Editable parsed request with location/time context |
| 5 | `LiveWorkflowScreen` | Real-time 8-step vertical stepper with animations |
| 6 | `WorkflowResultScreen` | 9-section pitch-deck results page |
| 7 | `WinningDemoScreen` | One-tap guided demo for judges |

### Agentic Pipeline Screens

| # | Screen | Purpose |
|---|--------|---------|
| 8 | `AIUnderstandingScreen` | NLU parse details, confidence, language |
| 9 | `ProviderDiscoveryScreen` | Real Google Places results + registered matches |
| 10 | `ProviderRankingScreen` | 12-factor scoring breakdown per provider |
| 11 | `DynamicPricingScreen` | PKR range, recommended, confidence, breakdown |
| 12 | `BookingScreen` | Booking creation with eligibility check |
| 13 | `FollowUpTimelineScreen` | 10-step lifecycle visualization |
| 14 | `FallbackRecoveryScreen` | 6 failure scenario tests with before/after |
| 15 | `AgentTraceScreen` | Full decision audit trail timeline |
| 16 | `OutcomeEvaluationScreen` | 12-metric performance scoring |

### Admin & System Screens

| # | Screen | Purpose |
|---|--------|---------|
| 17 | `ProviderAdminScreen` | Booking lifecycle dashboard — Accept/Reject/Complete |
| 18 | `ProviderOnboardingScreen` | Provider registration flow |
| 19 | `RegisteredProvidersScreen` | Registered provider list + seed button |
| 20 | `ApiSetupStatusScreen` | System architecture — 8 service checks |
| 21 | `BaselineComparisonScreen` | Normal app vs KaamWala AI side-by-side |
| 22 | `AntigravityEvidenceScreen` | Antigravity usage proof for judges |
| 23 | `FinalSubmissionChecklistScreen` | Pre-submission readiness (14/18 checks) |

**UI Design:** Premium dark theme (#0B0F1A) across all 23 screens with emerald/teal accents, glassmorphic cards, and micro-animations.

---

## Security & Privacy

| Rule | Implementation |
|------|---------------|
| **API keys backend-only** | All keys in Cloud Functions env vars, never in mobile code |
| **No key logging** | `safeLogger.ts` redacts all sensitive values automatically |
| **No key in responses** | Health endpoint shows `AIza...xxxx` (first/last 4 chars only) |
| **No random provider contact** | Only registered providers receive any communication |
| **No real SMS** | All notifications are preview-only, clearly labeled |
| **Anonymous auth** | No personal data collected — Firebase Anonymous Auth |
| **Firestore security rules** | Production rules: all writes denied at rule level, reads auth-gated |
| **Admin SDK writes** | All Firestore writes go through server-side Admin SDK (bypasses rules) |
| **No PII stored** | Area-level location only, no names/emails/phones from users |

### Firestore Security Architecture

```
Mobile App (client) → Can READ (authenticated only) → Limited collections
                    → Cannot WRITE (denied by rules)

Cloud Functions (Admin SDK) → Can READ + WRITE (bypasses rules)
                            → All writes go through here
```

---

## How Google Antigravity Was Used

Google Antigravity was the **primary development IDE** for every phase of KaamWala AI. The entire project — from architecture design to final APK — was built through Antigravity conversations.

> **Important:** Antigravity is the development environment, NOT a runtime dependency. The final app runs independently using its own coded agentic workflow.

### 10 Phases of Antigravity Usage

| # | Phase | What Antigravity Did | Output |
|---|-------|---------------------|--------|
| 1 | **Architecture Design** | Designed agentic OBSERVE→RECOVER loop, 12-factor ranking, 15 Firestore collections | System architecture document |
| 2 | **Workplan Creation** | Created 20-phase execution plan covering all deliverables | `docs/antigravity-evidence/WORKPLAN_EXPORT.md` |
| 3 | **Task Planning** | Defined endpoints, screens, acceptance criteria for each phase | `docs/antigravity-evidence/TASK_PLAN_EXPORT.md` |
| 4 | **Backend Code Generation** | Generated 40 TypeScript files for Firebase Cloud Functions | `functions/src/` (40 files) |
| 5 | **Mobile App Development** | Built 23 React Native screens with premium dark theme | `src/screens/` (23 files) |
| 6 | **API Integration** | Built Gemini 6-model cascade, Places API, Geocoding, Distance Matrix | Full Google API integration |
| 7 | **Firebase/GCP Setup** | Guided Firebase project creation, Firestore rules, Cloud Functions deployment | Production deployment |
| 8 | **Error Recovery & Debugging** | Fixed 15+ build errors, APK crash, Firebase init crash, Node runtime migration | Stable production build |
| 9 | **UI Design & Polish** | Created premium dark theme, 14 UI components, competition-grade design | Consistent dark UI |
| 10 | **QA & Documentation** | E2E workflow tests, secret scans, TypeScript verification, 52 doc files | Complete evidence package |

### Evidence Package

- `docs/antigravity-evidence/` — 12 evidence files + screenshots
- `docs/ANTIGRAVITY_CHALLENGE_2_EVIDENCE.md` — Full mapping to rubric criteria
- `docs/JUDGE_REVIEW.md` — Self-assessment with scoring
- All conversation logs verifiable in Antigravity

---

## Fallback & Recovery Scenarios

The recovery agent handles **6 failure scenarios** autonomously:

| # | Scenario | What Triggers It | Recovery Action | Output |
|---|----------|-----------------|-----------------|--------|
| 1 | **Provider cancels** | Provider cancels after booking confirmed | Re-rank remaining candidates → suggest replacement | New provider + bilingual apology (EN + Urdu) |
| 2 | **No provider found** | Zero results from Places API + registry | Expand search radius → suggest related categories | Alternative options + explanation |
| 3 | **Low confidence parse** | Gemini confidence < 0.5 | Show assumptions → ask clarifying questions | Improved understanding prompt |
| 4 | **Google Places API failure** | API timeout or error | Serve registered providers only | Degraded but functional results |
| 5 | **Price dispute** | Customer challenges estimate | Show detailed breakdown → adjust assumptions | Revised estimate + reasoning |
| 6 | **Missing location** | No location in request | Prompt for location → use city default | Location-aware search enabled |

Each recovery produces: **reasoning chain, state-before vs state-after, bilingual apology message, and Firestore record.**

---

## Baseline Comparison

| Dimension | Without KaamWala AI | With KaamWala AI | Improvement |
|-----------|-------------------|-----------------|-------------|
| Understanding | Manual interpretation only | AI-powered multilingual NLU | Roman Urdu → structured data |
| Discovery | Google Maps manual search | Automated Places API + provider registry | 5–12 candidates in seconds |
| Ranking | Pick nearest / cheapest | 12-factor transparent scoring | 12x more factors considered |
| Pricing | No reference available | Market-rate estimate with PKR breakdown | Full price transparency |
| Booking | Phone call, hope they answer | Structured Firestore record with audit trail | Accountable, traceable |
| Recovery | Start completely over | Automatic re-rank + replacement suggestion | Zero customer effort |
| Transparency | Zero audit trail | Full 8-phase agent trace with confidence | 100% explainable |
| Language | English only | Urdu, Roman Urdu, English, mixed | 220M+ Urdu speakers served |
| Accountability | No record of anything | Every decision logged in Firestore | Full decision history |

---

## Demo Scenarios

### Quick Demo (30 seconds)
1. Open app → tap **" Run Demo Scenario"**
2. Watch the 8-step workflow animate in the live stepper
3. See the 9-section result: Request, Provider, Reasoning, Price, Booking, Follow-up, Recovery, Traces, Alternatives

### Custom Roman Urdu Request
```
Input:  "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye"
Output: service=AC Repair, location=G-13, urgency=tomorrow_morning, language=roman_urdu
Result: CoolTech AC Solutions (4.5★, 47 jobs, PKR 1500, Verified )
```

### Custom English Request
```
Input:  "I need a plumber in F-8 Islamabad"
Output: service=Plumber, location=F-8 Islamabad, language=english
Result: PakFlow Plumbing Services (4.7★, 62 jobs, PKR 1000, Verified )
```

### 5 Seeded Demo Providers

| # | Provider | Category | Location | Rating | Jobs |
|---|---------|----------|----------|--------|------|
| 1 | CoolTech AC Solutions | AC/HVAC | G-13, Islamabad | 4.5 | 47 |
| 2 | Bright Sparks Electrical | Electrical | G-14, Islamabad | 4.8 | 55 |
| 3 | PakFlow Plumbing Services | Plumbing | G-14, Islamabad | 4.7 | 62 |
| 4 | EduPak Home Tutors | Education | F-10, Islamabad | 4.9 | 38 |
| 5 | GlowUp Beauty Studio | Beauty/Salon | F-7, Islamabad | 4.6 | 29 |

---

## Setup Instructions

### Prerequisites

- Node.js 18+ (Node.js 22 recommended)
- Expo CLI (`npx expo`)
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud project with APIs enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/ZulaidAbbasi/kaamwala-ai.git
cd kaamwala-ai

# Install mobile dependencies
npm install

# Install backend dependencies
cd functions && npm install && cd ..
```

### Environment Variables

**Backend (`functions/.env`):**
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Get your keys:**
- Gemini: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- Maps: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

**Enable these APIs in Google Cloud Console:**
- Gemini API
- Places API (New)
- Geocoding API
- Distance Matrix API

### Run Mobile App

```bash
npx expo start              # Start Expo dev server
npx expo start --android    # Android emulator
npx expo start --web        # Web browser
```

### Run Backend

```bash
cd functions && npm run build                    # Build TypeScript
firebase emulators:start --only functions        # Local testing
firebase deploy --only functions                 # Deploy to production
```

### Live Backend

```
https://api-zbyomuiceq-uc.a.run.app
```

---

## Cost & Scalability

| Service | Cost per Workflow | Monthly (1,000 requests) |
|---------|------------------|--------------------------|
| Gemini 2.5 Flash | ~$0.01 (3 calls) | ~$10 |
| Places API | ~$0.02 (1 search) | ~$20 |
| Geocoding API | ~$0.005 | ~$5 |
| Distance Matrix | ~$0.005 | ~$5 |
| Firestore | ~$0.001 (10 writes) | ~$1 |
| **Total** | **~$0.04/request** | **~$41/month** |

Serving **1,000 requests/month** costs approximately **$41** — viable for a startup.

---

## Assumptions & Limitations

### Assumptions

1. **Location context** — Users provide at least a general area (e.g., "G-13", "DHA Phase 2")
2. **Service categories** — The 14 categories cover the most common informal services in Pakistan
3. **Pricing model** — Market-rate estimates are based on typical PKR ranges for Islamabad
4. **Internet connectivity** — User has mobile internet access for API calls
5. **Firebase free tier** — Demo operates within Firebase Spark/Blaze free tier limits

### Limitations

| # | Limitation | Why It Exists | Production Fix |
|---|-----------|---------------|---------------|
| 1 | **Provider opt-in required** | Google Places providers are candidates, not participants, until they register | Provider onboarding portal |
| 2 | **No real payment** | Price estimates are informational only — no JazzCash/Easypaisa integration | Payment gateway integration |
| 3 | **No real-time communication** | Notifications are preview-only — no SMS/WhatsApp sent | Twilio/WhatsApp Business API |
| 4 | **Distance estimation** | Straight-line fallback when Distance Matrix API unavailable | Always-on Distance Matrix |
| 5 | **Single city demo** | Optimized for Islamabad; works elsewhere but not tuned | Multi-city expansion |
| 6 | **Gemini dependency** | Fallback parser has lower confidence (0.35 vs 0.85+) | Fine-tuned local model |
| 7 | **No provider verification** | Demo providers are seeded, not verified businesses | KYC/background check system |
| 8 | **Rate limiting** | Free-tier Gemini has RPM/RPD limits | Paid API tier |

---

## Future Improvements

1. **Provider onboarding portal** — Web dashboard for providers to register and manage availability
2. **Real notification integration** — SMS/WhatsApp via Twilio for opted-in providers
3. **Payment integration** — JazzCash/Easypaisa for Pakistan-native payment
4. **Multi-city expansion** — Tuned for Lahore, Karachi, Rawalpindi
5. **Customer accounts** — Booking history, favorite providers, ratings
6. **Real-time tracking** — Provider en-route tracking with Maps SDK
7. **Voice input** — Urdu speech-to-text for users who prefer voice
8. **Provider analytics** — Performance dashboard, revenue tracking
9. **ML-based pricing** — Train on historical booking data for better estimates
10. **Multi-language expansion** — Pashto, Sindhi, Punjabi support

---

## Project Structure

```
kaamwala-ai/
├── App.tsx                              # Navigation + auth entry
├── src/
│   ├── screens/                         # 23 React Native screens
│   │   ├── HomeScreen.tsx               # Quick actions hub
│   │   ├── PitchHomeScreen.tsx          # Product landing
│   │   ├── WinningDemoScreen.tsx        # Judge demo (one-tap)
│   │   ├── ServiceRequestScreen.tsx     # Free-text input
│   │   ├── LiveWorkflowScreen.tsx       # 8-step live stepper
│   │   ├── WorkflowResultScreen.tsx     # 9-section results
│   │   ├── ProviderAdminScreen.tsx      # Booking lifecycle
│   │   ├── FallbackRecoveryScreen.tsx   # 6 recovery scenarios
│   │   ├── AgentTraceScreen.tsx         # Decision audit trail
│   │   └── ... (14 more screens)
│   ├── components/
│   │   ├── ui/                          # 14 reusable UI components
│   │   ├── AgentTracePanel.tsx
│   │   └── ErrorBoundary.tsx
│   ├── services/
│   │   ├── backend/apiClient.ts         # API client
│   │   ├── auth/authService.ts          # Firebase auth
│   │   └── workflow/                    # Client-side workflow runner
│   └── config/
│       ├── api.ts                       # API base URL + endpoints
│       └── firebase.ts                  # Firebase client config
├── functions/                           # Firebase Cloud Functions backend
│   └── src/
│       ├── index.ts                     # Express app entry (14 routes)
│       ├── agents/
│       │   ├── serviceOrchestrator.ts   # 8-step pipeline orchestrator
│       │   └── outcomeEvaluatorAgent.ts # 12-metric evaluation
│       ├── endpoints/                   # 14 API endpoint handlers
│       │   ├── parseRequest.ts
│       │   ├── discoverProviders.ts
│       │   ├── rankProviders.ts
│       │   ├── estimatePrice.ts
│       │   ├── createBooking.ts
│       │   ├── simulateFollowUp.ts
│       │   ├── fallbackRecovery.ts
│       │   ├── runWorkflow.ts
│       │   └── ... (6 more endpoints)
│       ├── services/
│       │   ├── gemini/
│       │   │   ├── geminiClient.ts      # 6-model cascade AI client
│       │   │   ├── geminiFallback.ts    # Deterministic fallback parser
│       │   │   ├── geminiPrompts.ts     # NLU system instructions
│       │   │   └── geminiSchemas.ts     # Response validation schemas
│       │   ├── maps/
│       │   │   ├── placesService.ts     # Google Places discovery
│       │   │   ├── geocodingService.ts  # Location → coordinates
│       │   │   ├── distanceService.ts   # Travel distance/time
│       │   │   └── mapsClient.ts        # Shared HTTP client
│       │   ├── rankingService.ts        # 12-factor scoring engine
│       │   ├── pricingService.ts        # Market-rate estimation
│       │   ├── serviceTaxonomy.ts       # 14-category taxonomy
│       │   ├── bookingService.ts        # Booking creation + state
│       │   ├── traceLogger.ts           # Agent trace logging
│       │   └── fallbackService.ts       # Recovery logic
│       ├── types/                       # TypeScript type definitions
│       └── utils/
│           └── safeLogger.ts            # Secret-redacting logger
└── docs/                                # 52 documentation files
    ├── ARCHITECTURE.md
    ├── CHALLENGE_2_ALIGNMENT_REPORT.md
    ├── ANTIGRAVITY_CHALLENGE_2_EVIDENCE.md
    ├── JUDGE_REVIEW.md
    ├── API_SETUP_GUIDE.md
    ├── SECURITY_AND_PRIVACY.md
    └── antigravity-evidence/            # 12 evidence files
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile** | React Native (Expo SDK 53) + TypeScript | 23-screen mobile app |
| **Backend** | Firebase Cloud Functions (Node.js 22) + Express | 14 secure API endpoints |
| **Database** | Cloud Firestore | 15 collections, real-time data |
| **Auth** | Firebase Anonymous Auth | Zero-friction demo auth |
| **AI/NLU** | Gemini API (6-model cascade) | Multilingual understanding |
| **Discovery** | Google Places API (New) | Real provider search |
| **Location** | Geocoding API + Distance Matrix | Coordinates + travel time |
| **Build** | EAS Build | Android APK generation |
| **Development** | Google Antigravity | IDE + coding assistant |
| **UI Theme** | Premium Dark (#0B0F1A) | Consistent, competition-grade |

---

## Documentation Index

| # | Document | Purpose |
|---|----------|---------|
| 1 | [README.md](README.md) | This file — comprehensive project overview |
| 2 | [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, tech stack, file structure |
| 3 | [CHALLENGE_2_ALIGNMENT_REPORT.md](docs/CHALLENGE_2_ALIGNMENT_REPORT.md) | Requirement-by-requirement compliance |
| 4 | [ANTIGRAVITY_CHALLENGE_2_EVIDENCE.md](docs/ANTIGRAVITY_CHALLENGE_2_EVIDENCE.md) | 10-phase Antigravity usage evidence |
| 5 | [JUDGE_REVIEW.md](docs/JUDGE_REVIEW.md) | Self-assessment, how to test, scoring |
| 6 | [API_SETUP_GUIDE.md](docs/API_SETUP_GUIDE.md) | Backend API configuration guide |
| 7 | [SECURITY_AND_PRIVACY.md](docs/SECURITY_AND_PRIVACY.md) | Keys, data, simulation boundaries |
| 8 | [FIRESTORE_SECURITY_RULES.md](docs/FIRESTORE_SECURITY_RULES.md) | Access control, rule walkthrough |
| 9 | [FINAL_QA_REPORT.md](docs/FINAL_QA_REPORT.md) | Screen-by-screen QA audit |
| 10 | [FINAL_RELEASE_CHECKLIST.md](docs/FINAL_RELEASE_CHECKLIST.md) | Pre-release verification |
| 11 | [DEMO_VIDEO_SCRIPT.md](docs/DEMO_VIDEO_SCRIPT.md) | Demo video narration script |
| 12 | [DEMO_VIDEO_SHOT_LIST.md](docs/DEMO_VIDEO_SHOT_LIST.md) | 15 shots with timing |
| 13 | [ANTIGRAVITY_USAGE_VIDEO_SCRIPT.md](docs/ANTIGRAVITY_USAGE_VIDEO_SCRIPT.md) | Antigravity video script |
| 14 | [VERIFICATION_LOG.md](docs/VERIFICATION_LOG.md) | Deployment verification log |

---

## Submission Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Mobile App (23 screens, full agentic workflow) | Complete |
| 2 | GitHub Repository (clean, no secrets) | Ready |
| 3 | README Documentation (this file — 700+ lines) | Complete |
| 4 | Backend API (14 endpoints, live on Cloud Functions) | Live |
| 5 | Antigravity Evidence (12 files + screenshots) | Complete |
| 6 | 52 Documentation Files | Complete |
| 7 | Demo Video | To record |
| 8 | Antigravity Usage Video | To record |

---

<div align="center">

### Built by Team Panthers

**Google Antigravity** · **Firebase** · **Gemini AI** · **Google Maps**

*#AISeekho 2026 · Challenge 2: Agentic AI*

</div>
