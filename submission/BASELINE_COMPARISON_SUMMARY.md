# Baseline vs Agentic Comparison

> How KaamWala AI improves upon traditional non-agentic workflows.

---

## 9 Dimensions of Improvement

| Dimension | ❌ Baseline (Non-AI) | ✅ Agentic (KaamWala AI) |
|-----------|--------------------|------------------------|
| **Request Understanding** | User must type exact service name in English | Multilingual NLU: Urdu, Roman Urdu, English via Gemini |
| **Provider Discovery** | Ask friends or search one platform | Google Places API + registered provider database |
| **Provider Selection** | Pick nearest or cheapest — no reasoning | 12-factor deterministic scoring with transparent weights |
| **Price Estimation** | Ask the provider — no comparison | Market-rate engine with transparent breakdown |
| **Booking** | Verbal agreement — no record | Real Firestore record with event trail |
| **Follow-Up** | No reminder, no checklist, no feedback | 10-step lifecycle: arrival → diagnosis → completion → rating |
| **Fallback** | If provider cancels, start over | 6 automated recovery scenarios |
| **Transparency** | Opaque decisions — no explanation | Full agent trace logs for every decision |
| **User Effort** | Search → call → negotiate → hope | One input → AI handles entire pipeline |

---

## 12-Factor Ranking Engine

Instead of simply sorting by distance, the AI evaluates 12 weighted factors:

1. Service Relevance (12%)
2. Distance Proximity (14%)
3. Rating (10%)
4. Review Strength (6%)
5. Open Status (5%)
6. Registered Provider (15%)
7. Verified & Active (8%)
8. Availability Fit (6%)
9. Price Fit (8%)
10. Urgency Fit (4%)
11. Data Completeness (7%)
12. Missing Data Penalty (5%)

> **Why deterministic?** We use math for scoring to ensure reproducibility and fairness. Gemini is used to *explain* the reasoning in natural language, not to randomly select a winner.

---

## Agentic Advantage

Without the agent, a user would likely pick the closest business on Google Maps, even if they have terrible reviews or are closed. 

KaamWala AI ensures that the user is matched with a **registered, highly-rated, budget-appropriate** provider, falling back to discovered businesses if no registered provider is available (and marking them as requiring onboarding).
