// functions/src/services/gemini/geminiClient.ts
// Main Gemini API client — all AI calls go through here
// NEVER exposes the API key. NEVER logs raw sensitive data.

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getEnvConfig } from '../../config/env';
import { safeLog } from '../../utils/safeLogger';

import {
  ParsedServiceRequest,
  RankingExplanation,
  CustomerMessage,
  ProviderMessage,
  DisputeResolution,
  validateParsedRequest,
} from './geminiSchemas';

import {
  NLU_SYSTEM_INSTRUCTION,
  buildParseRequestPrompt,
  buildRankingPrompt,
  buildCustomerMessagePrompt,
  buildProviderMessagePrompt,
  buildDisputePrompt,
} from './geminiPrompts';

import {
  fallbackParseRequest,
  fallbackRanking,
  fallbackCustomerMessage,
  fallbackProviderMessage,
  fallbackDisputeResolution,
} from './geminiFallback';

// ============================================================================
// MODEL CHAIN — ONLY models with actual free-tier quota (verified from dashboard)
// Models with 0/0 RPM/RPD are excluded (gemini-2.5-pro, gemini-3.1-pro,
// gemini-2.0-flash, gemini-2.0-flash-lite all have ZERO quota)
//
//   gemini-3.1-flash-lite: 15 RPM, 250K TPM, 500 RPD  — BEST
//   gemini-2.5-flash-lite: 10 RPM, 250K TPM,  20 RPD
//   gemini-3-flash:         5 RPM, 250K TPM,  20 RPD
//   gemini-2.5-flash:       5 RPM, 250K TPM,  20 RPD
//   gemma-4-31b:           15 RPM, Unlimited,1500 RPD  — MASSIVE
//   gemma-4-26b:           15 RPM, Unlimited,1500 RPD  — MASSIVE
//
// Total combined: 65 RPM, 3060 RPD
// ============================================================================
const MODEL_CHAIN = [
  'gemini-3.1-flash-lite',   // 15 RPM, 500 RPD — highest quota
  'gemini-2.5-flash-lite',   // 10 RPM,  20 RPD
  'gemini-3-flash-preview',  //  5 RPM,  20 RPD (actual API name)
  'gemini-2.5-flash',        //  5 RPM,  20 RPD
  'gemma-4-31b-it',          // 15 RPM, 1500 RPD, unlimited TPM (actual API name)
  'gemma-4-26b-a4b-it',      // 15 RPM, 1500 RPD, unlimited TPM (actual API name)
];

/**
 * Get a configured Gemini model instance for a specific model name.
 * @param useJsonMode - If false, skips responseMimeType for compatibility
 */
function getModel(modelName: string, systemInstruction?: string, useJsonMode: boolean = true): GenerativeModel {
  const config = getEnvConfig();

  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  const generationConfig: any = {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 2048,
  };

  // Add JSON mode only if requested (some models may not support it)
  if (useJsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  return genAI.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig,
  });
}

/**
 * Extract JSON from Gemini response text.
 * Handles markdown code blocks and extra whitespace.
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    cleaned = cleaned.substring(firstNewline + 1);
    const lastFence = cleaned.lastIndexOf('```');
    if (lastFence > 0) {
      cleaned = cleaned.substring(0, lastFence);
    }
  }

  cleaned = cleaned.trim();

  // If the text starts with '{' or '[', it's already JSON
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
    return cleaned;
  }

  // Gemma models output thinking/reasoning text before JSON.
  // Find the LAST complete JSON object in the response.
  // Look for ```json blocks first
  const jsonBlockMatch = cleaned.match(/```json\s*\n([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Find the last { ... } block that looks like JSON
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace > -1) {
    // Walk backwards to find the matching opening brace
    let depth = 0;
    for (let i = lastBrace; i >= 0; i--) {
      if (cleaned[i] === '}') depth++;
      if (cleaned[i] === '{') depth--;
      if (depth === 0) {
        const candidate = cleaned.substring(i, lastBrace + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          // Not valid JSON, keep searching
        }
      }
    }
  }

  return cleaned;
}

/**
 * Try to parse JSON, with one repair attempt if it fails.
 */
