# Architecture — KaamWala AI

## System Overview

KaamWala AI is a 4-screen mobile app + Firebase Cloud Functions backend that orchestrates local service booking through an agentic AI pipeline.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) + TypeScript |
| Backend | Firebase Cloud Functions (Node.js) |
| Database | Cloud Firestore |
| NLU | Google Gemini API + keyword fallback |
| Provider Discovery | Google Places API (New) |
| Auth | Firebase Anonymous Auth |
| Build | EAS Build (Android APK) |
| AI Tooling | Google Antigravity |

## App Architecture

```
PitchHomeScreen (landing)
├── ServiceRequestEntryScreen (input)
│   └── LiveWorkflowScreen (real-time stepper)
│       └── WorkflowResultScreen (pitch-deck results)
├── ApiSetupStatusScreen (system health)
├── AgentTraceScreen (decision audit)
├── BaselineComparisonScreen (vs normal apps)
└── FinalSubmissionChecklistScreen
```

## Backend Pipeline

```
parseRequest → discoverProviders → rankProviders → estimatePrice
    → createBooking → simulateFollowUp → resolveDispute
```

Each endpoint returns structured data + agent traces.

## Workflow Runner

`src/services/workflow/runServiceWorkflow.ts`

- Typed 8-step pipeline
- 15s timeout per step (AbortController)
- Step-by-step callback for live UI updates
- Sanitized error handling (no raw JS errors reach UI)

## Key Design Decisions

1. **Backend-only API keys** — Mobile never calls Google directly
2. **Deterministic ranking** — 12-factor scoring, not random
3. **Fallback parser** — If Gemini fails, keyword extraction still works
4. **Simulation labels** — All non-real actions clearly marked
5. **Trace logging** — Every AI decision is recorded and explainable

## File Structure

```
App.tsx                           # Navigation + auth
src/screens/                      # 4 main + 5 secondary screens
src/services/workflow/             # Typed workflow runner
src/services/backend/              # API client
src/services/auth/                 # Firebase auth
src/config/                        # API + Firebase config
functions/                         # Cloud Functions backend
docs/                              # Final documentation
submission/                        # Hackathon submission files
```
