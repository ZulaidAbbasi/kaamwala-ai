// functions/src/services/traceLogger.ts
// Agent Trace Logger — writes every agentic decision to Firestore
// Designed for hackathon judging: complete, redacted, fault-tolerant

import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { AgentTrace, TraceInput, TraceSummary } from '../types/agentTrace';
import { safeLog } from '../utils/safeLogger';
const COLLECTION = 'agent_traces';

/** Patterns to redact from trace content */
const REDACT_PATTERNS = [
  /AIzaSy[A-Za-z0-9_-]{30,}/g,
  /sk-[A-Za-z0-9]{40,}/g,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
];

/**
 * Redact secrets from any string value.
 */
function redact(value: string): string {
  let clean = value;
  for (const pattern of REDACT_PATTERNS) {
    pattern.lastIndex = 0;
    clean = clean.replace(pattern, '[REDACTED]');
  }
  return clean;
}

/**
 * Deep-redact an object — replace string values that look like secrets.
 */
function redactObject(obj: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      safe[key] = redact(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      safe[key] = redactObject(value);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Create and save an agent trace to Firestore.
 *
 * Design:
 * - Never throws — traces must not break the main workflow.
 * - Redacts any secrets that might leak into trace content.
 * - Returns a safe summary for the mobile app.
 */
export async function logTrace(input: TraceInput): Promise<TraceSummary> {
  const traceId = `trace_${uuid().substring(0, 8)}`;
  const now = new Date();

  const trace: AgentTrace = {
    traceId,
    workflowId: input.workflowId,
    userId: input.userId || '',
    agentName: input.agentName,
    phase: input.phase,
    inputSummary: input.inputSummary ? redactObject(input.inputSummary) : {},
    observation: redact(input.observation || ''),
    reasoningSummary: redact(input.reasoningSummary || ''),
    decision: redact(input.decision || ''),
    actionTaken: redact(input.actionTaken || ''),
    toolUsed: input.toolUsed || '',
    toolResultSummary: redact(input.toolResultSummary || ''),
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0)),
    stateBefore: input.stateBefore ? redactObject(input.stateBefore) : {},
    stateAfter: input.stateAfter ? redactObject(input.stateAfter) : {},
    latencyMs: input.latencyMs ?? 0,
    estimatedCost: input.estimatedCost || 'N/A',
    warnings: (input.warnings || []).map(redact),
    errorMessage: redact(input.errorMessage || ''),
    recoveryAction: redact(input.recoveryAction || ''),
    privacySafe: input.privacySafe ?? true,
    createdAt: Timestamp.fromDate(now),
  };

  // Write to Firestore — never throw
  try {
    await db.collection(COLLECTION).doc(traceId).set(trace);
    safeLog.info('TraceLogger', `Saved trace ${traceId} [${trace.phase}] for workflow ${trace.workflowId}`);
  } catch (err: any) {
    safeLog.error('TraceLogger', `Failed to save trace ${traceId}`, err);
    // Continue — trace failure must not break the endpoint
  }

  return toSummary(trace, now);
}

/**
 * Retrieve all traces for a workflow, ordered by creation time.
 */
export async function getWorkflowTraces(workflowId: string): Promise<TraceSummary[]> {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('workflowId', '==', workflowId)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as AgentTrace;
      const ts = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(data.createdAt as any);
      return toSummary(data, ts);
    });
  } catch (err: any) {
    safeLog.error('TraceLogger', `Failed to get traces for ${workflowId}`, err);
    return [];
  }
}

/**
 * Convert full trace to safe summary for mobile.
 */
function toSummary(trace: AgentTrace, date: Date): TraceSummary {
  return {
    traceId: trace.traceId,
    workflowId: trace.workflowId,
    agentName: trace.agentName,
    phase: trace.phase,
    observation: trace.observation,
    reasoningSummary: trace.reasoningSummary,
    decision: trace.decision,
    actionTaken: trace.actionTaken,
    toolUsed: trace.toolUsed,
    toolResultSummary: trace.toolResultSummary,
    confidence: trace.confidence,
    latencyMs: trace.latencyMs,
    estimatedCost: trace.estimatedCost,
    warnings: trace.warnings,
    errorMessage: trace.errorMessage,
    recoveryAction: trace.recoveryAction,
    createdAt: date.toISOString(),
  };
}
