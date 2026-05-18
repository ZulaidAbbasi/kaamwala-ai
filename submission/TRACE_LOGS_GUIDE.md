# Trace Logs Guide

> How to find and present Antigravity traces for submission.

---

## Where Traces Live

### 1. Evidence Package (Primary)

```
docs/antigravity-evidence/
├── ANTIGRAVITY_USAGE.md       ← 20-phase usage summary
├── WORKPLAN_EXPORT.md         ← Full workplan
├── TASK_PLAN_EXPORT.md        ← Per-phase task breakdown
├── ARCHITECTURE_DECISIONS.md  ← 7 key decisions
├── AGENT_OBSERVATIONS.md      ← 6 observations
├── REASONING_DECISIONS.md     ← 6 reasoning chains
├── TOOL_CALLS_AND_ACTIONS.md  ← Full file creation inventory
├── ERROR_RECOVERY_TRACE.md    ← 5 build errors fixed
├── FINAL_OUTCOME_TRACE.md     ← Final system state
├── SCREENSHOT_CHECKLIST.md    ← 30+ screenshot items
├── VIDEO_CAPTURE_CHECKLIST.md ← Both video checklists
├── screenshots/               ← Add screenshots here
└── logs/                      ← Add raw logs here
```

### 2. Verification Log

```
docs/VERIFICATION_LOG.md — 26 phases, 1700+ lines
```

### 3. In-App Agent Traces

When you run the full workflow, every decision is logged to Firestore:
- Collection: `workflow_traces`
- Fields: phase, agentName, observation, reasoning, decision, confidence, latency

View traces in-app: **AgentTraceScreen** (accessible from HomeScreen results)

---

## How to Export

### Option A: Screenshots
Take screenshots of Antigravity conversations showing planning, code generation, debugging.

### Option B: Evidence Package
Point judges to `docs/antigravity-evidence/` — 11 structured files covering all phases.

### Option C: Verification Log
Point judges to `docs/VERIFICATION_LOG.md` — 26 phases of development with build results.

---

## Security Reminder

```
[ ] No API keys in any trace file
[ ] No passwords in any log
[ ] No personal phone numbers
[ ] Firebase project ID is OK (public config)
```
