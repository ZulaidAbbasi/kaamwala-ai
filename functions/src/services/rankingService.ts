// functions/src/services/rankingService.ts
// Deterministic multi-factor provider ranking engine
// Gemini explains decisions — never invents facts
// Scoring is transparent: every factor has a weight and raw value

import { ProviderCandidate } from '../types/provider';
import { safeLog } from '../utils/safeLogger';

// ============================================================================
// Factor Weights (must sum to 1.0)
// ============================================================================

const WEIGHTS = {
  serviceRelevance:     0.12,
  distanceProximity:    0.14,
  ratingScore:          0.10,
  reviewStrength:       0.06,
  openStatus:           0.05,
  registeredBonus:      0.15,
  verifiedActive:       0.08,
  availabilityFit:      0.06,
  priceFit:             0.08,
  urgencyFit:           0.04,
  dataCompleteness:     0.07,
  missingPenalty:        0.05,
} as const;

// Verify sum = 1.0
const WEIGHT_SUM = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

export interface ScoredFactor {
  factor: string;
  weight: number;
  rawValue: number | string | boolean | null;
  normalizedScore: number; // 0.0 – 1.0
  weightedScore: number;
  explanation: string;
}

export interface RankedCandidate {
  candidateId: string;
  rank: number;
  name: string;
  totalScore: number;
  factors: ScoredFactor[];
  strengths: string[];
  weaknesses: string[];
  riskFlags: string[];
  bookingEligible: boolean;
  bookingStatus: string;
  whySelected: string;
}

export interface RankingResult {
  rankedProviders: RankedCandidate[];
  selectedProvider: RankedCandidate | null;
  baseline: {
    method: string;
    selectedName: string;
    selectedId: string;
    reasoning: string;
  };
  agenticAdvantage: string;
  factorWeights: Record<string, number>;
}

// ============================================================================
// Main Ranking Function
// ============================================================================

/**
 * Rank provider candidates using deterministic multi-factor scoring.
 * Every factor has a weight, raw value, normalized score, and explanation.
 * Gemini is NOT used here — scoring is fully transparent and reproducible.
 */
export function rankProviders(
  candidates: ProviderCandidate[],
  request: {
    serviceType: string;
    urgency: string;
    budgetSensitivity: string;
    locationText: string;
    preferredTimeWindow?: string;
  }
): RankingResult {
  if (candidates.length === 0) {
    return {
      rankedProviders: [],
      selectedProvider: null,
      baseline: {
        method: 'nearest_distance',
        selectedName: 'None',
        selectedId: '',
        reasoning: 'No candidates available.',
      },
      agenticAdvantage: 'No candidates to compare.',
      factorWeights: WEIGHTS,
    };
  }

  // Score each candidate
  const scored = candidates.map((c) => scoreCandidate(c, request, candidates));

  // Sort by total score descending
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  scored.forEach((s, i) => { s.rank = i + 1; });

  // Generate "why selected" for top pick
  if (scored.length > 0) {
    scored[0].whySelected = generateWhySelected(scored[0], scored.length);
  }

  // Baseline: nearest-distance-only selection
  const baseline = computeBaseline(candidates);

  // Agentic advantage explanation
  const agenticAdvantage = computeAgenticAdvantage(scored[0], baseline, scored.length);

  safeLog.info('RankingService', `Ranked ${scored.length} candidates. Top: ${scored[0]?.name} (${scored[0]?.totalScore.toFixed(3)})`);

  return {
    rankedProviders: scored,
    selectedProvider: scored.length > 0 ? scored[0] : null,
    baseline,
    agenticAdvantage,
    factorWeights: WEIGHTS,
  };
}

// ============================================================================
// Per-Candidate Scoring
// ============================================================================

