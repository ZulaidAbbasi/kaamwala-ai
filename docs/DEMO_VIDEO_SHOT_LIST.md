# KaamWala AI — Demo Video Shot List

**Total Shots:** 16 | **Duration:** 4–6 minutes

---

| Shot | Time | Screen | Action | Must Show | Sec |
|------|------|--------|--------|-----------|-----|
| 1 | 0:00 | Home | Static | Title, tagline, badges | 10 |
| 2 | 0:10 | Home | Narrate problem | Clean UI, nav grid | 20 |
| 3 | 0:30 | ServiceRequest | Type Roman Urdu | Text appearing, demo input | 15 |
| 4 | 0:45 | ServiceRequest | Tap Submit | "Understanding request…" | 5 |
| 5 | 0:50 | AIUnderstanding | Review fields | Service, location, urgency, budget, lang, confidence bar, BACKEND DECISION chip | 25 |
| 6 | 1:15 | ProviderDiscovery | Scroll results | Real names, ratings, addresses, REAL GOOGLE PLACES label | 25 |
| 7 | 1:40 | ProviderDiscovery | Highlight badges | REGISTERED vs ONBOARDING REQUIRED | 20 |
| 8 | 2:00 | ProviderRanking | Review ranking | 12-factor breakdown, per-provider scores | 25 |
| 9 | 2:25 | DynamicPricing | Review price | PKR range, breakdown, ESTIMATED chip | 20 |
| 10 | 2:45 | Booking | Tap Book | FIRESTORE SAVED badge, "No real SMS sent", status | 20 |
| 11 | 3:05 | Follow-Up | Auto-generated | Reminder, status update, feedback, SAFE SIMULATION | 20 |
| 12 | 3:25 | Booking | Show notification | Preview, PREVIEW ONLY label | 10 |
| 13 | 3:35 | FallbackRecovery | Auto scenario | State before/after, reasoning, SIMULATION BOUNDARY | 30 |
| 14 | 4:05 | AgentTrace | Scroll entries | OBSERVE→UNDERSTAND→FOLLOW_UP→RECOVER | 25 |
| 15 | 4:25 | BaselineComparison | Scroll cards | Reasoning, pricing, follow-up, recovery, traceability | 20 |
| 16 | 4:45 | OutcomeEvaluation | Show score | Score circle, grade, 12 metrics, cost, FIRESTORE SAVED | 30 |

---

## Key Labels to Show

| Label | Where |
|-------|-------|
| BACKEND DECISION | AI Understanding card |
| REAL GOOGLE PLACES | Provider discovery cards |
| REGISTERED PROVIDER | Provider with green badge |
| ONBOARDING REQUIRED | Provider with orange badge |
| ESTIMATED | Price estimate card |
| FIRESTORE SAVED | Booking card, outcome eval |
| No real SMS sent | Booking, follow-up |
| REMINDER SCHEDULED | Follow-up card |
| STATUS UPDATE | Follow-up card |
| FEEDBACK REQUESTED | Follow-up card |
| SAFE SIMULATION | Follow-up card |
| SIMULATION BOUNDARY | Fallback recovery |
| PREVIEW ONLY — NOT SENT | Notification preview |

---

## Key Screens Detail

### Shot 5 — AI Understanding
```
Service:    AC Repair          | Confidence: 85%
Location:   G-13, Islamabad   | Language: Roman Urdu
Urgency:    Tomorrow morning   | Budget: Low
Source:     🤖 Gemini NLU
```

### Shot 8 — Ranking
Each provider shows: rank position, score, per-factor breakdown, Gemini explanation.
Bottom note: "Gemini explains but does NOT choose — scoring is deterministic."

### Shot 13 — Agent Trace
```
OBSERVE    → Raw input received          | confidence: 1.00
UNDERSTAND → Entities extracted          | confidence: 0.85
REASON     → Providers evaluated         | confidence: 0.90
DECIDE     → Best provider selected      | confidence: 0.88
ACT        → Booking created             | confidence: 1.00
FOLLOW_UP  → Reminder scheduled          | confidence: 1.00
FOLLOW_UP  → Status update prepared      | confidence: 1.00
FOLLOW_UP  → Feedback request prepared   | confidence: 1.00
EVALUATE   → Outcome assessed            | confidence: 0.92
RECOVER    → Fallback provider found     | confidence: 0.85
```

---

## Recording Tips

1. Clear Firestore before recording for fresh results
2. Test all API calls before starting — one failure ruins the take
3. Tap buttons slowly so viewer sees what's pressed
4. Hold each result screen 3+ seconds
5. Don't scroll during narration
6. Check no API keys visible in status bar or console
7. Do a full dry run first without recording
8. Use the "Run Full Agentic Workflow" button for quick demo, or step-by-step for detailed demo
