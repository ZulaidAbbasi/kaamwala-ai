# KaamWala AI — Real vs Simulated Boundaries

**Last Updated:** 2026-05-16

---

## Purpose

This document clarifies exactly what is **real** (live API data, actual database writes) versus what is **simulated** (demo-controlled, safe test data) in KaamWala AI MVP.

---

## Real (Production-Grade)

| Feature | How | Evidence |
|---------|-----|---------|
| **Gemini NLU** | Real Gemini API call for every request | Trace shows `source: "gemini"`, latencyMs from API |
| **Google Places Discovery** | Real Places API (New) text search | Provider data has real Google placeIds |
| **Geocoding** | Real Geocoding API call | Returns real lat/lng coordinates |
| **Distance Matrix** | Real Distance Matrix API call | Returns real km/minutes |
| **Firestore Writes** | Real production Firestore | All records verifiable in Firebase Console |
| **Anonymous Auth** | Real Firebase Authentication | UID generated per session |
| **Agent Trace Logs** | Real Firestore documents in `agent_traces` | Timestamps, latency, decisions all real |
| **Booking Records** | Real Firestore documents in `bookings` | Actual database state transitions |

---

## Demo-Controlled (Safe for Judging)

| Feature | What Happens | Why |
|---------|-------------|-----|
| **Registered Providers** | 3 controlled demo profiles in `provider_profiles` | Can't register random businesses for a hackathon |
| **Provider Contact Info** | `@kaamwala-demo.test` emails, no phone numbers | Safety — no real contacts |
| **Booking Confirmation** | Booking record created, no real service dispatch | We don't control real service providers |
| **Provider Acceptance** | Simulated acceptance state | No real provider app exists yet |
| **Follow-Up Messages** | Generated preview text, not actually sent | No SMS/WhatsApp integration |
| **Cancellation Recovery** | Simulated cancellation + AI fallback logic | Demonstrates recovery agent |

---

## Clearly Labeled

Every simulated element is explicitly marked:

| Where | Label |
|-------|-------|
| Provider cards | `source: "demo-controlled"` |
| Provider cards | `🎯 Demo` badge |
| Seed button | "Seed Controlled Demo Providers" |
| Booking screen | `🟢 Real Booking Record` or `🟡 Discovery Log Only` |
| Booking screen | `🔥 Firestore Saved` badge |
| Booking screen | Status: `pending_provider_confirmation` or `onboarding_required` |
| Customer message | **PREVIEW ONLY — NOT SENT** badge |
| Provider message | **PREVIEW ONLY — NOT SENT** badge |
| Booking response | `providerSource: "demo-controlled"` |
| Booking response | `bookingNote` explains what is real vs demo |
| Google Places results | `"Discovered — onboarding required"` |
| Google Places results | `bookable: false` |
| Fallback responses | `source: "fallback"`, `confidence: 0.35` |
| Agent traces | Phase + source clearly logged |

---

## Not Simulated (Common Misconception)

These are NOT fake — they use real APIs:

| ❌ Not Fake | ✅ Actually |
|------------|-----------|
| "Gemini just returns canned responses" | Real Gemini API call with dynamic prompts |
| "Google Places results are hardcoded" | Real Places API (New) search results |
| "Distances are made up" | Real Distance Matrix API calculations |
| "Firestore is just local storage" | Production Firestore database |
| "Agent traces are generated after the fact" | Written during actual API calls with real latency |

---

## Security Boundaries

| Element | Mobile App | Backend |
|---------|-----------|---------|
| Gemini API Key | ❌ Never | ✅ env var only |
| Maps API Key | ❌ Never | ✅ env var only |
| Firebase Admin SDK | ❌ Never | ✅ auto-credentials |
| Provider contact info | ❌ Excluded from API | ✅ Stored but not exposed |
| API keys in traces | ❌ Redacted | ✅ safeLog strips them |

---

## For Judges

**Summary**: KaamWala AI is a real working MVP that uses real Google APIs (Gemini, Places, Geocoding, Distance Matrix) and a real Firebase backend. The only simulated elements are the 3 demo provider profiles (because we can't register random businesses for a hackathon) and the final service dispatch (because no real worker is going to show up). Everything else — from multilingual NLU to agent trace logging — is production-grade.
