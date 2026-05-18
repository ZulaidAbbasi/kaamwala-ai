# KaamWala AI — Cost & Scalability Analysis

**Last Updated:** 2026-05-16

---

## Pricing Engine Design

KaamWala AI generates **transparent estimates**, never final quotes. The pricing service documents every assumption and unknown, ensuring fairness and trust.

### Estimation Factors

| Factor | How Applied | Source |
|--------|------------|--------|
| Base Service Rate | Market rates for Islamabad by service type | Internal rate table |
| Provider Fee | Anchors on registered provider's listed fee | Firestore `provider_profiles` |
| Job Complexity | Keywords in issue description (+40% / -20%) | NLU from Gemini |
| Urgency Premium | Emergency: +50%, Today: +20%, Tomorrow: +5% | User request |
| Distance/Travel Fee | >5km: PKR 30–50/km | Distance Matrix API |
| Time-of-Day | Evening/Night: +10% | Preferred time slot |
| Parts & Materials | NOT included — quoted separately | Provider inspection |

### Output Structure

```json
{
  "estimateLow": 1200,
  "estimateHigh": 3500,
  "recommendedEstimate": 2100,
  "currency": "PKR",
  "breakdown": [
    { "label": "Base Service Fee", "amount": 1500, "type": "base" },
    { "label": "Urgency Premium", "amount": 300, "type": "fee" },
    { "label": "Travel Fee", "amount": 300, "type": "fee" }
  ],
  "assumptions": ["Using market rate for AC repair", "Same-day request — 20% premium"],
  "unknowns": ["Distance unknown — no travel fee added"],
  "fairnessExplanation": "Based on Islamabad market averages...",
  "confidence": 0.75,
  "providerNote": "Platform estimate — provider confirmation may be required.",
  "isEstimateOnly": true
}
```

---

## API Cost Analysis

### Per-Request API Costs (estimated)

| API Call | Cost per Call | Calls per Workflow |
|----------|-------------|-------------------|
| Gemini 2.0 Flash (NLU) | ~$0.001–0.003 | 1 |
| Gemini 2.0 Flash (Ranking Explanation) | ~$0.001–0.002 | 0–1 |
| Geocoding API | $0.005 | 1 |
| Places API (New) | $0.032 | 1 |
| Distance Matrix API | $0.005–0.01 | 1 |
| Firestore Reads | ~$0.0001 | 5–8 |
| Firestore Writes | ~$0.0005 | 4–6 |

### Total Cost per Complete Workflow

```
Minimum (no Gemini explanation): ~$0.044
Maximum (with explanation):      ~$0.053
Average:                         ~$0.048
```

### Monthly Cost Projections

| Daily Users | Workflows/Day | Monthly Cost |
|------------|--------------|--------------|
| 10 | 30 | ~$43 |
| 100 | 300 | ~$432 |
| 1,000 | 3,000 | ~$4,320 |
| 10,000 | 30,000 | ~$43,200 |

---

## Scalability Architecture

### Current (MVP)

```
Mobile App → Firebase Cloud Functions → Google APIs
                                     → Firestore
```

- **Concurrency:** Firebase Functions scale to 1,000 concurrent instances
- **Cold start:** ~2-4 seconds (Node.js)
- **Warm:** ~200-800ms per request

### Future (Production Scale)

```
Mobile App → Cloud Run (containers) → Google APIs + Redis Cache
                                   → Firestore / Cloud SQL
                                   → Pub/Sub for async jobs
```

Optimizations:
1. **Cache geocoding results** — Same area = same coordinates
2. **Cache Places results** — TTL 1 hour for same queries
3. **Batch distance calculations** — One API call for multiple providers
4. **Pre-compute pricing tiers** — Reduce per-request computation
5. **Async trace logging** — Don't block response for Firestore writes

---

## Revenue Model (Future)

| Stream | Description | Estimated |
|--------|------------|-----------|
| Commission | 5-10% of booking value | PKR 100-400/booking |
| Premium listings | Providers pay for visibility | PKR 500-2000/month |
| Verification badge | Provider verification service | PKR 1000 one-time |
| Urgency surcharge | Platform fee for emergency jobs | PKR 200-500/job |

### Break-Even Analysis

```
API cost per workflow: ~PKR 13 (~$0.048)
Average commission: PKR 200 (at 5% of PKR 4,000 job)
Profit per workflow: PKR 187
Break-even: ~23 workflows/month for API costs
```

---

## Hackathon Considerations

- **Free tier usage:** Google Cloud $300 free credit covers ~6,000+ workflows
- **Firebase free tier:** 50K reads/day, 20K writes/day
- **Gemini free tier:** Available for development
- **Current demo:** Well within all free tiers

---

## Outcome Evaluator Cost

| Component | Cost | Notes |
|-----------|------|-------|
| Evaluation compute | ~$0.000 | Pure computation, no API calls |
| Firestore write | ~$0.0005 | 1 document to outcome_evaluations |
| Total per evaluation | ~$0.001 | Negligible |

---

## Firestore Collections (Full System)

| Collection | Write Frequency | Purpose |
|-----------|----------------|---------|
| service_requests | 1/workflow | Parsed requests |
| provider_candidates | 1/workflow | Discovery results |
| ranking_decisions | 1/workflow | Ranking results |
| price_estimates | 1/workflow | Price estimates |
| bookings | 1/workflow | Booking records |
| booking_events | 2-3/workflow | Event trail |
| agent_traces | 5-7/workflow | Decision logs |
| follow_up_events | 10/follow-up | Lifecycle events |
| diagnosis_checklists | 1/follow-up | Service checklists |
| service_feedback | 1/follow-up | Customer ratings |
| notifications | 2/booking | Message previews |
| fallback_events | 1/recovery | Recovery records |
| workflow_summaries | 1/workflow | Orchestrator summary |
| outcome_evaluations | 1/evaluation | Score + metrics |
| provider_profiles | 3 (demo) | Registered providers |

