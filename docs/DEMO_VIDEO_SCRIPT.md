# KaamWala AI — Demo Video Script

**Video Type:** Product Walkthrough  
**Target Duration:** 4–6 minutes  
**Format:** Screen recording of the app + voice narration

---

## Pre-Recording Checklist

```
[ ] App running on device/emulator with clean state
[ ] Internet connection stable (for live API calls)
[ ] Screen recorder ready (no API keys visible)
[ ] Microphone tested (clear audio, no echo)
[ ] Demo request ready: "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai."
[ ] All Firestore collections empty (fresh demo)
[ ] Phone in Do Not Disturb mode
[ ] System Status screen tested — all green
```

---

## Video Script — 13 Steps

### STEP 1: Problem Intro (0:00 – 0:30)

**[Show: App home screen with tagline visible]**

> **Narration:**
> "This is KaamWala AI — an agentic service orchestrator for Pakistan's informal economy.
>
> This app was developed in Google Antigravity. The final APK runs independently. The agentic workflow is implemented in our own backend and app code.
>
> In Pakistan, millions of people find service providers through word of mouth, WhatsApp groups, or by physically searching. There's no structured system — especially for AC repair, plumbing, or electrical work.
>
> KaamWala AI changes this. Let me show you how."

---

### STEP 2: User Enters Roman Urdu Request (0:30 – 0:50)

**[Show: ServiceRequestScreen. Type/paste the demo request.]**

> **Narration:**
> "I'll type a real request in Roman Urdu — just like someone in Pakistan would message a friend:
>
> 'AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.'
>
> This means: 'My AC isn't working at all, I need a technician tomorrow morning in G-13, budget is low.'"

**[Action: Tap the submit button]**

---

### STEP 3: Gemini/Backend Understands Request (0:50 – 1:15)

**[Show: AI Understanding screen with parsed fields]**

> **Narration:**
> "The Gemini 2.0 Flash API instantly understands the mixed-language input. It extracted:
>
> - **Service:** AC Repair
> - **Location:** G-13, Islamabad
> - **Urgency:** Tomorrow morning
> - **Budget:** Low
> - **Language:** Roman Urdu
> - **Confidence:** 85%
>
> This is a live API call — not hardcoded. Notice the 'BACKEND DECISION' chip."

---

### STEP 4: Google Places Finds Real Providers (1:15 – 1:40)

**[Show: ProviderDiscoveryScreen with provider cards loading]**

> **Narration:**
> "Now the Google Places API searches for real AC repair businesses near G-13, Islamabad. These are real businesses with real ratings, real addresses, and real review counts.
>
> Notice the 'REAL GOOGLE PLACES' label on each card. We never invent providers."

---

### STEP 5: Registered Provider Distinction (1:40 – 2:00)

**[Show: Provider cards — highlight REGISTERED vs ONBOARDING REQUIRED badges]**

> **Narration:**
> "Here's a critical distinction. Some providers are registered on our platform — they've completed onboarding. Others are discovered from Google but not yet registered.
>
> Only registered providers can receive confirmed bookings. Google-only providers show 'ONBOARDING REQUIRED' — we're transparent about this boundary."

---

### STEP 6: Ranking Explanation (2:00 – 2:25)

**[Show: ProviderRankingScreen with per-factor breakdown]**

> **Narration:**
> "The ranking engine uses 12 factors — distance, rating, review strength, registration status, availability, price fit, and more. Each factor has a transparent weight.
>
> Critically: Gemini explains the decision but does NOT choose the provider. The scoring is fully deterministic."

---

### STEP 7: Price Estimate (2:25 – 2:45)

**[Show: DynamicPricingScreen with breakdown]**

> **Narration:**
> "The pricing engine generates a transparent estimate. You can see the base fee, urgency premium, and the recommended range.
>
> Notice the 'ESTIMATED' label — this is a market-rate estimate, not a binding quote. Every assumption is documented."

---

### STEP 8: Booking Record (2:45 – 3:05)

**[Show: BookingScreen with FIRESTORE SAVED badge]**

> **Narration:**
> "When the user confirms, a real booking record is created in Firestore. You can see the booking ID, provider, price, and status.
>
> Notice the 'FIRESTORE SAVED' badge — this is a real database record. But also notice: 'No real SMS sent. Simulation boundary.' We're honest about what's real and what's simulated."

---

### STEP 9: Follow-Up Automation (3:05 – 3:25)

**[Show: Follow-Up Automation card with reminder, status update, feedback badges]**

> **Narration:**
> "After booking, the system automatically schedules follow-up actions: a reminder 1 hour before the appointment, a provider status update, and a feedback request after service completion.
>
> Notice the badges: 'Reminder Scheduled', 'Status Update', 'Feedback Requested' — and 'No Real SMS Sent' and 'Safe Simulation'. Every follow-up step is traced and logged."

---

### STEP 10: Notification Preview (3:25 – 3:35)

**[Show: Notification preview section with PREVIEW ONLY label]**

> **Narration:**
> "The app generates a bilingual notification preview — what a message to the provider would look like. Clearly labeled 'PREVIEW ONLY — NOT SENT.' No random providers are contacted."

---

### STEP 11: Provider Cancellation Recovery (3:35 – 4:05)

**[Show: Fallback Recovery card — automated provider cancellation scenario]**

> **Narration:**
> "Now let's test the recovery system. The provider cancels after booking.
>
> The agent detects the cancellation, logs the issue, re-ranks remaining providers, selects a replacement, and generates an apology message — all automatically.
>
> You can see the state-before vs state-after, the reasoning, and the recovery options considered. This is what makes it an agentic system."

---

### STEP 12: Agent Trace Logs (4:05 – 4:25)

**[Show: AgentTraceScreen — scroll through entries]**

> **Narration:**
> "Every decision is traced. The agent log shows:
>
> OBSERVE → UNDERSTAND → REASON → DECIDE → ACT → EVALUATE → RECOVER
>
> Each entry has a timestamp, confidence score, and the full reasoning chain. All stored in Firestore for auditability."

---

### STEP 13: Baseline Comparison (4:25 – 4:45)

**[Show: BaselineComparisonScreen — scroll through dimension cards]**

> **Narration:**
> "The baseline comparison shows the difference. Without KaamWala AI: manual search, nearest pick, no pricing transparency, no fallback.
>
> With KaamWala AI: multilingual understanding, multi-source discovery, 12-factor ranking, transparent pricing, automated recovery. Nine dimensions improved."

---

### STEP 14: Final Outcome (4:45 – 5:15)

**[Show: OutcomeEvaluationScreen — score circle, grade, metrics]**

> **Narration:**
> "Finally, the outcome evaluator computes 12 metrics and assigns an overall score and grade.
>
> You can see the before/after comparison, the metrics grid, and the cost per workflow — approximately $0.04 per complete run.
>
> KaamWala AI demonstrates a complete agentic pipeline: observe, understand, reason, decide, act, evaluate, and recover.
>
> Thank you for watching."

---

## Post-Recording Checklist

```
[ ] Video plays smoothly, all 14 steps shown
[ ] Duration: 4–6 minutes
[ ] Audio narration clear
[ ] No API keys visible in any frame
[ ] SIMULATION labels visible in booking, follow-up, notification, fallback
[ ] Follow-up badges visible: Reminder Scheduled, Status Update, Feedback Requested
[ ] REGISTERED vs ONBOARDING REQUIRED labels visible
[ ] ESTIMATED and FIRESTORE SAVED labels visible
[ ] Agent trace is scrolled and readable
[ ] Baseline comparison shown
[ ] Outcome evaluation score visible
[ ] No personal information visible
```
