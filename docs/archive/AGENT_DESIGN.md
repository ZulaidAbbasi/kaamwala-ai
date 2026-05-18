# KaamWala AI — Agent Design Document

**Last Updated:** 2026-05-16

---

## What Is an Agent?

In KaamWala AI, an **agent** is a named reasoning component that:
1. **Observes** input or state
2. **Reasons** about what to do using AI (Gemini) or rules
3. **Decides** on a course of action
4. **Acts** — calls an external API or writes to Firestore
5. **Logs** every step as a traceable decision record

Agents are not autonomous background processes — they are invoked by Cloud Function endpoints and run synchronously within a single request-response cycle.

---

## Agent Registry

| Agent | Triggered By | Phase(s) | Tools Used |
|-------|-------------|----------|-----------|
| `NLU_Agent` | POST /parseRequest | understanding, observation | Gemini API |
| `Discovery_Agent` | POST /discoverProviders | observation, tool_call | Places, Geocoding, Distance Matrix |
| `Ranking_Agent` | POST /rankProviders | reasoning, decision | Gemini API |
| `Pricing_Agent` | POST /estimatePrice | decision | Gemini API |
| `Booking_Agent` | POST /createBooking | action | Firestore Admin SDK |
| `FollowUp_Agent` | POST /simulateFollowUp | evaluation | Firestore Admin SDK |
| `Recovery_Agent` | POST /simulateProviderCancellation | recovery, reasoning | Gemini + Firestore |
| `Dispute_Agent` | POST /resolveDispute | recovery, reasoning | Gemini API |

---

## Trace Architecture

Every agent call produces one or more `AgentTrace` records:

```
POST /parseRequest
  └→ NLU_Agent
       ├→ Trace [observation]: "Received 89-char Roman Urdu input"
       └→ Trace [understanding]: "Extracted AC Repair, G-13, tomorrow, low budget"

POST /discoverProviders
  └→ Discovery_Agent
       ├→ Trace [observation]: "Searching HVAC providers near G-13"
       ├→ Trace [tool_call]: "Geocoding G-13 → 33.631, 73.027"
       ├→ Trace [tool_call]: "Places API → 8 results"
       └→ Trace [result]: "10 candidates merged (8 Google + 2 registered)"
```

---

## Trace Record Structure

```typescript
interface AgentTrace {
  traceId: string;            // Unique ID
  workflowId: string;         // Links to service_request
  agentName: string;          // Which agent
  phase: AgentPhase;          // What stage of reasoning
  observation: string;        // What the agent observed
  reasoningSummary: string;   // How it thought
  decision: string;           // What it decided
  actionTaken: string;        // What it did
  toolUsed: string;           // Which external tool
  toolResultSummary: string;  // What the tool returned
  confidence: number;         // 0.0 – 1.0
  latencyMs: number;          // Time taken
  estimatedCost: string;      // Approximate API cost
  warnings: string[];         // Non-fatal issues
  errorMessage: string;       // If something failed
  recoveryAction: string;     // How it recovered
  privacySafe: boolean;       // No PII in this trace
  createdAt: Timestamp;
}
```

---

## Phase Definitions

| Phase | Icon | Meaning |
|-------|------|---------|
| `observation` | 👁️ | Agent received input, observed current state |
| `understanding` | 🧠 | NLU/parsing — extracted structured data from text |
| `reasoning` | ⚙️ | Multi-factor analysis — weighing options |
| `decision` | ✅ | Made a choice — selected best option |
| `tool_call` | 🔧 | Called external API (Gemini, Places, etc.) |
| `action` | 🚀 | Wrote to Firestore, created a booking |
| `result` | 📊 | Received result from tool or action |
| `error` | ❌ | Something failed |
| `recovery` | 🔄 | Handling failure — fallback logic |
| `evaluation` | 📋 | Post-action assessment |

---

## Why This Matters for Judging

1. **Transparency:** Every AI decision is logged and explainable
2. **Accountability:** Judges can see exactly why a provider was ranked #1
3. **Completeness:** The full observe → recover loop is documented
4. **Real evidence:** Traces are stored in Firestore, not generated on-the-fly
5. **Export:** Traces can be exported as JSON for submission