function scoreCandidate(
  c: ProviderCandidate,
  req: { serviceType: string; urgency: string; budgetSensitivity: string; preferredTimeWindow?: string },
  allCandidates: ProviderCandidate[]
): RankedCandidate {
  const factors: ScoredFactor[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const riskFlags: string[] = [];

  // ── 1. Service Relevance ──────────────────────────────────────────
  const cats = c.categories || [];
  const serviceMatch = cats.length > 0 ? cats.some((cat) =>
    req.serviceType.toLowerCase().includes(cat.toLowerCase()) ||
    cat.toLowerCase().includes(req.serviceType.toLowerCase().split(' ')[0])
  ) : (c.source as string) === 'registered_provider' || (c.source as string) === 'registered';

  const serviceScore = serviceMatch ? 1.0 : 0.3;
  factors.push({
    factor: 'Service Relevance',
    weight: WEIGHTS.serviceRelevance,
    rawValue: serviceMatch,
    normalizedScore: serviceScore,
    weightedScore: serviceScore * WEIGHTS.serviceRelevance,
    explanation: serviceMatch
      ? `Categories match "${req.serviceType}".`
      : `No direct category match for "${req.serviceType}".`,
  });
  if (serviceMatch) strengths.push(`Relevant to ${req.serviceType}`);
  else weaknesses.push('Category mismatch');

  // ── 2. Distance Proximity ─────────────────────────────────────────
  let distScore = 0.5;
  if (c.distanceEstimateKm !== null) {
    if (c.distanceEstimateKm <= 2) distScore = 1.0;
    else if (c.distanceEstimateKm <= 5) distScore = 0.8;
    else if (c.distanceEstimateKm <= 10) distScore = 0.6;
    else if (c.distanceEstimateKm <= 20) distScore = 0.3;
    else distScore = 0.1;

    if (c.distanceEstimateKm <= 3) strengths.push(`Close: ${c.distanceEstimateKm} km`);
    if (c.distanceEstimateKm > 15) weaknesses.push(`Far: ${c.distanceEstimateKm} km`);
  }

  factors.push({
    factor: 'Distance Proximity',
    weight: WEIGHTS.distanceProximity,
    rawValue: c.distanceEstimateKm,
    normalizedScore: distScore,
    weightedScore: distScore * WEIGHTS.distanceProximity,
    explanation: c.distanceEstimateKm !== null
      ? `${c.distanceEstimateKm} km away.`
      : 'Distance unknown.',
  });

  // ── 3. Rating Score ───────────────────────────────────────────────
  let ratingScore = 0.5;
  if (c.rating !== null) {
    ratingScore = Math.min(c.rating / 5.0, 1.0);
    if (c.rating >= 4.5) strengths.push(`Excellent rating: ${c.rating}`);
    else if (c.rating < 3.0) weaknesses.push(`Low rating: ${c.rating}`);
  }

  factors.push({
    factor: 'Rating',
    weight: WEIGHTS.ratingScore,
    rawValue: c.rating,
    normalizedScore: ratingScore,
    weightedScore: ratingScore * WEIGHTS.ratingScore,
    explanation: c.rating !== null
      ? `Rating: ${c.rating}/5.`
      : 'Rating not available — using neutral score.',
  });

  // ── 4. Review Strength ────────────────────────────────────────────
  let reviewScore = 0.4;
  if (c.reviewCount !== null) {
    if (c.reviewCount >= 100) reviewScore = 1.0;
    else if (c.reviewCount >= 50) reviewScore = 0.8;
    else if (c.reviewCount >= 20) reviewScore = 0.6;
    else if (c.reviewCount >= 5) reviewScore = 0.4;
    else reviewScore = 0.2;

    if (c.reviewCount >= 50) strengths.push(`Well-reviewed: ${c.reviewCount} reviews`);
    if (c.reviewCount < 5) riskFlags.push('Very few reviews');
  }

  factors.push({
    factor: 'Review Strength',
    weight: WEIGHTS.reviewStrength,
    rawValue: c.reviewCount,
    normalizedScore: reviewScore,
    weightedScore: reviewScore * WEIGHTS.reviewStrength,
    explanation: c.reviewCount !== null
      ? `${c.reviewCount} reviews.`
      : 'Review count unknown.',
  });

  // ── 5. Open Status ────────────────────────────────────────────────
  let openScore = 0.5;
  if (c.openNow === true) { openScore = 1.0; strengths.push('Currently open'); }
  else if (c.openNow === false) { openScore = 0.2; weaknesses.push('Currently closed'); }

  factors.push({
    factor: 'Open Status',
    weight: WEIGHTS.openStatus,
    rawValue: c.openNow,
    normalizedScore: openScore,
    weightedScore: openScore * WEIGHTS.openStatus,
    explanation: c.openNow === null ? 'Hours unknown.' : c.openNow ? 'Open now.' : 'Closed now.',
  });

  // ── 6. Registered Bonus ───────────────────────────────────────────
  const regScore = c.isRegistered ? 1.0 : 0.0;
  factors.push({
    factor: 'Registered Provider',
    weight: WEIGHTS.registeredBonus,
    rawValue: c.isRegistered,
    normalizedScore: regScore,
    weightedScore: regScore * WEIGHTS.registeredBonus,
    explanation: c.isRegistered
      ? 'Registered KaamWala provider — booking eligible.'
      : 'Not registered — discovery only, onboarding required.',
  });
  if (c.isRegistered) strengths.push('Registered & bookable');
  else weaknesses.push('Not registered — cannot book');

  // ── 7. Verified & Active ──────────────────────────────────────────
  const verifiedScore = c.isRegistered && c.bookable ? 1.0 : c.businessStatus === 'OPERATIONAL' ? 0.5 : 0.2;
  factors.push({
    factor: 'Verified & Active',
    weight: WEIGHTS.verifiedActive,
    rawValue: c.businessStatus,
    normalizedScore: verifiedScore,
    weightedScore: verifiedScore * WEIGHTS.verifiedActive,
    explanation: c.isRegistered ? 'Verified registered provider.' : `Business status: ${c.businessStatus}.`,
  });

  // ── 8. Availability Fit ───────────────────────────────────────────
  let availScore = 0.5;
  if (c.isRegistered && c.rawDataSummary?.availability) {
    const avail = c.rawDataSummary.availability;
    if (req.preferredTimeWindow && avail.timeSlots) {
      const hasSlot = avail.timeSlots.includes(req.preferredTimeWindow);
      availScore = hasSlot ? 1.0 : 0.3;
      if (hasSlot) strengths.push(`Available: ${req.preferredTimeWindow}`);
      else weaknesses.push(`Not available: ${req.preferredTimeWindow}`);
    } else {
      availScore = 0.6;
    }
  }

  factors.push({
    factor: 'Availability Fit',
    weight: WEIGHTS.availabilityFit,
    rawValue: c.isRegistered ? 'has_schedule' : 'unknown',
    normalizedScore: availScore,
    weightedScore: availScore * WEIGHTS.availabilityFit,
    explanation: c.isRegistered ? `Availability data present.` : 'Availability unknown for unregistered provider.',
  });

  // ── 9. Price Fit ──────────────────────────────────────────────────
  let priceScore = 0.5;
  if (c.isRegistered && c.rawDataSummary?.baseVisitFee) {
    const fee = c.rawDataSummary.baseVisitFee;
    if (req.budgetSensitivity === 'low') {
      priceScore = fee <= 1200 ? 1.0 : fee <= 1500 ? 0.7 : 0.3;
    } else if (req.budgetSensitivity === 'high') {
      priceScore = 0.8; // High budget is flexible
    } else {
      priceScore = 0.6;
    }
    if (priceScore >= 0.8) strengths.push(`Budget-friendly: PKR ${fee}`);
    if (priceScore <= 0.3) weaknesses.push(`May exceed budget: PKR ${fee}`);
  }

  factors.push({
    factor: 'Price Fit',
    weight: WEIGHTS.priceFit,
    rawValue: c.rawDataSummary?.baseVisitFee ?? null,
    normalizedScore: priceScore,
    weightedScore: priceScore * WEIGHTS.priceFit,
    explanation: c.rawDataSummary?.baseVisitFee
      ? `Base fee: PKR ${c.rawDataSummary.baseVisitFee}. Budget: ${req.budgetSensitivity}.`
      : 'Price data not available.',
  });

  // ── 10. Urgency Fit ───────────────────────────────────────────────
  let urgencyScore = 0.5;
  if (req.urgency === 'emergency' || req.urgency === 'today') {
    urgencyScore = c.openNow === true ? 1.0 : c.openNow === false ? 0.1 : 0.4;
    if (c.distanceEstimateKm !== null && c.distanceEstimateKm <= 3) urgencyScore = Math.min(urgencyScore + 0.2, 1.0);
  } else {
    urgencyScore = 0.6;
  }

  factors.push({
    factor: 'Urgency Fit',
    weight: WEIGHTS.urgencyFit,
    rawValue: req.urgency,
    normalizedScore: urgencyScore,
    weightedScore: urgencyScore * WEIGHTS.urgencyFit,
    explanation: `Urgency: ${req.urgency}. ${c.openNow === true ? 'Provider is open.' : ''}`,
  });

  // ── 11. Data Completeness ─────────────────────────────────────────
  const totalFields = 6;
  const missing = (c.missingFields || []).length;
  const completeness = Math.max(0, (totalFields - missing) / totalFields);

  factors.push({
    factor: 'Data Completeness',
    weight: WEIGHTS.dataCompleteness,
    rawValue: `${totalFields - missing}/${totalFields}`,
    normalizedScore: completeness,
    weightedScore: completeness * WEIGHTS.dataCompleteness,
    explanation: missing > 0
      ? `Missing ${missing} field(s): ${(c.missingFields || []).join(', ')}.`
      : 'All data fields present.',
  });

  // ── 12. Missing Data Penalty ──────────────────────────────────────
  const penaltyScore = Math.max(0, 1.0 - missing * 0.2);
  factors.push({
    factor: 'Missing Data Penalty',
    weight: WEIGHTS.missingPenalty,
    rawValue: missing,
    normalizedScore: penaltyScore,
    weightedScore: penaltyScore * WEIGHTS.missingPenalty,
    explanation: missing > 0
      ? `Penalty for ${missing} missing field(s).`
      : 'No penalty — complete data.',
  });

  if (c.dataWarnings && c.dataWarnings.length > 0) {
    riskFlags.push(...c.dataWarnings);
  }

  // ── Total Score ───────────────────────────────────────────────────
  const totalScore = Math.round(factors.reduce((sum, f) => sum + f.weightedScore, 0) * 1000) / 1000;

  return {
    candidateId: c.candidateId,
    rank: 0, // assigned after sort
    name: c.name,
    totalScore,
    factors,
    strengths,
    weaknesses,
    riskFlags,
    bookingEligible: c.isRegistered && c.bookable,
    bookingStatus: c.isRegistered ? 'Bookable — registered provider' : 'Discovery only — onboarding required',
    whySelected: '',
  };
}

// ============================================================================
// Baseline (distance-only) Selection
// ============================================================================

function computeBaseline(candidates: ProviderCandidate[]): RankingResult['baseline'] {
  const withDistance = candidates.filter((c) => c.distanceEstimateKm !== null);

  if (withDistance.length === 0) {
    return {
      method: 'nearest_distance',
      selectedName: candidates[0]?.name || 'None',
      selectedId: candidates[0]?.candidateId || '',
      reasoning: 'No distance data available. Selected first result.',
    };
  }

  const nearest = withDistance.sort((a, b) => (a.distanceEstimateKm || 999) - (b.distanceEstimateKm || 999))[0];
  return {
    method: 'nearest_distance',
    selectedName: nearest.name,
    selectedId: nearest.candidateId,
    reasoning: `Selected nearest provider: ${nearest.name} at ${nearest.distanceEstimateKm} km. No rating, availability, price, or registration status considered.`,
  };
}

// ============================================================================
// Agentic Advantage Explanation
// ============================================================================

function computeAgenticAdvantage(
  topPick: RankedCandidate | undefined,
  baseline: RankingResult['baseline'],
  totalCandidates: number
): string {
  if (!topPick) return 'No candidates to compare.';

  if (topPick.candidateId === baseline.selectedId) {
    return `AI ranking confirms the nearest provider is also the best overall choice, scoring ${topPick.totalScore.toFixed(3)} across ${topPick.factors.length} factors. Without AI, you would have picked the same provider but without knowing their rating (${topPick.factors.find(f => f.factor === 'Rating')?.rawValue ?? 'unknown'}), availability, or price fit.`;
  }

  const baselineCandidate = topPick.name;
  return `AI selected "${baselineCandidate}" (score: ${topPick.totalScore.toFixed(3)}) over the baseline nearest-distance pick "${baseline.selectedName}". The AI evaluated ${topPick.factors.length} factors across ${totalCandidates} candidates including service relevance, rating, registration status, price fit, and availability. Without AI, a user would simply pick the closest option without considering quality or bookability.`;
}

// ============================================================================
// Why Selected (top pick explanation)
// ============================================================================

function generateWhySelected(top: RankedCandidate, totalCandidates: number): string {
  const topFactors = top.factors
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3)
    .map((f) => `${f.factor} (${(f.normalizedScore * 100).toFixed(0)}%)`)
    .join(', ');

  const parts: string[] = [];
  parts.push(`Selected from ${totalCandidates} candidate${totalCandidates > 1 ? 's' : ''}.`);
  parts.push(`Top scoring factors: ${topFactors}.`);
  if (top.bookingEligible) parts.push('This provider is registered and can accept bookings.');
  else parts.push('This provider requires onboarding before booking is possible.');
  if (top.strengths.length > 0) parts.push(`Strengths: ${top.strengths.slice(0, 3).join(', ')}.`);
  if (top.weaknesses.length > 0) parts.push(`Considerations: ${top.weaknesses.slice(0, 2).join(', ')}.`);

  return parts.join(' ');
}
