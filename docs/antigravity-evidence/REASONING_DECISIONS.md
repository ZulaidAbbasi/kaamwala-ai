# Reasoning & Decisions — KaamWala AI

> Decision reasoning chains from Antigravity during development.

---

## Reasoning 1: Why 12 Ranking Factors?

**Context:** User requested transparent provider ranking.
**Options considered:**
- Option A: Simple distance-based (nearest wins) — too simplistic
- Option B: Gemini chooses best provider — non-deterministic, opaque
- Option C: Multi-factor deterministic scoring — transparent, reproducible

**Reasoning:** Hackathon judges need to see WHY a provider is ranked #1. A deterministic formula makes the reasoning auditable. Gemini enhances with natural-language explanation but doesn't override scores.

**Decision:** 12-factor deterministic scoring with Gemini explanation layer.

---

## Reasoning 2: PKR Currency for Pakistan Context

**Context:** Price estimates need a currency.
**Reasoning:** The app targets Pakistan's informal economy. Using PKR (Pakistani Rupee) makes the demo authentic and contextually grounded.

**Decision:** All price estimates in PKR with range (low/high/recommended).

---

## Reasoning 3: Roman Urdu as Primary Demo Input

**Context:** Need a demo request that's authentic.
**Reasoning:** 70%+ of informal economy communication in Pakistan is in Roman Urdu (Urdu written in Latin script). Using Roman Urdu as the demo input demonstrates real-world applicability.

**Decision:** Default demo: "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai."

---

## Reasoning 4: Simulation Labels Instead of Real Actions

**Context:** App could theoretically send SMS or contact providers.
**Reasoning:**
- Contacting random Google Places businesses is unethical
- Sending SMS to unknown numbers violates privacy
- Hackathon demos should be safe and controllable

**Decision:** All contact actions are "PREVIEW ONLY." Only opted-in test providers receive real notifications (if configured).

---

## Reasoning 5: Firestore Over Local Storage

**Context:** Where to store workflow data.
**Options:**
- Local storage — fast but no persistence across devices, no audit trail
- Firestore — real database, auditable, demonstrates backend integration

**Reasoning:** Judges need to see real data persistence. Firestore also enables the agent trace system — every decision logged with timestamp and confidence.

**Decision:** All workflow state in Firestore: requests, traces, bookings, evaluations, notifications.

---

## Reasoning 6: Before/After Comparison Design

**Context:** How to demonstrate the value of the agentic approach.
**Reasoning:** Judges evaluate "how much better is this than the alternative?" A structured 9-dimension before/after comparison makes the improvement concrete and measurable.

**Decision:** OutcomeEvaluationScreen shows: ❌ BEFORE (manual) vs ✅ AFTER (agentic) for 9 dimensions.

---

## 📸 Screenshot Placeholder

```
[ ] Screenshot: Antigravity discussing ranking factor weights
[ ] Screenshot: Antigravity reasoning about simulation boundaries
[ ] Screenshot: Antigravity designing the before/after comparison
```
