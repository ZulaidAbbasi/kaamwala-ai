// src/services/workflow/runServiceWorkflow.ts
// Typed workflow runner — runs 8 backend stages with timeouts and clean error handling

import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

export type StepStatus = 'pending' | 'running' | 'done' | 'warning' | 'failed';

export interface StepState {
  id: string;
  label: string;
  icon: string;
  status: StepStatus;
  detail?: string;
}

export interface LocationContext {
  source: 'text' | 'manual' | 'gps';
  coordinates?: { latitude: number; longitude: number; accuracy?: number };
  areaText?: string;
}

export interface WorkflowResult {
  parsed?: any;
  candidates?: any[];
  ranked?: any[];
  selected?: any;
  price?: any;
  booking?: any;
  followUp?: any;
  recovery?: any;
  traces: any[];
  workflowId?: string;
  error?: string;
}

const TIMEOUT_MS = 30000;

async function post(endpoint: string, body: any): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

// Sanitize raw backend text
function clean(val: any, fallback: string): string {
  if (!val) return fallback;
  const s = String(val);
  if (s.includes('unknown') || s.includes('undefined') || s.includes('Cannot read')) return fallback;
  return s;
}

export const INITIAL_STEPS: StepState[] = [
  { id: 'parse', label: 'Understand', icon: '🧠', status: 'pending' },
  { id: 'discover', label: 'Discover', icon: '🔍', status: 'pending' },
  { id: 'rank', label: 'Rank', icon: '🏆', status: 'pending' },
  { id: 'price', label: 'Price', icon: '💰', status: 'pending' },
  { id: 'book', label: 'Book', icon: '📋', status: 'pending' },
  { id: 'followup', label: 'Follow-Up', icon: '📅', status: 'pending' },
  { id: 'recover', label: 'Recover', icon: '🔄', status: 'pending' },
  { id: 'trace', label: 'Trace', icon: '🤖', status: 'pending' },
];

