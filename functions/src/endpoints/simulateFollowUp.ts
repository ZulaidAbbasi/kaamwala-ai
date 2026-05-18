// functions/src/endpoints/simulateFollowUp.ts
// POST /simulateFollowUp — Simulates full service lifecycle after booking
// Creates real Firestore records for timeline, checklist, feedback, reputation

import { Request, Response } from 'express';
import { simulateFollowUp } from '../services/followUpService';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';

/**
 * POST /simulateFollowUp
 */
export async function handleSimulateFollowUp(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, bookingId } = req.body;

  // ── 1. Validate ───────────────────────────────────────────────────
  if (!workflowId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_WORKFLOW_ID', message: 'workflowId is required.' } });
    return;
  }
  if (!bookingId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_BOOKING_ID', message: 'bookingId is required.' } });
    return;
  }

  const traces: TraceSummary[] = [];

  try {

  // ── 2. Trace: observation ─────────────────────────────────────────
  const observeTrace = await logTrace({
    workflowId,
    agentName: 'FollowUp_Agent',
    phase: 'observation',
    observation: `Follow-up simulation requested for booking ${bookingId}.`,
    reasoningSummary: 'Will simulate 10-step lifecycle: booking → reminder → arrival → diagnosis → completion → feedback → reputation.',
    decision: 'Proceed with lifecycle simulation.',
    actionTaken: 'follow_up_initiated',
    toolUsed: 'none',
    confidence: 1.0,
    latencyMs: 0,
  });
  traces.push(observeTrace);

  // ── 3. Run simulation ─────────────────────────────────────────────
  const result = await simulateFollowUp({ workflowId, bookingId });

  // ── 4. Trace: action ──────────────────────────────────────────────
  const actionTrace = await logTrace({
    workflowId,
    agentName: 'FollowUp_Agent',
    phase: 'action',
    observation: `Timeline generated: ${result.timeline.length} events. Checklist: ${result.checklist.length} items.`,
    reasoningSummary: `Feedback: ${result.feedback.rating}/5. Reputation updated: ${result.reputationUpdate.ratingUpdated}.`,
    decision: `Booking marked completed. ${result.firestoreSaved ? 'All saved to Firestore.' : 'Firestore save may have failed.'}`,
    actionTaken: 'follow_up_completed',
    toolUsed: 'firestore_batch',
    toolResultSummary: `Events: ${result.timeline.length}, Checklist: ${result.checklist.length}, Feedback: ${result.feedback.rating}/5`,
    confidence: 1.0,
    latencyMs: Date.now() - startTime,
    stateBefore: { status: 'pending_provider_confirmation' },
    stateAfter: { status: 'completed', rating: result.feedback.rating, reputationUpdated: result.reputationUpdate.ratingUpdated },
  });
  traces.push(actionTrace);

  // ── 5. Trace: evaluation ──────────────────────────────────────────
  const evalTrace = await logTrace({
    workflowId,
    agentName: 'FollowUp_Agent',
    phase: 'evaluation',
    observation: 'Evaluating impact of this completed job on future provider matching.',
    reasoningSummary: result.futureMatchingImpact.explanation,
    decision: result.futureMatchingImpact.factors.join(' | '),
    actionTaken: 'matching_impact_evaluated',
    toolUsed: 'none',
    confidence: 0.9,
    latencyMs: Date.now() - startTime,
  });
  traces.push(evalTrace);

  // ── 6. Return ─────────────────────────────────────────────────────
  const totalLatency = Date.now() - startTime;
  safeLog.apiCall('POST', '/simulateFollowUp', 200, totalLatency);

  res.json({
    success: true,
    ...result,
    traces,
    latencyMs: totalLatency,
  });

  } catch (err: any) {
    safeLog.error('simulateFollowUp', err);
    res.status(500).json({ success: false, error: { code: 'FOLLOWUP_ERROR', message: err.message || 'Follow-up simulation failed.' } });
  }
}