---

## Mobile Trace Viewer

The `AgentTracePanel` component renders traces as a visual timeline:
- Phase badges with color coding
- Confidence progress bars
- Expandable detail sections
- Tool call indicators
- Warning and error highlights
- One-tap JSON export

Sample traces are included for UI testing, clearly labeled with a `📋 SAMPLE DATA` badge.

---

## Gemini Integration Layer

The Gemini service is implemented as 4 files in `functions/src/services/gemini/`:

| File | Purpose |
|------|---------|
| `geminiClient.ts` | Main client — 5 public methods, JSON parsing, fallback routing |
| `geminiPrompts.ts` | All prompt templates with safety rules + strict JSON output |
| `geminiSchemas.ts` | TypeScript interfaces + validation for all Gemini outputs |
| `geminiFallback.ts` | Keyword-based fallback for every Gemini method |

### Model Configuration

| Setting | Value | Why |
|---------|-------|-----|
| Model | `gemini-2.0-flash` | Fast, cost-effective, sufficient for NLU |
| Temperature | 0.2 | Low randomness for consistent JSON output |
| Top-P | 0.8 | Balanced creativity vs consistency |
| Max Tokens | 2048 | Enough for structured responses |
| Response MIME | `application/json` | Forces JSON output |

### Resilience Strategy

```
Gemini API Call
  ├→ Success + valid JSON → return (source: "gemini", confidence: 0.7–0.95)
  ├→ Success + bad JSON → repair attempt → return or fallback
  ├→ API error → keyword fallback (source: "fallback", confidence: 0.35)
  └→ Key missing → immediate fallback (source: "fallback", confidence: 0.35)
```

### Safety Rules (Enforced in Prompts)

1. Do NOT invent provider facts
2. Do NOT claim provider acceptance
3. Do NOT send real messages
4. Do NOT store sensitive data
5. Do NOT include PII in output
6. Do NOT fabricate availability

---

## Ranking_Agent

**Purpose:** Score and rank discovered providers using deterministic multi-factor analysis.

### Pipeline

```
Candidates[] + ParsedRequest
  ├→ Score each candidate across 12 weighted factors
  ├→ Sort by total score descending
  ├→ Generate strengths, weaknesses, risk flags
  ├→ Compute baseline (nearest-distance-only) comparison
  ├→ Optional: Gemini explains the decision
  └→ Return ranked list + selected provider + agentic advantage
```

### 12 Scoring Factors

| Factor | Weight | Source |
|--------|--------|--------|
| Service Relevance | 12% | Category matching |
| Distance Proximity | 14% | Distance Matrix API |
| Rating | 10% | Google/internal (null = 0.5) |
| Review Strength | 6% | Google/internal (null = 0.4) |
| Open Status | 5% | Google (null = 0.5) |
| Registered Provider | 15% | Firestore lookup |
| Verified & Active | 8% | Business status |
| Availability Fit | 6% | Registered schedule |
| Price Fit | 8% | Base fee vs budget |
| Urgency Fit | 4% | Open + distance for urgent |
| Data Completeness | 7% | Fields present count |
| Missing Data Penalty | 5% | Per-missing-field penalty |

### Key Rules

1. Gemini explains — does NOT choose the provider
2. Scoring is deterministic — same input = same output
3. Missing data gets neutral score (0.5) — never fabricated
4. Cancellation rate used ONLY for registered providers
5. Google Places providers never get fake cancellation data
6. Every factor has a weight, raw value, and explanation

---

## Complete Agent Pipeline

```
User Input (Urdu/English)
  │
  ▼ NLU_Agent (Gemini parseServiceRequest)
  │  Traces: observation → understanding → result
  │
  ▼ Discovery_Agent (Geocoding + Places + Distance)
  │  Traces: observation → tool_call(geocode) → tool_call(places) → result
  │
  ▼ Ranking_Agent (12-factor scoring + Gemini explanation)
  │  Traces: observation → reasoning → decision
  │
  ▼ Booking_Agent (coming next)
  │  Creates real Firestore booking record
  │
  ▼ Recovery_Agent (coming next)
     Handles cancellation + fallback selection
```


