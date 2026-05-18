// src/services/backend/apiClient.ts
// Backend API client — all requests go through our Cloud Functions
// NEVER calls Google APIs directly from mobile app

import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../../config/api';
import { getAuthToken } from '../auth/authService';
import {
  ParseRequestResponse,
  DiscoverProvidersResponse,
  RankProvidersResponse,
  CreateBookingResponse,
  FallbackResponse,
  TracesResponse,
} from '../../types';

/**
 * Base fetch wrapper with auth token
 */
async function apiCall<T>(
  endpoint: string,
  options: {
    method: 'GET' | 'POST';
    body?: Record<string, any>;
  }
): Promise<T> {
  let token: string | undefined;
  try {
    token = await getAuthToken();
  } catch {
    // Allow unauthenticated calls for health check
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] ${options.method} ${endpoint}`);

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Parse a multilingual service request using Gemini (via backend)
 */
export async function parseRequest(
  rawText: string,
  userId?: string,
  workflowId?: string
): Promise<ParseRequestResponse> {
  return apiCall<ParseRequestResponse>(API_ENDPOINTS.PARSE_REQUEST, {
    method: 'POST',
    body: { rawText, userId, workflowId },
  });
}

/**
 * Discover real nearby providers using Google Places/Maps (via backend)
 */
export async function discoverProviders(
  workflowId: string,
  serviceCategory: string,
  location: { area: string; city: string },
  radiusMeters?: number
): Promise<DiscoverProvidersResponse> {
  return apiCall<DiscoverProvidersResponse>(API_ENDPOINTS.DISCOVER_PROVIDERS, {
    method: 'POST',
    body: {
      workflowId,
      parsedRequest: {
        serviceType: serviceCategory,
        locationText: location.area,
      },
    },
  });
}

/**
 * Rank discovered providers using Gemini multi-factor reasoning (via backend)
 */
export async function rankProviders(
  workflowId: string,
  userPreferences: { budget: string; urgency: string }
): Promise<RankProvidersResponse> {
  return apiCall<RankProvidersResponse>(API_ENDPOINTS.RANK_PROVIDERS, {
    method: 'POST',
    body: { workflowId, userPreferences },
  });
}

/**
 * Create a real booking for a REGISTERED provider only (via backend)
 */
export async function createBooking(params: {
  workflowId: string;
  customerId: string;
  providerId: string;
  serviceType: string;
  issueDescription: string;
  locationArea: string;
  requestedTimeWindow: string;
  priceEstimate: { min: number; max: number; currency: string };
}): Promise<CreateBookingResponse> {
  return apiCall<CreateBookingResponse>(API_ENDPOINTS.CREATE_BOOKING, {
    method: 'POST',
    body: params,
  });
}

/**
 * Handle provider cancellation and find fallback (via backend)
 */
export async function handleProviderCancelled(
  bookingId: string,
  cancellationReason: string
): Promise<FallbackResponse> {
  return apiCall<FallbackResponse>(API_ENDPOINTS.FALLBACK_PROVIDER_CANCELLED, {
    method: 'POST',
    body: { bookingId, cancellationReason },
  });
}

/**
 * Get agent traces for a workflow
 */
export async function getTraces(workflowId: string): Promise<TracesResponse> {
  return apiCall<TracesResponse>(`${API_ENDPOINTS.GET_TRACES}/${workflowId}`, {
    method: 'GET',
  });
}

/**
 * Health check — verify backend is reachable
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string; project?: string; apis?: any; missingConfig?: string[] }> {
  return apiCall<{ status: string; timestamp: string }>(API_ENDPOINTS.HEALTH, {
    method: 'GET',
  });
}