function safeParseJSON<T>(text: string, context: string): T | null {
  // First attempt
  try {
    return JSON.parse(text) as T;
  } catch (e1) {
    safeLog.warn('GeminiClient', `JSON parse failed for ${context}, attempting repair`);
  }

  // Repair attempt: fix common issues
  try {
    let repaired = text;
    // Fix trailing commas
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');
    // Fix single quotes to double quotes
    repaired = repaired.replace(/'/g, '"');
    // Fix unquoted keys
    repaired = repaired.replace(/(\{|,)\s*([a-zA-Z_]\w*)\s*:/g, '$1"$2":');

    return JSON.parse(repaired) as T;
  } catch (e2) {
    safeLog.error('GeminiClient', `JSON repair failed for ${context}`);
    return null;
  }
}

/**
 * Categorize Gemini error for safe logging (no secrets).
 */
function categorizeGeminiError(err: any): { category: string; statusCode: number; errorType: string; rawMessage: string } {
  const msg = String(err?.message || err || '');
  const msgLower = msg.toLowerCase();
  const status = err?.status || err?.statusCode || err?.httpStatusCode || 0;

  if (status === 429 || msgLower.includes('429') || msgLower.includes('quota') || msgLower.includes('rate') || msgLower.includes('resource has been exhausted')) {
    return { category: 'quota', statusCode: 429, errorType: 'RATE_LIMIT', rawMessage: msg.substring(0, 200) };
  }
  if (status === 403 || msgLower.includes('permission') || msgLower.includes('forbidden')) {
    return { category: 'auth', statusCode: 403, errorType: 'PERMISSION_DENIED', rawMessage: msg.substring(0, 200) };
  }
  if (status === 401 || msgLower.includes('api key') || msgLower.includes('unauthorized')) {
    return { category: 'auth', statusCode: 401, errorType: 'UNAUTHORIZED', rawMessage: msg.substring(0, 200) };
  }
  if (status === 400 || msgLower.includes('invalid') || msgLower.includes('bad request')) {
    return { category: 'request_format', statusCode: 400, errorType: 'BAD_REQUEST', rawMessage: msg.substring(0, 200) };
  }
  if (status === 404 || msgLower.includes('not found') || msgLower.includes('model')) {
    return { category: 'model_limit', statusCode: 404, errorType: 'MODEL_NOT_FOUND', rawMessage: msg.substring(0, 200) };
  }
  return { category: 'unknown', statusCode: status || 500, errorType: 'UNKNOWN', rawMessage: msg.substring(0, 200) };
}

/**
 * Sleep utility for retry backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// CALL GEMINI — auto-switch between models, no retries, no delays
// ============================================================================

/**
 * Call Gemini API with auto-switch model chain.
 * Tries each model ONCE — if it fails (rate limit, error, etc.),
 * instantly switches to the next model. No retries, no cooldowns.
 */
async function callGemini(
  prompt: string,
  systemInstruction?: string,
  context?: string
): Promise<{ text: string; latencyMs: number; model: string } | null> {
  const start = Date.now();
  const tag = context || 'gemini_call';
  const errorLog: string[] = [];

  for (const modelName of MODEL_CHAIN) {
    // Gemma models don't support JSON mode — auto-detect
    const isGemma = modelName.startsWith('gemma');

    try {
      const model = getModel(modelName, systemInstruction, !isGemma);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const latencyMs = Date.now() - start;

      safeLog.info('GeminiClient', `${tag} OK in ${latencyMs}ms, model=${modelName}`);
      return { text, latencyMs, model: modelName };
    } catch (err: any) {
      const errInfo = categorizeGeminiError(err);
      errorLog.push(`${modelName}: ${errInfo.errorType}`);
      // Auto-switch to next model instantly
      continue;
    }
  }

  // All models failed
  const totalLatency = Date.now() - start;
  safeLog.error('GeminiClient', `${tag} ALL ${MODEL_CHAIN.length} models failed in ${totalLatency}ms: ${errorLog.join(' | ')}`);
  (callGemini as any)._lastErrorDetails = errorLog.join(' | ');
  return null;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * 1. Parse a multilingual service request using Gemini NLU.
 */
export async function parseServiceRequest(rawText: string): Promise<{
  parsed: ParsedServiceRequest;
  source: 'gemini' | 'fallback';
  latencyMs: number;
  rawGeminiResponse?: string;
}> {
  const prompt = buildParseRequestPrompt(rawText);
  const result = await callGemini(prompt, NLU_SYSTEM_INSTRUCTION, 'parseRequest');

  if (!result) {
    const errorDetails = (callGemini as any)._lastErrorDetails || 'Unknown error';
    safeLog.error('GeminiClient', `parseRequest: ALL AI models unavailable (${errorDetails})`);
    // AI-only: return minimal response instead of keyword guessing
    return {
      parsed: {
        serviceType: 'Service requested',
        issueDescription: rawText.substring(0, 200),
        locationText: '',
        preferredDate: '',
        preferredTimeWindow: '',
        urgency: 'unspecified',
        budgetSensitivity: 'unspecified',
        qualityPreference: 'unspecified',
        constraints: [],
        languageDetected: 'unknown',
        confidenceScore: 0,
        missingFields: ['AI models temporarily unavailable — please retry in a few seconds'],
        clarificationQuestion: 'All AI models are temporarily busy. Please try again in a few seconds.',
        normalizedEnglishSummary: `AI unavailable. Raw: ${rawText.substring(0, 100)}`,
      },
      source: 'fallback',
      latencyMs: 0,
      rawGeminiResponse: `AI_UNAVAILABLE: ${errorDetails}`,
    };
  }

  const json = extractJSON(result.text);
  const parsed = safeParseJSON<ParsedServiceRequest>(json, 'parseRequest');

  if (!parsed) {
    safeLog.warn('GeminiClient', 'parseRequest: Invalid JSON from AI, retrying with simpler prompt...');
    // Try one more time with a simpler prompt instead of keyword fallback
    const simplePrompt = `Extract service info from this text as JSON: {"serviceType":"","locationText":"","urgency":"","languageDetected":"","confidenceScore":0,"normalizedEnglishSummary":""}\n\nText: "${rawText}"`;
    const retry = await callGemini(simplePrompt, undefined, 'parseRequest_retry');
    if (retry) {
      const retryJson = extractJSON(retry.text);
      const retryParsed = safeParseJSON<ParsedServiceRequest>(retryJson, 'parseRequest_retry');
      if (retryParsed) {
        if (!retryParsed.missingFields) retryParsed.missingFields = [];
        if (!retryParsed.constraints) retryParsed.constraints = [];
        if (!retryParsed.confidenceScore) retryParsed.confidenceScore = 0.5;
        return {
          parsed: retryParsed,
          source: 'gemini',
          latencyMs: retry.latencyMs,
          rawGeminiResponse: retryJson.substring(0, 500),
        };
      }
    }
    // If even retry fails, return raw text as-is
    return {
      parsed: {
        serviceType: 'Service requested',
        issueDescription: rawText.substring(0, 200),
        locationText: '',
        preferredDate: '',
        preferredTimeWindow: '',
        urgency: 'unspecified',
        budgetSensitivity: 'unspecified',
        qualityPreference: 'unspecified',
        constraints: [],
        languageDetected: 'unknown',
        confidenceScore: 0,
        missingFields: ['AI could not parse response — please retry'],
        clarificationQuestion: 'Please try again.',
        normalizedEnglishSummary: rawText.substring(0, 100),
      },
      source: 'fallback',
      latencyMs: result.latencyMs,
      rawGeminiResponse: json.substring(0, 500),
    };
  }

  // Validate
  const issues = validateParsedRequest(parsed);
  if (issues.length > 0) {
    safeLog.warn('GeminiClient', `parseRequest: Validation issues: ${issues.join(', ')}`);
    // Patch missing fields with defaults rather than full fallback
    if (!parsed.missingFields) parsed.missingFields = [];
    if (!parsed.constraints) parsed.constraints = [];
    if (!parsed.confidenceScore) parsed.confidenceScore = 0.5;
  }

  return {
    parsed,
    source: 'gemini',
    latencyMs: result.latencyMs,
    rawGeminiResponse: json.substring(0, 500),
  };
}

/**
 * 2. Explain ranking decisions using Gemini.
 */
export async function explainRankingDecision(data: {
  serviceRequest: { serviceType: string; urgency: string; budget: string; location: string };
  candidates: Array<{ candidateId: string; name: string; rating: number; distance: string; isRegistered: boolean; baseVisitFee?: number }>;
}): Promise<{
  ranking: RankingExplanation;
  source: 'gemini' | 'fallback';
  latencyMs: number;
}> {
  const prompt = buildRankingPrompt(data.serviceRequest, data.candidates);
  const result = await callGemini(prompt, undefined, 'rankProviders');

  if (!result) {
    return {
      ranking: fallbackRanking(data.candidates.map((c) => ({
        ...c,
        distance: parseFloat(c.distance) || undefined,
      }))),
      source: 'fallback',
      latencyMs: 0,
    };
  }

  const json = extractJSON(result.text);
  const ranking = safeParseJSON<RankingExplanation>(json, 'rankProviders');

  if (!ranking) {
    return {
      ranking: fallbackRanking(data.candidates.map((c) => ({
        ...c,
        distance: parseFloat(c.distance) || undefined,
      }))),
      source: 'fallback',
      latencyMs: result.latencyMs,
    };
  }

  return { ranking, source: 'gemini', latencyMs: result.latencyMs };
}

/**
 * 3. Generate customer notification message.
 */
export async function generateCustomerMessage(data: {
  serviceType: string;
  providerName: string;
  timeSlot: string;
  location: string;
  messageType: 'booking_confirmed' | 'reminder' | 'provider_enroute' | 'completed';
}): Promise<{
  message: CustomerMessage;
  source: 'gemini' | 'fallback';
  latencyMs: number;
}> {
  const prompt = buildCustomerMessagePrompt(data);
  const result = await callGemini(prompt, undefined, 'customerMessage');

  if (!result) {
    return {
      message: fallbackCustomerMessage(data.serviceType, data.providerName),
      source: 'fallback',
      latencyMs: 0,
    };
  }

  const json = extractJSON(result.text);
  const message = safeParseJSON<CustomerMessage>(json, 'customerMessage');

  return {
    message: message || fallbackCustomerMessage(data.serviceType, data.providerName),
    source: message ? 'gemini' : 'fallback',
    latencyMs: result.latencyMs,
  };
}

/**
 * 4. Generate provider notification preview.
 */
export async function generateProviderMessagePreview(data: {
  serviceType: string;
  customerArea: string;
  issueDescription: string;
  urgency: string;
  timeSlot: string;
}): Promise<{
  message: ProviderMessage;
  source: 'gemini' | 'fallback';
  latencyMs: number;
}> {
  const prompt = buildProviderMessagePrompt(data);
  const result = await callGemini(prompt, undefined, 'providerMessage');

  if (!result) {
    return {
      message: fallbackProviderMessage(data.serviceType, data.customerArea),
      source: 'fallback',
      latencyMs: 0,
    };
  }

  const json = extractJSON(result.text);
  const message = safeParseJSON<ProviderMessage>(json, 'providerMessage');

  return {
    message: message || fallbackProviderMessage(data.serviceType, data.customerArea),
    source: message ? 'gemini' : 'fallback',
    latencyMs: result.latencyMs,
  };
}

/**
 * 5. Generate dispute resolution analysis.
 */
export async function generateDisputeResolutionMessage(data: {
  disputeType: string;
  description: string;
  estimateRange: { min: number; max: number };
  actualCharge?: number;
  serviceType: string;
}): Promise<{
  resolution: DisputeResolution;
  source: 'gemini' | 'fallback';
  latencyMs: number;
}> {
  const prompt = buildDisputePrompt(data);
  const result = await callGemini(prompt, undefined, 'disputeResolution');

  if (!result) {
    return {
      resolution: fallbackDisputeResolution(data.disputeType, data.description),
      source: 'fallback',
      latencyMs: 0,
    };
  }

  const json = extractJSON(result.text);
  const resolution = safeParseJSON<DisputeResolution>(json, 'disputeResolution');

  return {
    resolution: resolution || fallbackDisputeResolution(data.disputeType, data.description),
    source: resolution ? 'gemini' : 'fallback',
    latencyMs: result.latencyMs,
  };
}
