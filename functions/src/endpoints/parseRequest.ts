// functions/src/endpoints/parseRequest.ts
// POST /parseRequest — Multilingual NLU endpoint
// Parses user input via Gemini, saves to Firestore, logs agent traces

import { Request, Response } from 'express';
import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { parseServiceRequest } from '../services/gemini/geminiClient';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';
import { matchServiceFromText, isVagueServiceType } from '../services/serviceTaxonomy';


/**
 * POST /parseRequest
 *
 * Input:  { rawText: string, userId?: string, workflowId?: string }
 * Output: { success, workflowId, parsedRequest, traces, warnings }
 */
export async function handleParseRequest(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { rawText, userId, workflowId: providedWorkflowId } = req.body;

  // ── 1. Validate input ─────────────────────────────────────────────
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'EMPTY_REQUEST', message: 'rawText is required and must not be empty.' },
    });
    return;
  }

  const cleaned = rawText.trim();
  if (cleaned.length < 3) {
    res.status(400).json({
      success: false,
      error: { code: 'INPUT_TOO_SHORT', message: 'Request must be at least 3 characters.' },
    });
    return;
  }

  if (cleaned.length > 2000) {
    res.status(400).json({
      success: false,
      error: { code: 'INPUT_TOO_LONG', message: 'Request must be under 2000 characters.' },
    });
    return;
  }

  const workflowId = providedWorkflowId || `wf_${uuid().substring(0, 12)}`;
  const traces: TraceSummary[] = [];
  const warnings: string[] = [];

  safeLog.info('ParseRequest', `Processing workflow ${workflowId}, input length: ${cleaned.length}`);

  // ── 2. Log trace: observation ─────────────────────────────────────
  const observeTrace = await logTrace({
    workflowId,
    userId: userId || '',
    agentName: 'NLU_Agent',
    phase: 'observation',
    observation: `Received ${cleaned.length}-character input from user.`,
    reasoningSummary: 'Preparing to parse multilingual service request using Gemini NLU.',
    decision: 'Proceed with Gemini API call for intent extraction.',
    actionTaken: 'observation_logged',
    toolUsed: 'none',
    confidence: 1.0,
    inputSummary: { inputLength: cleaned.length, hasUrdu: /[\u0600-\u06FF]/.test(cleaned) },
    latencyMs: 0,
  });
  traces.push(observeTrace);

  // ── 3. Call Gemini parseServiceRequest ─────────────────────────────
  const geminiResult = await parseServiceRequest(cleaned);

  // ── 3b. Post-parse validation ───────────────────────────────────────
  // ARCHITECTURE: Gemini is the PRIMARY brain. Taxonomy is ONLY a fallback
  // when Gemini returns vague/empty service types.
  // NEVER override Gemini's specific result with taxonomy keywords.
  const originalServiceType = geminiResult.parsed.serviceType;

  if (geminiResult.source === 'gemini' && !isVagueServiceType(originalServiceType)) {
    // ✅ Gemini returned a specific service type — TRUST IT
    safeLog.info('ParseRequest', `Gemini identified: "${originalServiceType}" (confidence: ${geminiResult.parsed.confidenceScore}). Trusting Gemini.`);
  } else if (isVagueServiceType(originalServiceType)) {
    // ⚠ Gemini returned vague (e.g., "Other", "General Service") — try taxonomy as fallback
    const taxonomyMatch = matchServiceFromText(cleaned);
    if (taxonomyMatch) {
      geminiResult.parsed.serviceType = taxonomyMatch;
      warnings.push(`AI returned "${originalServiceType}" — corrected to "${taxonomyMatch}" via keyword fallback.`);
      safeLog.info('ParseRequest', `Vague override: "${originalServiceType}" → "${taxonomyMatch}" (taxonomy fallback)`);
    } else {
      safeLog.warn('ParseRequest', `Vague service type "${originalServiceType}" and no taxonomy match.`);
    }
  } else {
    // Fallback source — taxonomy parsed it, keep as-is
    safeLog.info('ParseRequest', `Fallback parser identified: "${originalServiceType}"`);
  }

  // ── 4. Log trace: understanding ───────────────────────────────────
  const understandTrace = await logTrace({
    workflowId,
    userId: userId || '',
    agentName: 'NLU_Agent',
    phase: 'understanding',
    observation: `Gemini returned parsed result (source: ${geminiResult.source}).${originalServiceType !== geminiResult.parsed.serviceType ? ` Corrected: "${originalServiceType}" → "${geminiResult.parsed.serviceType}".` : ''}`,
    reasoningSummary: geminiResult.parsed.normalizedEnglishSummary,
    decision: `Extracted: ${geminiResult.parsed.serviceType} in ${geminiResult.parsed.locationText || 'unknown location'}, urgency=${geminiResult.parsed.urgency}, budget=${geminiResult.parsed.budgetSensitivity}`,
    actionTaken: 'parse_complete',
    toolUsed: geminiResult.source === 'gemini' ? 'gemini_api' : 'keyword_fallback',
    toolResultSummary: `Service: ${geminiResult.parsed.serviceType}, Location: ${geminiResult.parsed.locationText}, Language: ${geminiResult.parsed.languageDetected}, Confidence: ${geminiResult.parsed.confidenceScore}`,
    confidence: geminiResult.parsed.confidenceScore,
    latencyMs: geminiResult.latencyMs,
    estimatedCost: geminiResult.source === 'gemini' ? '~0.001 USD' : 'N/A',
    warnings: geminiResult.parsed.missingFields.length > 0
      ? [`Missing fields: ${geminiResult.parsed.missingFields.join(', ')}`]
      : [],
    stateBefore: { status: 'raw_input' },
    stateAfter: { status: 'parsed', serviceType: geminiResult.parsed.serviceType },
  });
  traces.push(understandTrace);

  // ── 5. Source tracking ────────────────────────────────────────────
  if (geminiResult.source === 'fallback') {
    warnings.push('Gemini API was unavailable. Used keyword-based fallback parser.');
  }

  if (geminiResult.parsed.missingFields.length > 0) {
    warnings.push(`Could not extract: ${geminiResult.parsed.missingFields.join(', ')}`);
  }

  if (geminiResult.parsed.confidenceScore < 0.5) {
    warnings.push('Low confidence in parsing. Clarification may be needed.');
  }

  // ── 6. Save to Firestore ──────────────────────────────────────────
  const requestId = `req_${uuid().substring(0, 8)}`;
  const serviceRequestDoc = {
    requestId,
    workflowId,
    customerUid: userId || '',
    rawText: cleaned,
    normalizedSummary: geminiResult.parsed.normalizedEnglishSummary,
    serviceType: geminiResult.parsed.serviceType,
    serviceCategory: geminiResult.parsed.serviceType.toLowerCase().replace(/\s+/g, '_'),
    issueDescription: geminiResult.parsed.issueDescription,
    locationArea: geminiResult.parsed.locationText,
    locationCity: 'Islamabad', // Default for MVP
    preferredDate: geminiResult.parsed.preferredDate || '',
    preferredTimeWindow: geminiResult.parsed.preferredTimeWindow || '',
    urgency: geminiResult.parsed.urgency,
    budgetSensitivity: geminiResult.parsed.budgetSensitivity,
    languageDetected: geminiResult.parsed.languageDetected,
    confidenceScore: geminiResult.parsed.confidenceScore,
    missingFields: geminiResult.parsed.missingFields,
    status: 'parsed',
    source: geminiResult.source,
    createdAt: Timestamp.now(),
  };

  try {
    await db.collection('service_requests').doc(requestId).set(serviceRequestDoc);
    safeLog.info('ParseRequest', `Saved service_request ${requestId} for workflow ${workflowId}`);
  } catch (err: any) {
    safeLog.error('ParseRequest', 'Failed to save service_request to Firestore', err);
    warnings.push('Service request saved with warnings — Firestore write may have failed.');
  }

  // ── 7. Log trace: result ──────────────────────────────────────────
  const resultTrace = await logTrace({
    workflowId,
    userId: userId || '',
    agentName: 'NLU_Agent',
    phase: 'result',
    observation: `Service request saved to Firestore as ${requestId}.`,
    reasoningSummary: `Workflow ${workflowId} is ready for provider discovery.`,
    decision: geminiResult.parsed.confidenceScore < 0.5
      ? 'Low confidence — recommend clarification before proceeding.'
      : 'Confidence adequate — ready for provider discovery.',
    actionTaken: 'firestore_write_complete',
    toolUsed: 'firestore_admin_sdk',
    toolResultSummary: `Document: service_requests/${requestId}`,
    confidence: geminiResult.parsed.confidenceScore,
    latencyMs: Date.now() - startTime,
    stateBefore: { status: 'parsed' },
    stateAfter: { status: 'saved', requestId },
  });
  traces.push(resultTrace);

  // ── 8. Return response ────────────────────────────────────────────
  const totalLatency = Date.now() - startTime;
  safeLog.apiCall('POST', '/parseRequest', 200, totalLatency);

  res.json({
    success: true,
    workflowId,
    requestId,
    parsedRequest: {
      serviceType: geminiResult.parsed.serviceType,
      issueDescription: geminiResult.parsed.issueDescription,
      locationText: geminiResult.parsed.locationText,
      preferredDate: geminiResult.parsed.preferredDate,
      preferredTimeWindow: geminiResult.parsed.preferredTimeWindow,
      urgency: geminiResult.parsed.urgency,
      budgetSensitivity: geminiResult.parsed.budgetSensitivity,
      qualityPreference: geminiResult.parsed.qualityPreference,
      constraints: geminiResult.parsed.constraints,
      languageDetected: geminiResult.parsed.languageDetected,
      confidenceScore: geminiResult.parsed.confidenceScore,
      missingFields: geminiResult.parsed.missingFields,
      clarificationQuestion: geminiResult.parsed.clarificationQuestion,
      normalizedEnglishSummary: geminiResult.parsed.normalizedEnglishSummary,
    },
    source: geminiResult.source,
    traces,
    warnings,
    latencyMs: totalLatency,
    ...(geminiResult.rawGeminiResponse?.startsWith('GEMINI_FAILED') ? { geminiErrorDetails: geminiResult.rawGeminiResponse } : {}),
  });
}
