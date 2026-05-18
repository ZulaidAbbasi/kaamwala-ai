// functions/src/services/pricingService.ts
// Transparent price estimation engine
// Generates estimates, NOT final quotes
// Every assumption and unknown is documented

import { safeLog } from '../utils/safeLogger';

// ============================================================================
// Service Base Rates (PKR) — Market research for Islamabad
// ============================================================================

const SERVICE_BASE_RATES: Record<string, { low: number; mid: number; high: number; unit: string }> = {
  'ac_repair':     { low: 1000, mid: 2000, high: 4000, unit: 'per visit' },
  'ac repair':     { low: 1000, mid: 2000, high: 4000, unit: 'per visit' },
  'hvac':          { low: 1000, mid: 2000, high: 4000, unit: 'per visit' },
  'electrical':    { low: 800,  mid: 1500, high: 3000, unit: 'per visit' },
  'electrician':   { low: 800,  mid: 1500, high: 3000, unit: 'per visit' },
  'plumbing':      { low: 800,  mid: 1500, high: 3500, unit: 'per visit' },
  'plumber':       { low: 800,  mid: 1500, high: 3500, unit: 'per visit' },
  'painting':      { low: 2000, mid: 5000, high: 15000, unit: 'per room' },
  'carpentry':     { low: 1500, mid: 3000, high: 8000, unit: 'per job' },
  'cleaning':      { low: 1500, mid: 3000, high: 6000, unit: 'per session' },
  'appliance':     { low: 1000, mid: 2500, high: 5000, unit: 'per visit' },
  'barber':        { low: 200,  mid: 500,  high: 1500, unit: 'per visit' },
  'beautician':    { low: 500,  mid: 1500, high: 5000, unit: 'per session' },
  'car_wash':      { low: 300,  mid: 800,  high: 2000, unit: 'per wash' },
  'car wash':      { low: 300,  mid: 800,  high: 2000, unit: 'per wash' },
  'mechanic':      { low: 500,  mid: 2000, high: 8000, unit: 'per job' },
  'tutor':         { low: 3000, mid: 8000, high: 20000, unit: 'per month' },
  'pest_control':  { low: 2000, mid: 5000, high: 12000, unit: 'per treatment' },
  'pest control':  { low: 2000, mid: 5000, high: 12000, unit: 'per treatment' },
  'dentist':       { low: 500,  mid: 2000, high: 10000, unit: 'per visit' },
  'doctor':        { low: 500,  mid: 1500, high: 5000, unit: 'per visit' },
  'general':       { low: 800,  mid: 1500, high: 3000, unit: 'per visit' },
};

const DEFAULT_RATE = { low: 800, mid: 1800, high: 4000, unit: 'per visit' };

// ============================================================================
// Types
// ============================================================================

export interface PriceEstimate {
  estimateLow: number;
  estimateHigh: number;
  recommendedEstimate: number;
  currency: string;
  breakdown: BreakdownItem[];
  assumptions: string[];
  unknowns: string[];
  fairnessExplanation: string;
  confidence: number;
  userMessage: string;
  providerNote: string;
  isEstimateOnly: boolean;
}

export interface BreakdownItem {
  label: string;
  amount: number;
  type: 'base' | 'adjustment' | 'fee' | 'discount';
  explanation: string;
}

// ============================================================================
// Main Estimation Function
// ============================================================================

