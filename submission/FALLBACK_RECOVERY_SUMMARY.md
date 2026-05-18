# Fallback & Recovery Summary

> How KaamWala AI gracefully handles failures and edge cases.

---

## 6 Automated Recovery Scenarios

The system includes a dedicated `Recovery_Agent` that handles disputes and failures. Each scenario follows the agentic loop: **Observe → Act → Evaluate**.

### 1. Provider Cancellation
- **Trigger:** Selected provider cancels the booking.
- **Agent Action:** Marks booking as cancelled, re-runs the 12-factor ranking excluding the cancelled provider, and automatically selects the next best registered provider.
- **Outcome:** Replacement booking created + bilingual apology generated.

### 2. No Provider Found
- **Trigger:** Neither Google Places nor the registered database returns any results.
- **Agent Action:** Relaxes search constraints (e.g., expands distance radius) or suggests an alternative service category.
- **Outcome:** Suggested next steps for the user.

### 3. Low Confidence Request
- **Trigger:** Gemini parses the request but confidence score is < 0.4.
- **Agent Action:** Pauses the workflow before discovery.
- **Outcome:** Generates a specific clarification question (e.g., "Do you need AC installation or repair?").

### 4. API Failure (Degraded Mode)
- **Trigger:** Google Places or Gemini API fails/times out.
- **Agent Action:** Falls back to deterministic keyword parsing (for NLU) or registered-only database (for discovery).
- **Outcome:** Workflow completes with lower confidence score and warnings.

### 5. Price Dispute
- **Trigger:** Customer claims actual charge exceeded the estimate.
- **Agent Action:** Evaluates the claim against the original estimate and Pakistan market norms.
- **Outcome:** Generates fair resolution messages for both parties.

### 6. Missing Location
- **Trigger:** Request lacks a service location.
- **Agent Action:** Halts workflow early.
- **Outcome:** Prompts user for their location (e.g., "Bhai, location toh bata dein?").

---

## Technical Implementation

- **Partial Results:** If a step fails, the Orchestrator (`runWorkflow`) does not crash. It returns `success: false` but includes all data gathered up to the point of failure.
- **Trace Logs:** Every recovery action is logged to Firestore with `stateBefore` and `stateAfter` for full audibility.
- **Try/Catch:** All 11 endpoint handlers are wrapped in robust try/catch blocks that return structured JSON errors (500 status) instead of crashing the Node process.
