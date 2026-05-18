# Stitch UI Implementation Plan — KaamWala AI

**Date:** 2026-05-16  
**Status:** ✅ PHASE 1-3 COMPLETE  
**Purpose:** Apply Google Stitch design system to the existing React Native Expo app for #AISeekho 2026 Hackathon

---

## 1. Design System Tokens ✅

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#064E3B` | Buttons, active stepper, headers |
| `primaryDark` | `#003527` | Text on light surfaces |
| `secondary` | `#006A61` | Teal interactive elements |
| `tertiary` | `#8B5CF6` | Purple AI/agentic highlights |
| `background` | `#F9FAFB` | App canvas |
| `surface` | `#FFFFFF` | Cards |
| `textPrimary` | `#141B2B` | Dark text |
| `textSecondary` | `#707974` | Muted text |
| `success` | `#059669` | Connected/pass |
| `warning` | `#D97706` | Elevated latency |
| `error` | `#BA1A1A` | Failed |

### Typography: Plus Jakarta Sans
- Headlines: 24px/700, 20px/600
- Body: 16px/400
- Labels: 12px/600

---

## 2. Screen Status

| Screen | Status | Design |
|--------|--------|--------|
| HomeScreen | ✅ Redesigned | Full Stitch premium |
| AgentTraceScreen | ✅ Redesigned | TraceCard components |
| BaselineComparisonScreen | ✅ Redesigned | VS cards + MetricBars |
| FallbackRecoveryScreen | ✅ Redesigned | State before/after |
| ApiSetupStatusScreen | ✅ Redesigned | Status cards + banner |
| DynamicPricingScreen | ✅ Redesigned | Receipt-style layout |
| ProviderRankingScreen | ✅ Redesigned | Score circles + bars |
| BookingScreen | ✅ Redesigned | Dispatch previews |
| ServiceRequestScreen | ✅ Light theme | Color swap |
| AIUnderstandingScreen | ✅ Light theme | Color swap |
| ProviderDiscoveryScreen | ✅ Light theme | Color swap |
| FollowUpTimelineScreen | ✅ Light theme | Color swap |
| OutcomeEvaluationScreen | ✅ Light theme | Color swap |
| FinalSubmissionChecklistScreen | ✅ Light theme | Color swap |
| AntigravityEvidenceScreen | ✅ Light theme | Color swap |
| ProviderOnboardingScreen | ✅ Light theme | Color swap |
| RegisteredProvidersScreen | ✅ Light theme | Color swap |

---

## 3. 12 Reusable Components ✅

All in `src/components/ui/`:
1. ✅ theme.ts — Design tokens (colors, typography, spacing, radius, shadows)
2. ✅ StatusBadge — Rounded pill badges (success/warning/error/info/ai/neutral)
3. ✅ SectionCard — White rounded containers with accent bars
4. ✅ ActionButton — 56px primary/secondary/ai buttons
5. ✅ ProgressStepper — Horizontal workflow tracker (7 steps)
6. ✅ ScoreBar — Teal score visualization (0-100)
7. ✅ TraceCard — Purple-accent agent reasoning cards
8. ✅ WarningBox — Multi-variant callout boxes
9. ✅ ScreenWrapper — ScrollView + SafeArea + background
10. ✅ MetricBar — Before/After comparison bars
11. ✅ TimelineStep — Vertical timeline nodes
12. ✅ LoadingState — Centered spinner with message
13. ✅ EmptyState — No-data display
14. ✅ index.ts — Barrel export

---

## 4. App-Level Changes ✅

- App.tsx THEME: White header, dark text, emerald accent
- StatusBar: Dark (for light background)
- headerShadowVisible: false (clean minimal headers)
- AgentTracePanel: Light theme colors

---

## 5. Data Integrity ✅
- ALL data from backend
- No Stitch sample data in production
- Missing = "Unknown" / "Unavailable"
- Simulated = "Safe Simulation" label
- Backend URL unchanged
- No .env modifications
