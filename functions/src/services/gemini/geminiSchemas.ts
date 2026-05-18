// functions/src/services/gemini/geminiSchemas.ts
// Strict JSON schemas for all Gemini outputs
// Used for validation and fallback generation

/**
 * Parsed service request output from Gemini NLU.
 */
export interface ParsedServiceRequest {
  serviceType: string;
  issueDescription: string;
  locationText: string;
  preferredDate: string;
  preferredTimeWindow: string;
  urgency: 'emergency' | 'today' | 'tomorrow_morning' | 'tomorrow' | 'this_week' | 'flexible' | 'unspecified';
  budgetSensitivity: 'low' | 'medium' | 'high' | 'unspecified';
  qualityPreference: 'budget' | 'balanced' | 'premium' | 'unspecified';
  constraints: string[];
  languageDetected: 'urdu' | 'roman_urdu' | 'english' | 'mixed' | 'unknown';
  confidenceScore: number;
  missingFields: string[];
  clarificationQuestion: string;
  normalizedEnglishSummary: string;
}

/**
 * Ranking explanation output from Gemini.
 */
export interface RankingExplanation {
  rankedProviders: RankedProviderExplanation[];
  overallReasoning: string;
  baselineComparison: string;
}

export interface RankedProviderExplanation {
  candidateId: string;
  rank: number;
  score: number;
  reasoning: string;
  factors: {
    distance: { score: number; detail: string };
    rating: { score: number; detail: string };
    relevance: { score: number; detail: string };
    budgetFit: { score: number; detail: string };
  };
}

/**
 * Customer-facing message output from Gemini.
 */
export interface CustomerMessage {
  subject: string;
  body: string;
  tone: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'in_app';
}

/**
 * Provider notification preview from Gemini.
 */
export interface ProviderMessage {
  subject: string;
  body: string;
  urgencyLabel: string;
  actionRequired: string;
}

/**
 * Dispute resolution analysis from Gemini.
 */
export interface DisputeResolution {
  analysis: string;
  suggestedResolution: string;
  fairnessScore: number;
  escalationNeeded: boolean;
  customerMessage: string;
  providerMessage: string;
}

/**
 * Required fields for ParsedServiceRequest — used for validation.
 */
export const PARSED_REQUEST_REQUIRED_FIELDS: (keyof ParsedServiceRequest)[] = [
  'serviceType',
  'issueDescription',
  'locationText',
  'urgency',
  'budgetSensitivity',
  'languageDetected',
  'confidenceScore',
  'normalizedEnglishSummary',
];

/**
 * Validate a parsed service request object.
 * Returns list of issues found.
 */
export function validateParsedRequest(obj: any): string[] {
  const issues: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return ['Response is not a valid object'];
  }

  for (const field of PARSED_REQUEST_REQUIRED_FIELDS) {
    if (obj[field] === undefined || obj[field] === null) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  if (typeof obj.confidenceScore === 'number') {
    if (obj.confidenceScore < 0 || obj.confidenceScore > 1) {
      issues.push('confidenceScore must be between 0 and 1');
    }
  }

  const validUrgencies = ['emergency', 'today', 'tomorrow_morning', 'tomorrow', 'this_week', 'flexible', 'unspecified'];
  if (obj.urgency && !validUrgencies.includes(obj.urgency)) {
    issues.push(`Invalid urgency: ${obj.urgency}`);
  }

  const validBudgets = ['low', 'medium', 'high', 'unspecified'];
  if (obj.budgetSensitivity && !validBudgets.includes(obj.budgetSensitivity)) {
    issues.push(`Invalid budgetSensitivity: ${obj.budgetSensitivity}`);
  }

  const validLanguages = ['urdu', 'roman_urdu', 'english', 'mixed', 'unknown'];
  if (obj.languageDetected && !validLanguages.includes(obj.languageDetected)) {
    issues.push(`Invalid languageDetected: ${obj.languageDetected}`);
  }

  if (!Array.isArray(obj.missingFields)) {
    issues.push('missingFields must be an array');
  }

  if (!Array.isArray(obj.constraints)) {
    issues.push('constraints must be an array');
  }

  return issues;
}
