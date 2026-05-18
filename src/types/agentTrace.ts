// src/types/agentTrace.ts
// Agent Trace types for mobile app — mirrors backend TraceSummary

/**
 * All possible agentic phases.
 */
export type AgentPhase =
  | 'observation'
  | 'understanding'
  | 'reasoning'
  | 'decision'
  | 'tool_call'
  | 'action'
  | 'result'
  | 'error'
  | 'recovery'
  | 'evaluation';

/**
 * Trace summary received from backend.
 */
export interface TraceSummary {
  traceId: string;
  workflowId: string;
  agentName: string;
  phase: AgentPhase;
  observation: string;
  reasoningSummary: string;
  decision: string;
  actionTaken: string;
  toolUsed: string;
  toolResultSummary: string;
  confidence: number;
  latencyMs: number;
  estimatedCost: string;
  warnings: string[];
  errorMessage: string;
  recoveryAction: string;
  createdAt: string;
}

/**
 * Phase display metadata.
 */
export const PHASE_META: Record<AgentPhase, { label: string; icon: string; color: string }> = {
  observation:    { label: 'Observe',     icon: '👁️', color: '#4285F4' },
  understanding:  { label: 'Understand',  icon: '🧠', color: '#A142F4' },
  reasoning:      { label: 'Reason',      icon: '⚙️', color: '#FBBC04' },
  decision:       { label: 'Decide',      icon: '✅', color: '#34A853' },
  tool_call:      { label: 'Tool Call',   icon: '🔧', color: '#EA8600' },
  action:         { label: 'Act',         icon: '🚀', color: '#4285F4' },
  result:         { label: 'Result',      icon: '📊', color: '#34A853' },
  error:          { label: 'Error',       icon: '❌', color: '#EA4335' },
  recovery:       { label: 'Recover',     icon: '🔄', color: '#FF6D01' },
  evaluation:     { label: 'Evaluate',    icon: '📋', color: '#9AA0A6' },
};

/**
 * Sample trace for local UI testing — clearly labeled.
 */
export const SAMPLE_TRACES: TraceSummary[] = [
  {
    traceId: 'sample_trace_01',
    workflowId: 'sample_workflow',
    agentName: 'NLU_Agent',
    phase: 'understanding',
    observation: 'Received 89-character Roman Urdu input from user.',
    reasoningSummary: 'Detected service type: AC Repair. Location: G-13, Islamabad. Urgency: tomorrow morning. Budget: low. Language: Roman Urdu mixed with English.',
    decision: 'Parsed request with 94% confidence. Proceed to provider discovery.',
    actionTaken: 'parse_complete',
    toolUsed: 'gemini_api',
    toolResultSummary: 'Extracted 6 fields: serviceType, location, urgency, budget, issueDescription, languageDetected.',
    confidence: 0.94,
    latencyMs: 1250,
    estimatedCost: '~0.001 USD',
    warnings: [],
    errorMessage: '',
    recoveryAction: '',
    createdAt: new Date().toISOString(),
  },
  {
    traceId: 'sample_trace_02',
    workflowId: 'sample_workflow',
    agentName: 'Discovery_Agent',
    phase: 'observation',
    observation: 'Searching for HVAC providers near G-13, Islamabad within 5km radius.',
    reasoningSummary: 'Geocoded G-13 to lat=33.631, lng=73.027. Found 8 Google Places results. Found 2 registered providers in our system.',
    decision: 'Merge 10 total candidates for ranking.',
    actionTaken: 'discover_complete',
    toolUsed: 'google_places_api + geocoding_api + distance_matrix_api',
    toolResultSummary: '10 candidates: 8 from Google Places (not bookable), 2 from registered providers (bookable).',
    confidence: 0.88,
    latencyMs: 2100,
    estimatedCost: '~0.03 USD',
    warnings: ['2 Google Places results had no phone number'],
    errorMessage: '',
    recoveryAction: '',
    createdAt: new Date(Date.now() + 2000).toISOString(),
  },
  {
    traceId: 'sample_trace_03',
    workflowId: 'sample_workflow',
    agentName: 'Ranking_Agent',
    phase: 'reasoning',
    observation: 'Evaluating 10 candidates using 4 factors: distance, rating, relevance, budget fit.',
    reasoningSummary: 'Top candidate: KaamWala Demo AC Services (registered, 0.8km, 4.5★, budget-friendly). Runner-up: Cool Tech (Google Places, 1.2km, 4.2★, not registered).',
    decision: 'Rank KaamWala Demo AC Services #1. Mark as bookable.',
    actionTaken: 'ranking_complete',
    toolUsed: 'gemini_api',
    toolResultSummary: 'Ranked 10 providers. 2 bookable, 8 discovery-only.',
    confidence: 0.89,
    latencyMs: 1800,
    estimatedCost: '~0.002 USD',
    warnings: [],
    errorMessage: '',
    recoveryAction: '',
    createdAt: new Date(Date.now() + 4000).toISOString(),
  },
  {
    traceId: 'sample_trace_04',
    workflowId: 'sample_workflow',
    agentName: 'Booking_Agent',
    phase: 'action',
    observation: 'User selected provider prov_hvac_01 for booking.',
    reasoningSummary: 'Provider is registered and active. Available tomorrow morning. Base fee PKR 2,500 within low budget range.',
    decision: 'Create booking record in Firestore.',
    actionTaken: 'booking_created',
    toolUsed: 'firestore_admin_sdk',
    toolResultSummary: 'Booking book_abc123 created. Status: confirmed_pending_provider.',
    confidence: 1.0,
    latencyMs: 350,
    estimatedCost: 'N/A',
    warnings: [],
    errorMessage: '',
    recoveryAction: '',
    createdAt: new Date(Date.now() + 6000).toISOString(),
  },
  {
    traceId: 'sample_trace_05',
    workflowId: 'sample_workflow',
    agentName: 'Recovery_Agent',
    phase: 'recovery',
    observation: 'Provider prov_hvac_01 cancelled booking due to unavailability.',
    reasoningSummary: 'Original booking cancelled. Re-ranking remaining registered providers. Next best: prov_plumb_01 at 1.5km, 4.3★.',
    decision: 'Auto-rebook with fallback provider prov_plumb_01.',
    actionTaken: 'fallback_booking_created',
    toolUsed: 'gemini_api + firestore_admin_sdk',
    toolResultSummary: 'New booking book_def456 created with KaamWala Demo Plumbing. Original booking marked cancelled.',
    confidence: 0.85,
    latencyMs: 2400,
    estimatedCost: '~0.002 USD',
    warnings: ['Fallback provider specializes in plumbing, not HVAC — may have limited AC expertise'],
    errorMessage: '',
    recoveryAction: 'auto_rebook_with_next_registered_provider',
    createdAt: new Date(Date.now() + 8000).toISOString(),
  },
];
