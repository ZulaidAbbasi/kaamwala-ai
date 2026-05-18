// src/config/api.ts
// Backend API configuration
// Mobile app calls OUR backend — never Google APIs directly

/**
 * Backend API base URL
 * Points to Firebase Cloud Functions
 * Checks both env var names for compatibility, falls back to production URL
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_BACKEND_BASE_URL ||
  'https://api-zbyomuiceq-uc.a.run.app';

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  PARSE_REQUEST: '/parseRequest',
  DISCOVER_PROVIDERS: '/discoverProviders',
  RANK_PROVIDERS: '/rankProviders',
  ESTIMATE_PRICE: '/estimatePrice',
  CREATE_BOOKING: '/createBooking',
  SIMULATE_FOLLOW_UP: '/simulateFollowUp',
  FALLBACK_PROVIDER_CANCELLED: '/simulateProviderCancellation',
  RESOLVE_DISPUTE: '/resolveDispute',
  HANDLE_NO_PROVIDER: '/handleNoProviderFound',
  HANDLE_LOW_CONFIDENCE: '/handleLowConfidenceRequest',
  RUN_WORKFLOW: '/runWorkflow',
  EVALUATE_OUTCOME: '/evaluateOutcome',
  DIAGNOSTICS: '/diagnostics',
  GET_WORKFLOW: '/workflow', // Append /:workflowId
  GET_TRACES: '/traces', // Append /:workflowId
  HEALTH: '/health',
  // Booking lifecycle
  ACCEPT_BOOKING: '/acceptBooking',
  REJECT_BOOKING: '/rejectBooking',
  CANCEL_BOOKING: '/cancelBooking',
  COMPLETE_BOOKING: '/completeBooking',
  LIST_BOOKINGS: '/bookings',
  // Provider management
  SEED_PROVIDERS: '/seedDemoProviders',
  LIST_PROVIDERS: '/providers',
} as const;

/**
 * Build full URL for an endpoint
 */
export function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  return url;
}
