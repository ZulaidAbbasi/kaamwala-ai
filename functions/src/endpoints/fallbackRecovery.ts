// functions/src/endpoints/fallbackRecovery.ts
// Fallback and recovery endpoints — all scenarios in one file
// Each handler logs traces and returns structured RecoveryResult

import { Request, Response } from 'express';
import {
  handleProviderCancellation,
  handleNoProviderFound,
  handleLowConfidenceRequest,
  handleApiFailure,
  handlePriceDispute,
  handleMissingLocation,
} from '../services/fallbackService';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';

// ============================================================================
// Helper: wrap any scenario with traces
// ============================================================================

async function withTraces(
  workflowId: string,
  agentName: string,
  scenarioLabel: string,
  runScenario: () => Promise<any>,
  startTime: number,
): Promise<{ result: any; traces: TraceSummary[] }> {
  const traces: TraceSummary[] = [];

  // observation
  const t1 = await logTrace({
    workflowId, agentName,
    phase: 'observation',
    observation: `${scenarioLabel} detected.`,
    reasoningSummary: 'Evaluating recovery options.',
    decision: 'Proceed with recovery.',
    actionTaken: 'fallback_detected',
    toolUsed: 'none',
    confidence: 1.0,
    latencyMs: 0,
  });
  traces.push(t1);

  const result = await runScenario();

  // action
  const t2 = await logTrace({
    workflowId, agentName,
    phase: 'action',
    observation: result.issueDetected,
    reasoningSummary: result.reasoning,
    decision: result.selectedRecovery,
    actionTaken: 'recovery_executed',
    toolUsed: 'firestore',
    toolResultSummary: `Recovery: ${result.selectedRecovery}. Saved: ${result.firestoreSaved}.`,
    confidence: 0.85,
    latencyMs: Date.now() - startTime,
    stateBefore: result.stateBefore,
    stateAfter: result.stateAfter,
  });
  traces.push(t2);

  // evaluation
  const t3 = await logTrace({
    workflowId, agentName,
    phase: 'evaluation',
    observation: `Recovery complete. Options considered: ${result.recoveryOptions.length}.`,
    reasoningSummary: `Selected: "${result.selectedRecovery}". ${result.warnings.length} warning(s).`,
    decision: result.firestoreSaved ? 'Recovery saved to Firestore.' : 'Recovery may not be persisted.',
    actionTaken: 'recovery_evaluated',
    toolUsed: 'none',
    confidence: result.firestoreSaved ? 0.95 : 0.5,
    latencyMs: Date.now() - startTime,
  });
  traces.push(t3);

  return { result, traces };
}

// ============================================================================
// POST /simulateProviderCancellation
// ============================================================================

export async function handleSimulateProviderCancellation(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, bookingId } = req.body;

  if (!workflowId || !bookingId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'workflowId and bookingId required.' } });
    return;
  }

  try {
    const { result, traces } = await withTraces(
      workflowId, 'Recovery_Agent', 'Provider cancellation',
      () => handleProviderCancellation({ workflowId, bookingId }),
      startTime,
    );

    safeLog.apiCall('POST', '/simulateProviderCancellation', 200, Date.now() - startTime);
    res.json({ success: true, workflowId, recovery: result, traces, latencyMs: Date.now() - startTime });
  } catch (err: any) {
    safeLog.error('simulateProviderCancellation', err);
    res.status(500).json({ success: false, error: { code: 'RECOVERY_ERROR', message: err.message || 'Recovery failed.' } });
  }
}

// ============================================================================
// POST /handleNoProviderFound
// ============================================================================

export async function handleNoProviderFoundEndpoint(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, serviceType, locationArea } = req.body;

  if (!workflowId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'workflowId required.' } });
    return;
  }

  try {
    const { result, traces } = await withTraces(
      workflowId, 'Recovery_Agent', 'No provider found',
      () => handleNoProviderFound({ workflowId, serviceType: serviceType || 'Unknown', locationArea: locationArea || 'Unknown' }),
      startTime,
    );

    safeLog.apiCall('POST', '/handleNoProviderFound', 200, Date.now() - startTime);
    res.json({ success: true, workflowId, recovery: result, traces, latencyMs: Date.now() - startTime });
  } catch (err: any) {
    safeLog.error('handleNoProviderFound', err);
    res.status(500).json({ success: false, error: { code: 'RECOVERY_ERROR', message: err.message || 'Recovery failed.' } });
  }
}

// ============================================================================
// POST /handleLowConfidenceRequest
// ============================================================================

export async function handleLowConfidenceEndpoint(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, rawText, confidence } = req.body;

  if (!workflowId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'workflowId required.' } });
    return;
  }

  try {
    const { result, traces } = await withTraces(
      workflowId, 'Recovery_Agent', 'Low confidence request',
      () => handleLowConfidenceRequest({ workflowId, rawText: rawText || '', confidence: confidence ?? 0.3 }),
      startTime,
    );

    safeLog.apiCall('POST', '/handleLowConfidenceRequest', 200, Date.now() - startTime);
    res.json({ success: true, workflowId, recovery: result, traces, latencyMs: Date.now() - startTime });
  } catch (err: any) {
    safeLog.error('handleLowConfidenceRequest', err);
    res.status(500).json({ success: false, error: { code: 'RECOVERY_ERROR', message: err.message || 'Recovery failed.' } });
  }
}

// ============================================================================
// POST /resolveDispute (unified fallback runner)
// ============================================================================

export async function handleResolveDispute(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, scenario, bookingId, rawText, confidence, failedApi, customerClaim } = req.body;

  if (!workflowId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'workflowId required.' } });
    return;
  }

  let runFn: () => Promise<any>;
  let label: string;

  switch (scenario) {
    case 'provider_cancellation':
      label = 'Provider cancellation';
      runFn = () => handleProviderCancellation({ workflowId, bookingId: bookingId || `book_demo_${Date.now()}` });
      break;
    case 'no_provider_found':
      label = 'No provider found';
      runFn = () => handleNoProviderFound({ workflowId, serviceType: 'AC Repair', locationArea: 'G-13 Islamabad' });
      break;
    case 'low_confidence':
      label = 'Low confidence request';
      runFn = () => handleLowConfidenceRequest({ workflowId, rawText: rawText || 'kuch kaam', confidence: confidence ?? 0.25 });
      break;
    case 'api_failure':
      label = `API failure: ${failedApi || 'google_places'}`;
      runFn = () => handleApiFailure({ workflowId, failedApi: failedApi || 'google_places' });
      break;
    case 'price_dispute':
      label = 'Price dispute';
      runFn = () => handlePriceDispute({ workflowId, bookingId: bookingId || 'N/A', customerClaim: customerClaim || 'Price seems too high' });
      break;
    case 'missing_location':
      label = 'Missing location';
      runFn = () => handleMissingLocation({ workflowId, rawText: rawText || 'AC ki repair karwani hai' });
      break;
    default:
      label = 'Unknown scenario';
      runFn = () => handleApiFailure({ workflowId, failedApi: 'unknown' });
  }

  try {
    const { result, traces } = await withTraces(workflowId, 'Recovery_Agent', label, runFn, startTime);

    safeLog.apiCall('POST', '/resolveDispute', 200, Date.now() - startTime);
    res.json({ success: true, workflowId, recovery: result, traces, latencyMs: Date.now() - startTime });
  } catch (err: any) {
    safeLog.error('resolveDispute', err);
    res.status(500).json({ success: false, error: { code: 'DISPUTE_ERROR', message: err.message || 'Dispute resolution failed.' } });
  }
}
