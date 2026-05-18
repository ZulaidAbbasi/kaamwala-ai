// functions/src/endpoints/evaluateOutcome.ts
// POST /evaluateOutcome — Runs the OutcomeEvaluatorAgent

import { Request, Response } from 'express';
import { evaluateOutcome } from '../agents/outcomeEvaluatorAgent';
import { safeLog } from '../utils/safeLogger';

export async function handleEvaluateOutcome(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const {
    workflowId,
    parsedRequest,
    providerCandidates,
    rankedProviders,
    selectedProvider,
    priceEstimate,
    bookingResult,
    completedSteps,
    totalLatencyMs,
  } = req.body;

  if (!workflowId) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_WORKFLOW_ID', message: 'workflowId is required.' },
    });
    return;
  }

  try {
    const result = await evaluateOutcome({
      workflowId,
      parsedRequest,
      providerCandidates,
      rankedProviders,
      selectedProvider,
      priceEstimate,
      bookingResult,
      completedSteps,
      totalLatencyMs,
    });

    safeLog.apiCall('POST', '/evaluateOutcome', 200, Date.now() - startTime);
    res.json({ success: true, ...result });
  } catch (err: any) {
    safeLog.error('evaluateOutcome', err);
    res.status(500).json({ success: false, error: { code: 'EVALUATION_ERROR', message: err.message || 'Evaluation failed.' } });
  }
}
