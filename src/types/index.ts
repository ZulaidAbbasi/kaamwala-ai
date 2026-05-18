// src/types/index.ts
// Core type definitions for KaamWala AI

import { AGENT_PHASES, BOOKING_STATUSES } from '../config/constants';

// ============================================================================
// Service Request Types
// ============================================================================

export interface ParsedRequest {
  serviceType: string;
  serviceCategory: string;
  location: {
    area: string;
    city: string;
    raw: string;
  };
  urgency: string;
  budget: string;
  issueDescription: string;
  languageDetected: string;
  confidence: number;
}

export interface ServiceRequest {
  workflowId: string;
  userId: string;
  rawText: string;
  parsed: ParsedRequest;
  status: 'parsed' | 'discovering' | 'ranked' | 'booked' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Provider Types
// ============================================================================

export interface ProviderProfile {
  providerId: string;
  ownerUserId: string;
  businessName: string;
  serviceCategories: string[];
  serviceAreas: string[];
  contactEmail: string;
  contactPhone?: string;
  verified: boolean;
  active: boolean;
  availability: {
    days: string[];
    timeSlots: string[];
  };
  baseVisitFee: number;
  ratingInternal: number;
  completedJobs: number;
  cancellationCount: number;
  location: {
    area: string;
    city: string;
    lat: number;
    lng: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderCandidate {
  candidateId: string;
  source: 'google_places' | 'registered';
  placeId?: string;
  registeredProviderId?: string;
  name: string;
  rating: number;
  totalRatings: number;
  address: string;
  distance: { text: string; meters: number };
  duration: { text: string; seconds: number };
  isRegistered: boolean;
}

export interface RankedProvider {
  rank: number;
  candidateId: string;
  name: string;
  isRegistered: boolean;
  bookable: boolean;
  bookingNote?: string;
  score: number;
  reasoning: string;
  priceEstimate?: {
    min: number;
    max: number;
    currency: string;
    factors: string[];
  };
}

// ============================================================================
// Booking Types
// ============================================================================

export type BookingStatus = typeof BOOKING_STATUSES[number];

export interface Booking {
  bookingId: string;
  workflowId: string;
  customerId: string;
  providerId: string;
  serviceType: string;
  issueDescription: string;
  locationArea: string;
  requestedTimeWindow: string;
  confirmedSlot: string;
  status: BookingStatus;
  priceEstimate: { min: number; max: number; currency: string };
  providerAccepted: boolean;
  cancellationReason?: string;
  fallbackBookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingEvent {
  eventId: string;
  bookingId: string;
  workflowId: string;
  eventType: string;
  previousStatus: string;
  newStatus: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// Agent Trace Types
// ============================================================================

export type AgentPhase = typeof AGENT_PHASES[number];

export interface AgentTrace {
  traceId: string;
  workflowId: string;
  agentName: string;
  phase: AgentPhase;
  observation: string;
  reasoningSummary: string;
  decision: string;
  actionTaken: string;
  toolUsed: string;
  stateBefore: Record<string, any>;
  stateAfter: Record<string, any>;
  confidence: number;
  latencyMs: number;
  error?: string;
  recoveryAction?: string;
  createdAt: Date;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  notificationId: string;
  bookingId: string;
  recipientType: 'provider' | 'customer';
  recipientId: string;
  channel: 'email' | 'sms' | 'whatsapp';
  status: 'sent' | 'preview_only' | 'failed';
  subject?: string;
  body: string;
  preview?: {
    subject: string;
    body: string;
  };
  sentAt?: Date;
  createdAt: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ParseRequestResponse {
  success: boolean;
  workflowId: string;
  requestId: string;
  parsedRequest: {
    serviceType: string;
    issueDescription: string;
    locationText: string;
    preferredDate: string;
    preferredTimeWindow: string;
    urgency: string;
    budgetSensitivity: string;
    qualityPreference: string;
    constraints: string[];
    languageDetected: string;
    confidenceScore: number;
    missingFields: string[];
    clarificationQuestion: string;
    normalizedEnglishSummary: string;
  };
  source: 'gemini' | 'fallback';
  traces: any[];
  warnings: string[];
  latencyMs: number;
  error?: { code: string; message: string };
}

export interface DiscoverProvidersResponse {
  workflowId: string;
  geocoded: { lat: number; lng: number; formattedAddress: string };
  candidates: ProviderCandidate[];
  totalGoogleResults: number;
  totalRegisteredResults: number;
}

export interface RankProvidersResponse {
  workflowId: string;
  ranked: RankedProvider[];
  baselineComparison: { withoutAI: string; withAI: string };
}

export interface CreateBookingResponse {
  bookingId: string;
  workflowId: string;
  status: BookingStatus;
  provider: { name: string; isRegistered: boolean };
  confirmedSlot: string;
  message: string;
}

export interface FallbackResponse {
  originalBookingId: string;
  originalBookingStatus: string;
  fallback: {
    newBookingId: string;
    providerId: string;
    providerName: string;
    reasoning: string;
    status: BookingStatus;
  };
  recoveryTrace: {
    phase: string;
    actionTaken: string;
  };
}

export interface TracesResponse {
  workflowId: string;
  traces: AgentTrace[];
  totalSteps: number;
  totalLatencyMs: number;
}

// ============================================================================
// API Setup Status
// ============================================================================

export interface ApiSetupStatus {
  firebase: { connected: boolean; error?: string };
  auth: { connected: boolean; userId?: string; error?: string };
  backend: { reachable: boolean; url: string; error?: string };
  gemini: { available: boolean; error?: string };
  places: { available: boolean; error?: string };
}
