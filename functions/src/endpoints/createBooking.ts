// functions/src/endpoints/createBooking.ts
// POST /createBooking — Create a real Firestore booking record
// Registered providers → pending_provider_confirmation
// Google Places only → onboarding_required

import { Request, Response } from 'express';
import { createBooking } from '../services/bookingService';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';

/**
 * POST /createBooking
 */
export async function handleCreateBooking(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, customerUid, selectedProvider, parsedRequest, priceEstimate, requestedSlot } = req.body;

  // ── 1. Validate ───────────────────────────────────────────────────
  if (!workflowId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_WORKFLOW_ID', message: 'workflowId is required.' } });
    return;
  }
  if (!selectedProvider?.name) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PROVIDER', message: 'selectedProvider with name is required.' } });
    return;
  }
  if (!parsedRequest?.serviceType) {
    res.status(400).json({ success: false, error: { code: 'MISSING_REQUEST', message: 'parsedRequest with serviceType is required.' } });
    return;
  }

  const traces: TraceSummary[] = [];

  try {
  const isRegistered = selectedProvider.bookingEligible ?? selectedProvider.isRegistered ?? false;

  // ── 2. Log trace: observation ─────────────────────────────────────
  const observeTrace = await logTrace({
    workflowId,
    agentName: 'Booking_Agent',
    phase: 'observation',
    observation: `Booking requested for "${selectedProvider.name}". Registered: ${isRegistered}. Service: ${parsedRequest.serviceType}.`,
    reasoningSummary: isRegistered
      ? 'Provider is registered — will create confirmed booking.'
      : 'Provider is NOT registered — will return onboarding_required status.',
    decision: isRegistered ? 'Proceed with booking creation.' : 'Log discovery booking, do not confirm.',
    actionTaken: 'booking_evaluation',
    toolUsed: 'none',
    confidence: isRegistered ? 0.95 : 0.3,
    latencyMs: 0,
  });
  traces.push(observeTrace);

  // ── 3. Create booking ─────────────────────────────────────────────
  const result = await createBooking({
    workflowId,
    customerUid: customerUid || 'anonymous',
    selectedProvider,
    parsedRequest,
    priceEstimate,
    requestedSlot,
  });

  // ── 4. Log trace: action ──────────────────────────────────────────
  const actionTrace = await logTrace({
    workflowId,
    agentName: 'Booking_Agent',
    phase: 'action',
    observation: `Booking ${result.bookingId} created with status: ${result.status}.`,
    reasoningSummary: result.bookingNote,
    decision: `Status: ${result.statusLabel}. Firestore saved: ${result.firestoreSaved}.`,
    actionTaken: 'booking_created',
    toolUsed: 'firestore',
    toolResultSummary: `Booking ID: ${result.bookingId}. Provider: ${result.providerName}. Estimate: ${result.currency} ${result.recommendedEstimate}.`,
    confidence: isRegistered ? 0.95 : 0.3,
    latencyMs: Date.now() - startTime,
    stateBefore: { status: 'priced' },
    stateAfter: { status: result.status, bookingId: result.bookingId, firestoreSaved: result.firestoreSaved },
  });
  traces.push(actionTrace);

  // ── 5. Log trace: result (message previews) ───────────────────────
  const resultTrace = await logTrace({
    workflowId,
    agentName: 'Booking_Agent',
    phase: 'result',
    observation: 'Message previews generated for customer and provider.',
    reasoningSummary: 'Notifications are preview-only — not sent to real contacts.',
    decision: 'Save previews to notification_previews collection.',
    actionTaken: 'notification_preview_saved',
    toolUsed: 'firestore',
    toolResultSummary: `Customer preview: ${result.customerMessagePreview.substring(0, 100)}...`,
    confidence: 1.0,
    latencyMs: Date.now() - startTime,
  });
  traces.push(resultTrace);

  // ── 6. Return ─────────────────────────────────────────────────────
  const totalLatency = Date.now() - startTime;
  safeLog.apiCall('POST', '/createBooking', 200, totalLatency);

  res.json({
    success: true,
    workflowId,
    booking: result,
    traces,
    latencyMs: totalLatency,
  });

  } catch (err: any) {
    safeLog.error('createBooking', err);
    res.status(500).json({ success: false, error: { code: 'BOOKING_ERROR', message: err.message || 'Booking failed.' } });
  }
}