export function estimatePrice(input: {
  serviceType: string;
  issueDescription?: string;
  urgency: string;
  budgetSensitivity: string;
  preferredTimeWindow?: string;
  distanceKm?: number | null;
  isRegistered: boolean;
  providerBaseVisitFee?: number | null;
  providerRating?: number | null;
  providerName: string;
}): PriceEstimate {
  const breakdown: BreakdownItem[] = [];
  const assumptions: string[] = [];
  const unknowns: string[] = [];

  // ── 1. Base rate ──────────────────────────────────────────────────
  const serviceKey = input.serviceType.toLowerCase().replace(/\s+/g, '_');
  const rate = SERVICE_BASE_RATES[serviceKey] || SERVICE_BASE_RATES[input.serviceType.toLowerCase()] || DEFAULT_RATE;

  let baseLow = rate.low;
  let baseHigh = rate.high;
  let baseMid = rate.mid;

  // If registered provider has a known fee, use it as anchor
  if (input.isRegistered && input.providerBaseVisitFee) {
    baseMid = input.providerBaseVisitFee;
    baseLow = Math.round(input.providerBaseVisitFee * 0.8);
    baseHigh = Math.round(input.providerBaseVisitFee * 1.5);
    assumptions.push(`Provider base visit fee: PKR ${input.providerBaseVisitFee}.`);
  } else {
    assumptions.push(`Using market rate for ${input.serviceType} in Islamabad.`);
    unknowns.push('Exact provider pricing not available — using market estimates.');
  }

  breakdown.push({
    label: 'Base Service Fee',
    amount: baseMid,
    type: 'base',
    explanation: input.isRegistered && input.providerBaseVisitFee
      ? `Provider's listed visit fee.`
      : `Market rate for ${input.serviceType} (${rate.unit}).`,
  });

  // ── 2. Complexity estimate ────────────────────────────────────────
  let complexityMultiplier = 1.0;
  let complexityLabel = 'Standard';

  if (input.issueDescription) {
    const desc = input.issueDescription.toLowerCase();
    const complexKeywords = ['complete', 'major', 'full', 'renovation', 'replacement', 'overhaul', 'install'];
    const simpleKeywords = ['minor', 'small', 'quick', 'check', 'inspect', 'tune'];

    if (complexKeywords.some((k) => desc.includes(k))) {
      complexityMultiplier = 1.4;
      complexityLabel = 'Complex';
      assumptions.push('Issue description suggests complex work — adjusted estimate upward.');
    } else if (simpleKeywords.some((k) => desc.includes(k))) {
      complexityMultiplier = 0.8;
      complexityLabel = 'Simple';
      assumptions.push('Issue description suggests simple work — adjusted estimate downward.');
    }
  } else {
    unknowns.push('No issue description — assuming standard complexity.');
  }

  if (complexityMultiplier !== 1.0) {
    const adj = Math.round(baseMid * (complexityMultiplier - 1));
    breakdown.push({
      label: `Complexity Adjustment (${complexityLabel})`,
      amount: adj,
      type: 'adjustment',
      explanation: `${complexityLabel} job: ${complexityMultiplier > 1 ? '+' : ''}${Math.round((complexityMultiplier - 1) * 100)}% adjustment.`,
    });
  }

  // ── 3. Urgency adjustment ─────────────────────────────────────────
  let urgencyMultiplier = 1.0;

  switch (input.urgency) {
    case 'emergency':
      urgencyMultiplier = 1.5;
      assumptions.push('Emergency urgency — 50% premium applied.');
      break;
    case 'today':
      urgencyMultiplier = 1.2;
      assumptions.push('Same-day request — 20% premium applied.');
      break;
    case 'tomorrow_morning':
    case 'tomorrow':
      urgencyMultiplier = 1.05;
      assumptions.push('Next-day request — minimal premium.');
      break;
    default:
      urgencyMultiplier = 1.0;
  }

  if (urgencyMultiplier !== 1.0) {
    const urgAdj = Math.round(baseMid * complexityMultiplier * (urgencyMultiplier - 1));
    breakdown.push({
      label: 'Urgency Premium',
      amount: urgAdj,
      type: 'fee',
      explanation: `${input.urgency} request: +${Math.round((urgencyMultiplier - 1) * 100)}%.`,
    });
  }

  // ── 4. Travel/distance fee ────────────────────────────────────────
  let travelFee = 0;

  if (input.distanceKm !== null && input.distanceKm !== undefined) {
    if (input.distanceKm > 10) {
      travelFee = Math.round((input.distanceKm - 5) * 50);
      assumptions.push(`Distance: ${input.distanceKm} km — travel fee applied for distance > 5 km.`);
    } else if (input.distanceKm > 5) {
      travelFee = Math.round((input.distanceKm - 5) * 30);
      assumptions.push(`Distance: ${input.distanceKm} km — small travel fee.`);
    }
  } else {
    unknowns.push('Distance unknown — no travel fee added.');
  }

  if (travelFee > 0) {
    breakdown.push({
      label: 'Travel Fee',
      amount: travelFee,
      type: 'fee',
      explanation: `${input.distanceKm} km from your location.`,
    });
  }

  // ── 5. Time-of-day adjustment ─────────────────────────────────────
  let timeAdj = 0;
  if (input.preferredTimeWindow === 'evening' || input.preferredTimeWindow === 'night') {
    timeAdj = Math.round(baseMid * 0.1);
    breakdown.push({
      label: 'Evening/Night Surcharge',
      amount: timeAdj,
      type: 'fee',
      explanation: 'After-hours service: +10%.',
    });
    assumptions.push('Evening/night service — 10% surcharge.');
  }

  // ── 6. Calculate totals ───────────────────────────────────────────
  const totalMid = Math.round(baseMid * complexityMultiplier * urgencyMultiplier + travelFee + timeAdj);
  const totalLow = Math.round(baseLow * complexityMultiplier * urgencyMultiplier * 0.9 + travelFee);
  const totalHigh = Math.round(baseHigh * complexityMultiplier * urgencyMultiplier * 1.1 + travelFee + timeAdj);

  // ── 7. Budget sensitivity message ─────────────────────────────────
  let budgetNote = '';
  switch (input.budgetSensitivity) {
    case 'low':
      budgetNote = 'You mentioned a tight budget. The lower estimate represents basic service without premium parts.';
      break;
    case 'high':
      budgetNote = 'With a flexible budget, the provider can use premium parts and offer comprehensive service.';
      break;
    default:
      budgetNote = 'Estimate based on standard service level.';
  }

  // ── 8. Confidence ─────────────────────────────────────────────────
  let confidence = 0.6;
  if (input.isRegistered && input.providerBaseVisitFee) confidence += 0.2;
  if (input.issueDescription) confidence += 0.05;
  if (input.distanceKm !== null && input.distanceKm !== undefined) confidence += 0.05;
  if (unknowns.length === 0) confidence += 0.1;
  confidence = Math.min(confidence, 0.95);

  // ── 9. Provider note ──────────────────────────────────────────────
  const providerNote = input.isRegistered
    ? 'Platform estimate based on provider\'s listed fees. Provider confirmation may be required after inspection.'
    : 'Estimate only — provider not onboarded. Actual pricing requires provider registration.';

  // ── 10. Fairness explanation ──────────────────────────────────────
  const fairnessExplanation = `This estimate is based on ${
    input.isRegistered ? 'the provider\'s listed rates' : 'Islamabad market averages'
  }, adjusted for job complexity (${complexityLabel.toLowerCase()}), urgency (${input.urgency}), ${
    input.distanceKm ? `distance (${input.distanceKm} km)` : 'and standard delivery'
  }. ${budgetNote} Parts and materials are not included and would be quoted separately by the provider.`;

  // ── 11. User message ──────────────────────────────────────────────
  const userMessage = `Estimated cost for ${input.serviceType}: PKR ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}. Recommended: PKR ${totalMid.toLocaleString()}. ${providerNote}`;

  safeLog.info('PricingService', `Estimated ${input.serviceType}: PKR ${totalLow}-${totalHigh} (mid: ${totalMid}), confidence: ${confidence.toFixed(2)}`);

  return {
    estimateLow: totalLow,
    estimateHigh: totalHigh,
    recommendedEstimate: totalMid,
    currency: 'PKR',
    breakdown,
    assumptions,
    unknowns,
    fairnessExplanation,
    confidence,
    userMessage,
    providerNote,
    isEstimateOnly: true,
  };
}
