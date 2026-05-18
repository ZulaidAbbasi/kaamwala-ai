# KaamWala AI — Final QA Checklist

**When to run:** Day 4 (May 19) before feature freeze, and again Day 5 before submission.

---

## 1. App Launch

```
[ ] App starts without crash
[ ] Firebase Auth auto-signs in (anonymous)
[ ] Home screen shows "KaamWala AI" + tagline
[ ] 9 system badges visible (all green)
[ ] 8-card nav grid renders correctly
[ ] No overflow or layout issues
```

---

## 2. System Status (ApiSetupStatusScreen)

```
[ ] "Run All Tests" button works
[ ] Firebase Config: ✅ pass
[ ] Anonymous Auth: ✅ pass
[ ] Backend Health: ✅ pass
[ ] Gemini API Key: ✅ pass
[ ] Maps API Key: ✅ pass
[ ] Firestore Write: ✅ pass
[ ] Gemini NLU Parse: ✅ pass
[ ] Places API Search: ✅ pass
[ ] Geocoding API: ✅ pass or ⚠️ warning
[ ] Distance/Routes: ✅ pass or ⚠️ warning
[ ] Demo Readiness: 🟢 Green
[ ] No API keys visible (only first/last 4 chars)
```

---

## 3. Full Agentic Workflow

```
[ ] Tap "Run Full Agentic Workflow"
[ ] Pipeline animation shows (Understand → Discover → Rank → Price → Book)
[ ] All 5 steps show ✅ on completion
[ ] Result cards appear (service, provider, price, booking)
[ ] Chips visible: BACKEND DECISION, REGISTERED/ONBOARDING, ESTIMATED, FIRESTORE SAVED
[ ] Action buttons visible: Traces, AI View, Evaluate, Follow-Up, Fallback
[ ] Latency shown in monospace
[ ] No crash on any step
```

---

## 4. Step-by-Step Flow

```
[ ] ServiceRequest: Prefilled demo input works
[ ] ServiceRequest: Submit shows "Understanding request…"
[ ] AIUnderstanding: Shows parsed fields, confidence bar, source badge
[ ] ProviderDiscovery: Shows "Searching real providers…"
[ ] ProviderDiscovery: Real provider cards with GOOGLE PLACES labels
[ ] ProviderRanking: Shows "Ranking with agentic reasoning…"
[ ] ProviderRanking: 12-factor breakdown visible
[ ] DynamicPricing: Shows "Estimating transparent price…"
[ ] DynamicPricing: PKR range and breakdown visible
[ ] Booking: Shows "Creating booking record…"
[ ] Booking: FIRESTORE SAVED badge visible
[ ] Booking: "No real SMS sent" label visible
```

---

## 5. Post-Workflow Screens

```
[ ] FollowUpTimeline: 10-step lifecycle loads
[ ] FallbackRecovery: 6 scenario buttons visible
[ ] FallbackRecovery: Provider Cancels scenario works
[ ] FallbackRecovery: SIMULATION BOUNDARY badge visible
[ ] OutcomeEvaluation: Score circle and grade show
[ ] OutcomeEvaluation: 9 before/after cards render
[ ] OutcomeEvaluation: Baseline vs Agentic toggle works
[ ] AgentTrace: Trace entries scrollable
```

---

## 6. Static Screens

```
[ ] BaselineComparison: 9 dimension cards render
[ ] BaselineComparison: 12-factor table renders
[ ] AntigravityEvidence: 8 capability categories render
[ ] FinalChecklist: Live health + parse tests run
[ ] ProviderOnboarding: 5-step flow renders
[ ] RegisteredProviders: Provider list loads
```

---

## 7. Security & Privacy

```
[ ] No API keys in mobile source code
[ ] No API keys visible on any screen
[ ] .env is in .gitignore
[ ] .env.example has placeholders only
[ ] "No real SMS sent" labels present
[ ] "SIMULATION" / "PREVIEW ONLY" labels where appropriate
[ ] Demo providers marked as "demo-controlled"
```

---

## 8. Code Quality

```
[ ] npm run typecheck (mobile): Exit 0
[ ] npm run build (functions): Exit 0
[ ] npx expo start --web: Bundles without error
[ ] No TypeScript errors
[ ] No unused imports warnings
```

---

## 9. Documentation

```
[ ] README.md complete with mandatory submission section
[ ] DEMO_VIDEO_SCRIPT.md has 13 steps
[ ] DEMO_VIDEO_SHOT_LIST.md has 15 shots
[ ] ANTIGRAVITY_USAGE_VIDEO_SCRIPT.md has 9 sections
[ ] ANTIGRAVITY_USAGE_SHOT_LIST.md has 11 shots
[ ] ANTIGRAVITY_TRACE_EXPORT_GUIDE.md complete
[ ] MANDATORY_SUBMISSION_CHECKLIST.md complete
[ ] GITHUB_SUBMISSION_GUIDE.md complete
[ ] VERIFICATION_LOG.md has all phases
```

---

## 10. Pre-Submission Final

```
[ ] GitHub repo is public
[ ] All commits are clean (no secret commits)
[ ] Demo video recorded and uploaded
[ ] Antigravity video recorded and uploaded
[ ] Antigravity traces exported
[ ] Submission form filled
[ ] All links tested
[ ] Submitted before deadline
```