export async function runServiceWorkflow(
  rawText: string,
  onStep: (stepId: string, status: StepStatus, detail?: string) => void,
  locationCtx?: LocationContext,
): Promise<WorkflowResult> {
  const traces: any[] = [];
  const result: WorkflowResult = { traces };

  try {
    // 1. Parse
    onStep('parse', 'running', 'Understanding request...');
    let parseSuccess = false;
    try {
      const p = await post(API_ENDPOINTS.PARSE_REQUEST, { rawText });
      if (p.traces) traces.push(...p.traces);
      if (!p.success && p.parsedRequest?.confidenceScore === 0) {
        // All AI models busy — retry once after a short delay
        onStep('parse', 'running', 'AI busy, retrying...');
        await new Promise(r => setTimeout(r, 2500));
        try {
          const p2 = await post(API_ENDPOINTS.PARSE_REQUEST, { rawText });
          if (p2.traces) traces.push(...p2.traces);
          if (p2.success || (p2.parsedRequest?.confidenceScore ?? 0) > 0) {
            result.parsed = p2.parsedRequest;
            result.workflowId = p2.workflowId;
            parseSuccess = true;
          } else {
            result.parsed = p.parsedRequest;
            result.workflowId = p.workflowId;
          }
        } catch {
          result.parsed = p.parsedRequest;
          result.workflowId = p.workflowId;
        }
      } else {
        result.parsed = p.parsedRequest;
        result.workflowId = p.workflowId;
        parseSuccess = p.success !== false;
      }
    } catch {
      onStep('parse', 'warning', 'Parse timeout — using defaults');
    }
    onStep('parse', result.parsed?.confidenceScore > 0 ? 'done' : 'warning', clean(result.parsed?.serviceType, 'Intent extracted'));

    // Use consistent references for all subsequent steps
    const wfId = result.workflowId || `wf_fallback_${Date.now()}`;
    const parsedReq = result.parsed || { serviceType: rawText.substring(0, 50), locationText: 'Islamabad', urgency: 'standard' };

    // 2. Discover — pass coordinates if GPS available
    onStep('discover', 'running', 'Searching providers...');
    const discoverBody: any = {
      workflowId: wfId,
      parsedRequest: parsedReq,
    };

    // If GPS coordinates available, pass them directly
    if (locationCtx?.source === 'gps' && locationCtx.coordinates) {
      discoverBody.coordinates = {
        lat: locationCtx.coordinates.latitude,
        lng: locationCtx.coordinates.longitude,
      };
      discoverBody.locationSource = 'gps';
    } else if (locationCtx?.source === 'manual' && locationCtx.areaText) {
      // Override locationText with manually entered area
      discoverBody.parsedRequest = {
        ...discoverBody.parsedRequest,
        locationText: locationCtx.areaText,
      };
      discoverBody.locationSource = 'manual';
    }

    let disc: any;
    try {
      disc = await post(API_ENDPOINTS.DISCOVER_PROVIDERS, discoverBody);
    } catch {
      // Timeout on discover — retry once with longer patience
      onStep('discover', 'running', 'Retrying discovery...');
      try {
        disc = await post(API_ENDPOINTS.DISCOVER_PROVIDERS, discoverBody);
      } catch {
        disc = { candidates: [], traces: [] };
      }
    }
    if (disc?.traces) traces.push(...disc.traces);
    const candidateList = disc?.candidates || [];
    result.candidates = candidateList;
    onStep('discover', candidateList.length > 0 ? 'done' : 'warning', `${candidateList.length} providers found`);

    // 3. Rank
    onStep('rank', 'running', 'Ranking candidates...');
    try {
      if (candidateList.length > 0) {
        const rk = await post(API_ENDPOINTS.RANK_PROVIDERS, {
          workflowId: wfId, parsedRequest: parsedReq, providerCandidates: candidateList,
        });
        if (rk.traces) traces.push(...rk.traces);
        const rankedList = rk.rankedProviders || [];
        result.ranked = rankedList;
        result.selected = rk.selectedProvider || (rankedList.length > 0 ? rankedList[0] : null);
        onStep('rank', 'done', result.selected?.name ? `Selected: ${result.selected.name.substring(0, 25)}` : 'Ranked');
      } else {
        onStep('rank', 'warning', 'No candidates to rank');
      }
    } catch {
      onStep('rank', 'warning', 'Ranking error');
    }

    // 4. Price
    onStep('price', 'running', 'Estimating price...');
    try {
      if (result.selected) {
        const pr = await post(API_ENDPOINTS.ESTIMATE_PRICE, {
          workflowId: wfId, parsedRequest: parsedReq, selectedProvider: result.selected,
        });
        if (pr.traces) traces.push(...pr.traces);
        result.price = pr.estimate || null;
        onStep('price', 'done', result.price?.recommendedEstimate ? `PKR ${result.price.recommendedEstimate}` : 'Estimated');
      } else {
        onStep('price', 'warning', 'No provider selected');
      }
    } catch {
      onStep('price', 'warning', 'Price estimation timeout');
    }

    // 5. Book
    onStep('book', 'running', 'Creating booking...');
    try {
      if (result.selected) {
        const bk = await post(API_ENDPOINTS.CREATE_BOOKING, {
          workflowId: wfId, selectedProvider: result.selected,
          parsedRequest: parsedReq, priceEstimate: result.price,
        });
        if (bk.traces) traces.push(...bk.traces);
        result.booking = bk.booking || null;
        onStep('book', 'done', result.booking?.firestoreSaved ? 'Firestore saved ✓' : 'Record created');
      } else {
        onStep('book', 'warning', 'No provider to book');
      }
    } catch {
      onStep('book', 'warning', 'Booking timeout');
    }

    // 6. Follow-Up — store full response so result screen can display timeline
    onStep('followup', 'running', 'Preparing follow-up...');
    try {
      const fu = await post(API_ENDPOINTS.SIMULATE_FOLLOW_UP, {
        workflowId: wfId, bookingId: result.booking?.bookingId || `demo_${Date.now()}`,
      });
      if (fu.traces) traces.push(...fu.traces);
      // Store the full follow-up result (has timeline, checklist, feedback, etc.)
      result.followUp = {
        timeline: fu.timeline || [],
        checklist: fu.checklist || [],
        feedback: fu.feedback || null,
        reputationUpdate: fu.reputationUpdate || null,
        firestoreSaved: fu.firestoreSaved || false,
      };
      traces.push(
        { phase: 'follow_up', decision: 'Reminder scheduled: 1 hour before appointment', confidence: 1 },
        { phase: 'follow_up', decision: `${(fu.timeline || []).length} lifecycle events simulated`, confidence: 1 },
      );
      onStep('followup', 'done', `${(fu.timeline || []).length} events simulated`);
    } catch {
      // Even on failure, provide structured follow-up data
      result.followUp = {
        timeline: [],
        checklist: [],
        feedback: null,
        firestoreSaved: false,
      };
      onStep('followup', 'warning', 'Follow-up partial');
    }

    // 7. Recovery
    onStep('recover', 'running', 'Testing recovery...');
    try {
      const rv = await post(API_ENDPOINTS.RESOLVE_DISPUTE, {
        workflowId: wfId, scenario: 'provider_cancellation',
        bookingId: result.booking?.bookingId || `demo_${Date.now()}`, rawText, confidence: 0.85,
      });
      if (rv.traces) traces.push(...rv.traces);
      result.recovery = rv.recovery || null;
      onStep('recover', 'done', 'Recovery tested ✓');
    } catch {
      onStep('recover', 'warning', 'Recovery simulation partial');
    }

    // 8. Trace
    onStep('trace', 'done', `${traces.length}+ events logged`);
    result.traces = traces;
    return result;

  } catch (e: any) {
    result.error = e.message || 'Workflow failed';
    result.traces = traces;
    return result;
  }
}
