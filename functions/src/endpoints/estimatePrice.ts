// functions/src/endpoints/estimatePrice.ts
// POST /estimatePrice — Transparent price estimation
// Generates estimates with documented assumptions — never a final quote

import { Request, Response } from 'express';
import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { estimatePrice } from '../services/pricingService';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';


/**
 * POST /estimatePrice
 */
export async function handleEstimatePrice(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, parsedRequest, selectedProvider } = req.body;

  // ── 1. Validate ───────────────────────────────────────────────────
  if (!workflowId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_WORKFLOW_ID', message: 'workflowId is required.' } });
    return;
  }
  if (!parsedRequest?.serviceType) {
    res.status(400).json({ success: false, error: { code: 'MISSING_REQUEST', message: 'parsedRequest with serviceType is required.' } });
    return;
  }
  if (!selectedProvider?.name) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PROVIDER', message: 'selectedProvider with name is required.' } });
    return;
  }

  const traces: TraceSummary[] = [];
  const warnings: string[] = [];

  // ── 2. Log trace: observation ─────────────────────────────────────
  const observeTrace = await logTrace({
    workflowId,
    agentName: 'Pricing_Agent',
    phase: 'observation',
    observation: `Estimating price for "${parsedRequest.serviceType}" with provider "${selectedProvider.name}".`,
    reasoningSummary: `Urgency: ${parsedRequest.urgency}. Budget: ${parsedRequest.budgetSensitivity}. Registered: ${selectedProvider.bookingEligible ?? selectedProvider.isRegistered ?? false}.`,
    decision: 'Calculate transparent estimate with assumptions.',
    actionTaken: 'pricing_started',
    toolUsed: 'none',
    confidence: 1.0,
    latencyMs: 0,
  });
  traces.push(observeTrace);

  // ── 3. Run pricing engine ─────────────────────────────────────────
  const estimate = estimatePrice({
    serviceType: parsedRequest.serviceType,
    issueDescription: parsedRequest.issueDescription,
    urgency: parsedRequest.urgency || 'unspecified',
    budgetSensitivity: parsedRequest.budgetSensitivity || 'unspecified',
    preferredTimeWindow: parsedRequest.preferredTimeWindow,
    distanceKm: selectedProvider.distanceEstimateKm ?? selectedProvider.factors?.find((f: any) => f.factor === 'Distance Proximity')?.rawValue ?? null,
    isRegistered: selectedProvider.bookingEligible ?? selectedProvider.isRegistered ?? false,
    providerBaseVisitFee: selectedProvider.rawDataSummary?.baseVisitFee ?? null,
    providerRating: selectedProvider.rating ?? selectedProvider.factors?.find((f: any) => f.factor === 'Rating')?.rawValue ?? null,
    providerName: selectedProvider.name,
  });

  // ── 4. Log trace: reasoning + result ──────────────────────────────
  const reasonTrace = await logTrace({
    workflowId,
    agentName: 'Pricing_Agent',
    phase: 'reasoning',
    observation: `Generated estimate: PKR ${estimate.estimateLow} – ${estimate.estimateHigh}.`,
    reasoningSummary: `Recommended: PKR ${estimate.recommendedEstimate}. Confidence: ${(estimate.confidence * 100).toFixed(0)}%. Breakdown: ${estimate.breakdown.length} items. Assumptions: ${estimate.assumptions.length}. Unknowns: ${estimate.unknowns.length}.`,
    decision: `Estimate range PKR ${estimate.estimateLow}–${estimate.estimateHigh} with ${estimate.assumptions.length} assumptions.`,
    actionTaken: 'estimate_complete',
    toolUsed: 'pricing_engine',
    toolResultSummary: estimate.userMessage,
    confidence: estimate.confidence,
    latencyMs: Date.now() - startTime,
    stateBefore: { status: 'ranked' },
    stateAfter: { status: 'priced', estimateLow: estimate.estimateLow, estimateHigh: estimate.estimateHigh },
  });
  traces.push(reasonTrace);

  // ── 5. Save to Firestore ──────────────────────────────────────────
  try {
    await db.collection('price_estimates').doc(`price_${workflowId}`).set({
      workflowId,
      providerName: selectedProvider.name,
      isRegistered: selectedProvider.bookingEligible ?? selectedProvider.isRegistered ?? false,
      estimateLow: estimate.estimateLow,
      estimateHigh: estimate.estimateHigh,
      recommendedEstimate: estimate.recommendedEstimate,
      currency: estimate.currency,
      breakdownCount: estimate.breakdown.length,
      confidence: estimate.confidence,
      isEstimateOnly: true,
      createdAt: Timestamp.now(),
    });
  } catch (err: any) {
    safeLog.error('EstimatePrice', 'Failed to save estimate', err);
    warnings.push('Price estimate may not have been saved.');
  }

  // ── 6. Return ─────────────────────────────────────────────────────
  const totalLatency = Date.now() - startTime;
  safeLog.apiCall('POST', '/estimatePrice', 200, totalLatency);

  res.json({
    success: true,
    workflowId,
    estimate,
    providerName: selectedProvider.name,
    isRegistered: selectedProvider.bookingEligible ?? selectedProvider.isRegistered ?? false,
    traces,
    warnings,
    latencyMs: totalLatency,
  });
}
