// functions/src/endpoints/runWorkflow.ts
// POST /runWorkflow — Runs the full agentic workflow in one call
// Chains: parse → discover → rank → price → book (never crashes)

import { Request, Response } from 'express';
import { runWorkflow } from '../agents/serviceOrchestrator';
import { safeLog } from '../utils/safeLogger';

/**
 * POST /runWorkflow
 *
 * Input:  { rawText: string, customerUid?: string, mode?: "full" | "step_by_step" }
 * Output: Full OrchestratorResult with all step outputs + traces
 */
export async function handleRunWorkflow(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { rawText, customerUid, mode } = req.body;

  // Validate
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 3) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'rawText is required (min 3 characters).' },
    });
    return;
  }

  if (rawText.trim().length > 2000) {
    res.status(400).json({
      success: false,
      error: { code: 'INPUT_TOO_LONG', message: 'rawText must be under 2000 characters.' },
    });
    return;
  }

  try {
    // Run orchestrator
    const result = await runWorkflow({
      rawText: rawText.trim(),
      customerUid,
      mode: mode || 'full',
    });

    const totalLatency = Date.now() - startTime;
    safeLog.apiCall('POST', '/runWorkflow', result.success ? 200 : 207, totalLatency);

    res.json(result);
  } catch (err: any) {
    safeLog.error('runWorkflow', err);
    res.status(500).json({ success: false, error: { code: 'WORKFLOW_ERROR', message: err.message || 'Workflow failed.' }, warnings: ['Fatal error in orchestrator pipeline.'] });
  }
}
