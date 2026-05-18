// functions/src/endpoints/rankProviders.ts
// POST /rankProviders — Multi-factor provider ranking with trace logging
// Uses deterministic scoring + optional Gemini explanation

import { Request, Response } from 'express';
import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { rankProviders } from '../services/rankingService';
import { explainRankingDecision } from '../services/gemini/geminiClient';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';
import { TraceSummary } from '../types/agentTrace';
import { ProviderCandidate } from '../types/provider';


/**
 * POST /rankProviders
 */
export async function handleRankProviders(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const { workflowId, parsedRequest, providerCandidates } = req.body;

  // ── 1. Validate ───────────────────────────────────────────────────
  if (!workflowId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_WORKFLOW_ID', message: 'workflowId is required.' } });
    return;
  }
  if (!parsedRequest?.serviceType) {
    res.status(400).json({ success: false, error: { code: 'MISSING_REQUEST', message: 'parsedRequest with serviceType is required.' } });
    return;
  }
  if (!Array.isArray(providerCandidates) || providerCandidates.length === 0) {
    res.status(400).json({ success: false, error: { code: 'NO_CANDIDATES', message: 'providerCandidates array is required.' } });
    return;
  }

  const traces: TraceSummary[] = [];
  const warnings: string[] = [];

  // ── 2. Log trace: observation ─────────────────────────────────────
  const observeTrace = await logTrace({
    workflowId,
    agentName: 'Ranking_Agent',
    phase: 'observation',
    observation: `Received ${providerCandidates.length} candidates for ranking.`,
    reasoningSummary: `Service: ${parsedRequest.serviceType}. Budget: ${parsedRequest.budgetSensitivity}. Urgency: ${parsedRequest.urgency}.`,
    decision: 'Proceed with 12-factor deterministic ranking.',
    actionTaken: 'ranking_started',
    toolUsed: 'none',
    confidence: 1.0,
    latencyMs: 0,
  });
  traces.push(observeTrace);

  // ── 3. Run deterministic ranking ──────────────────────────────────
  const rankingResult = rankProviders(providerCandidates as ProviderCandidate[], {
    serviceType: parsedRequest.serviceType,
    urgency: parsedRequest.urgency || 'unspecified',
    budgetSensitivity: parsedRequest.budgetSensitivity || 'unspecified',
    locationText: parsedRequest.locationText || '',
    preferredTimeWindow: parsedRequest.preferredTimeWindow,
  });

  // ── 4. Log trace: reasoning ───────────────────────────────────────
  const topPick = rankingResult.selectedProvider;
  const reasonTrace = await logTrace({
    workflowId,
    agentName: 'Ranking_Agent',
    phase: 'reasoning',
    observation: `Scored ${rankingResult.rankedProviders.length} candidates across 12 factors.`,
    reasoningSummary: topPick
      ? `Top: ${topPick.name} (${topPick.totalScore.toFixed(3)}). Booking eligible: ${topPick.bookingEligible}. Strengths: ${topPick.strengths.slice(0, 3).join(', ')}.`
      : 'No candidates scored.',
    decision: topPick
      ? `Selected "${topPick.name}" with score ${topPick.totalScore.toFixed(3)}.`
      : 'No suitable provider found.',
    actionTaken: 'scoring_complete',
    toolUsed: 'deterministic_ranking_engine',
    toolResultSummary: `Ranked: ${rankingResult.rankedProviders.length}. Bookable: ${rankingResult.rankedProviders.filter(r => r.bookingEligible).length}. Baseline: ${rankingResult.baseline.selectedName}.`,
    confidence: topPick ? topPick.totalScore : 0,
    latencyMs: Date.now() - startTime,
  });
  traces.push(reasonTrace);

  // ── 5. Optional Gemini explanation ────────────────────────────────
  let geminiExplanation: string | null = null;
  if (topPick && rankingResult.rankedProviders.length >= 2) {
    try {
      const geminiResult = await explainRankingDecision({
        serviceRequest: {
          serviceType: parsedRequest.serviceType,
          urgency: parsedRequest.urgency || 'unspecified',
          budget: parsedRequest.budgetSensitivity || 'unspecified',
          location: parsedRequest.locationText || 'Islamabad',
        },
        candidates: rankingResult.rankedProviders.slice(0, 5).map((r) => ({
          candidateId: r.candidateId,
          name: r.name,
          rating: r.factors.find(f => f.factor === 'Rating')?.rawValue as number || 0,
          distance: r.factors.find(f => f.factor === 'Distance Proximity')?.rawValue as string || 'unknown',
          isRegistered: r.bookingEligible,
        })),
      });

      if (geminiResult.source === 'gemini') {
        geminiExplanation = geminiResult.ranking.overallReasoning;
      }
    } catch {
      warnings.push('Gemini explanation unavailable — using deterministic explanation only.');
    }
  }

  // ── 6. Log trace: decision ────────────────────────────────────────
  const decisionTrace = await logTrace({
    workflowId,
    agentName: 'Ranking_Agent',
    phase: 'decision',
    observation: `Final ranking complete. ${rankingResult.rankedProviders.filter(r => r.bookingEligible).length} bookable provider(s).`,
    reasoningSummary: rankingResult.agenticAdvantage,
    decision: topPick
      ? `Recommend: "${topPick.name}" (${topPick.bookingStatus}).`
      : 'No recommendation possible.',
    actionTaken: 'ranking_decision_final',
    toolUsed: geminiExplanation ? 'ranking_engine + gemini_explanation' : 'ranking_engine',
    toolResultSummary: topPick?.whySelected || 'No selection.',
    confidence: topPick ? topPick.totalScore : 0,
    latencyMs: Date.now() - startTime,
    stateBefore: { status: 'discovered', candidateCount: providerCandidates.length },
    stateAfter: { status: 'ranked', topProvider: topPick?.name, bookable: topPick?.bookingEligible },
  });
  traces.push(decisionTrace);

  // ── 7. Save to Firestore ──────────────────────────────────────────
  try {
    await db.collection('ranking_decisions').doc(`rank_${workflowId}`).set({
      workflowId,
      rankedCount: rankingResult.rankedProviders.length,
      topProvider: topPick ? { candidateId: topPick.candidateId, name: topPick.name, score: topPick.totalScore, bookable: topPick.bookingEligible } : null,
      baseline: rankingResult.baseline,
      factorWeights: rankingResult.factorWeights,
      createdAt: Timestamp.now(),
    });
  } catch (err: any) {
    safeLog.error('RankProviders', 'Failed to save ranking decision', err);
    warnings.push('Ranking decision may not have been saved.');
  }

  // ── 8. Return response ────────────────────────────────────────────
  const totalLatency = Date.now() - startTime;
  safeLog.apiCall('POST', '/rankProviders', 200, totalLatency);

  // Merge original ProviderCandidate data into the selectedProvider
  // so the UI has access to rating, address, distance, isRegistered, etc.
  let enrichedSelectedProvider: any = topPick;
  if (topPick) {
    const originalCandidate = providerCandidates.find(
      (c: any) => c.candidateId === topPick.candidateId
    );
    if (originalCandidate) {
      enrichedSelectedProvider = {
        ...originalCandidate,  // Original: rating, address, distance, isRegistered, openNow, rawDataSummary, etc.
        ...topPick,            // Ranking: totalScore, factors, strengths, weaknesses, rank, etc.
        // Ensure original data takes priority for display fields that ranking doesn't override
        name: topPick.name || originalCandidate.name,
        isRegistered: originalCandidate.isRegistered,
        bookable: originalCandidate.bookable,
      };
    }
  }

  res.json({
    success: true,
    workflowId,
    rankedProviders: rankingResult.rankedProviders,
    selectedProvider: enrichedSelectedProvider,
    baseline: rankingResult.baseline,
    agenticAdvantage: rankingResult.agenticAdvantage,
    geminiExplanation,
    factorWeights: rankingResult.factorWeights,
    traces,
    warnings,
    latencyMs: totalLatency,
  });
}
