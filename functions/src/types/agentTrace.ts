// functions/src/types/agentTrace.ts
// Agent Trace type definitions — shared across all backend services

import { Timestamp } from 'firebase-admin/firestore';

/**
 * All possible agentic phases in the Observe → Recover loop.
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
 * Full agent trace record stored in Firestore.
 */
export interface AgentTrace {
  traceId: string;
  workflowId: string;
  userId?: string;
  agentName: string;
  phase: AgentPhase;
  inputSummary: Record<string, any>;
  observation: string;
  reasoningSummary: string;
  decision: string;
  actionTaken: string;
  toolUsed: string;
  toolResultSummary: string;
  confidence: number;
  stateBefore: Record<string, any>;
  stateAfter: Record<string, any>;
  latencyMs: number;
  estimatedCost: string;
  warnings: string[];
  errorMessage: string;
  recoveryAction: string;
  privacySafe: boolean;
  createdAt: Timestamp | Date;
}

/**
 * Parameters to create a new trace entry.
 * Most fields are optional — the logger fills defaults.
 */
export interface TraceInput {
  workflowId: string;
  userId?: string;
  agentName: string;
  phase: AgentPhase;
  inputSummary?: Record<string, any>;
  observation?: string;
  reasoningSummary?: string;
  decision?: string;
  actionTaken?: string;
  toolUsed?: string;
  toolResultSummary?: string;
  confidence?: number;
  stateBefore?: Record<string, any>;
  stateAfter?: Record<string, any>;
  latencyMs?: number;
  estimatedCost?: string;
  warnings?: string[];
  errorMessage?: string;
  recoveryAction?: string;
  privacySafe?: boolean;
}

/**
 * Safe summary returned to mobile app — no internal state.
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
