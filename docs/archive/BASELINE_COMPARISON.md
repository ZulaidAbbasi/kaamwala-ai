# KaamWala AI — Baseline vs Agentic Comparison

**Last Updated:** 2026-05-16

---

## Purpose

This document explains the difference between a naive "baseline" approach (what a user would do without AI) and the agentic multi-factor approach KaamWala AI provides.

---

## Baseline Method: Nearest Distance Only

```
Input: Service type + location
Action: Sort providers by distance
Output: Pick the nearest one
```

**Problems with baseline:**

| Problem | Example |
|---------|---------|
| Ignores ratings | Nearest plumber has 2.1 stars |
| Ignores registration | Nearest provider can't be booked |
| Ignores availability | Nearest is closed on weekends |
| Ignores price | Nearest charges 3x the budget |
| Ignores data quality | Nearest has zero reviews |
| No risk assessment | No way to flag missing data |
| No transparency | User doesn't know why they picked this one |

---

## Agentic Method: 12-Factor Deterministic Scoring

```
Input: Service type + location + urgency + budget + time preference
Action: Score each candidate across 12 weighted factors
Output: Ranked list with explanations, strengths, weaknesses, risk flags
```

### Factor Weights

| # | Factor | Weight | What It Measures |
|---|--------|--------|-----------------|
| 1 | Service Relevance | 12% | Category match to request |
| 2 | Distance Proximity | 14% | km from customer location |
| 3 | Rating | 10% | Google/internal rating (if available) |
| 4 | Review Strength | 6% | Number of reviews |
| 5 | Open Status | 5% | Currently open (if known) |
| 6 | Registered Provider | 15% | Is in our system? Bookable? |
| 7 | Verified & Active | 8% | Business status |
| 8 | Availability Fit | 6% | Matches preferred time (registered only) |
| 9 | Price Fit | 8% | Fee vs budget sensitivity |
| 10 | Urgency Fit | 4% | Open + close for emergency |
| 11 | Data Completeness | 7% | How much data is available |
| 12 | Missing Data Penalty | 5% | Penalty for unknown fields |

**Total: 100%**

---

## Scoring Rules

| Rule | Baseline | Agentic |
|------|----------|---------|
| Missing rating | Ignored | Neutral score (0.5) + warning |
| Missing distance | No ranking possible | Uses other factors |
| Not registered | Still "selected" | Flagged as discovery-only |
| Cancellation rate | Not considered | Used ONLY for registered providers |
| Fake data invented? | N/A | ❌ Never — null is null |
| Explanation provided? | ❌ None | ✅ Per-factor with weights |

---

## Example Comparison

**Demo request:** "AC repair near G-13 Islamabad, budget low, morning tomorrow"

### Baseline Selection
```
Method: nearest_distance
Selected: "Google AC Shop" at 0.8 km
Reasoning: Picked nearest. No rating, availability, or price considered.
```

### Agentic Selection
```
Method: 12-factor ranking
Selected: "CoolTech AC Solutions" (registered) — Score: 78.3%
Factors:
  - Service Relevance: 100% (AC Repair match)
  - Distance: 80% (2.1 km)
  - Rating: 90% (4.5/5)
  - Registered: 100% (bookable)
  - Price Fit: 100% (PKR 1,500, fits low budget)
  - Availability: 100% (morning slot available)
Why better: Registered provider with verified rating, 47 completed jobs,
  available in morning slot, within budget. Baseline would have picked an
  unregistered Google listing with no rating data.
```

---

## For Judges

The ranking engine is **fully deterministic** — no randomness, no hidden logic:
- Every factor has a fixed weight
- Every factor produces a 0.0–1.0 normalized score
- The total is a weighted sum
- Gemini is used ONLY to generate natural language explanations
- Gemini does NOT choose the provider — the scoring engine does

---

## Outcome Evaluator Agent

The `OutcomeEvaluatorAgent` computes 12 metrics, builds a 9-dimension before/after comparison, and generates an overall workflow score.

### 12 Metrics

| Metric | Weight | Description |
|--------|--------|-------------|
| requestUnderstandingConfidence | 15% | NLU confidence from Gemini/fallback |
| providerCandidatesFound | 10% | Real candidates from Places + registered |
| selectedProviderScore | 15% | Multi-factor ranking score |
| baselineProviderScore | — | What naive nearest-only would score |
| transparencyScore | 10% | % of steps with trace logs |
| bookingReadiness | 15% | Can booking be created? |
| recoveryReadiness | 10% | Fallback system available? |
| dataCompleteness | 10% | Extracted fields vs total fields |
| userEffortReduction | 10% | Automation vs manual effort |
| workflowCompletion | 5% | Steps completed vs total |
| latencyEstimate | — | Total workflow ms |
| costEstimate | — | ~$0.023 per workflow |

### Scoring Rubric

| Grade | Score | Description |
|-------|-------|-------------|
| A+ | 90-100 | Full workflow, registered provider, real booking |
| A | 80-89 | Complete with minor gaps |
| B+ | 70-79 | Good with some data missing |
| B | 60-69 | Partial, provider may be unregistered |
| C | 50-59 | Significant limitations |
| D | 40-49 | Major failures |
| F | 0-39 | Workflow mostly failed |

### 9-Dimension Before/After

| Dimension | Before (Baseline) | After (Agentic) |
|-----------|-------------------|------------------|
| Request Understanding | Unstructured text | Multilingual NLU |
| Provider Discovery | Manual search | Multi-source API |
| Provider Selection | Nearest pick | 12-factor ranking |
| Price Estimation | No estimate | Market-rate engine |
| Booking | No record | Firestore + events |
| Follow-Up | None | 10-step lifecycle |
| Fallback | Start over | 6 recovery paths |
| Traceability | None | Agent trace logs |
| User Effort | Manual | ~85% reduction |

