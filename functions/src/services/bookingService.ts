// functions/src/services/bookingService.ts
// Booking creation — only confirmed for registered providers
// Creates real Firestore records, message previews only (no real dispatch)

import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { safeLog } from '../utils/safeLogger';
import {
  createCustomerConfirmationPreview,
  createProviderJobPreview,
  saveNotificationRecord,
  NotificationPreview,
} from './notifications/notificationService';


// ============================================================================
// Types
// ============================================================================

export type BookingStatus =
  | 'pending_provider_confirmation'
  | 'confirmed_internal'
  | 'onboarding_required'
  | 'cancelled'
  | 'completed'
  | 'failed';

export interface BookingRecord {
  bookingId: string;
  workflowId: string;
  customerUid: string;
  providerId: string | null;
  providerName: string;
  providerSource: string;
  serviceType: string;
  issueDescription: string;
  locationArea: string;
  requestedSlot: string;
  estimateLow: number;
  estimateHigh: number;
  recommendedEstimate: number;
  currency: string;
  status: BookingStatus;
  bookingNote: string;
  isRegisteredProvider: boolean;
  isRealBooking: boolean;
  customerMessagePreview: string;
  providerMessagePreview: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface BookingEvent {
  eventId: string;
  bookingId: string;
  workflowId: string;
  eventType: string;
  description: string;
  oldStatus: string | null;
  newStatus: BookingStatus;
  actor: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface BookingResult {
  bookingId: string;
  status: BookingStatus;
  statusLabel: string;
  bookingNote: string;
  isRealBooking: boolean;
  providerName: string;
  providerSource: string;
  serviceType: string;
  locationArea: string;
  requestedSlot: string;
  estimateLow: number;
  estimateHigh: number;
  recommendedEstimate: number;
  currency: string;
  customerMessagePreview: string;
  providerMessagePreview: string;
  notifications: NotificationPreview[];
  firestoreSaved: boolean;
  warnings: string[];
}

// ============================================================================
// Main Booking Function
// ============================================================================

export async function createBooking(input: {
  workflowId: string;
  customerUid: string;
  selectedProvider: {
    candidateId?: string;
    providerId?: string;
    name: string;
    bookingEligible?: boolean;
    isRegistered?: boolean;
    source?: string;
    bookingStatus?: string;
    distanceEstimateKm?: number | null;
    rawDataSummary?: any;
    factors?: any[];
  };
  parsedRequest: {
    serviceType: string;
    issueDescription?: string;
    locationText?: string;
    urgency?: string;
    preferredTimeWindow?: string;
  };
  priceEstimate?: {
    estimateLow: number;
    estimateHigh: number;
    recommendedEstimate: number;
    currency: string;
  };
  requestedSlot?: string;
}): Promise<BookingResult> {
  const warnings: string[] = [];
  const isRegistered = input.selectedProvider.bookingEligible ?? input.selectedProvider.isRegistered ?? false;
  const providerSource = input.selectedProvider.source ?? (isRegistered ? 'registered' : 'google_places');
  const bookingId = `book_${input.workflowId}_${Date.now()}`;
  const slot = input.requestedSlot || input.parsedRequest.preferredTimeWindow || 'unspecified';

  // ── 1. Determine booking status ───────────────────────────────────
  let status: BookingStatus;
  let statusLabel: string;
  let bookingNote: string;

  if (!isRegistered) {
    status = 'onboarding_required';
    statusLabel = 'Onboarding Required';
    bookingNote = 'This provider is discovered via Google Places but is not registered on KaamWala. Booking cannot be confirmed until the provider completes onboarding.';
    warnings.push('Provider not registered — booking is informational only.');
  } else {
    // Check availability if registered provider has schedule data
    const availability = input.selectedProvider.rawDataSummary?.availability;
    if (availability && slot !== 'unspecified') {
      const hasSlot = availability.timeSlots?.includes(slot);
      if (!hasSlot) {
        warnings.push(`Requested slot "${slot}" may not be available. Provider will confirm.`);
      }
    }

    status = 'pending_provider_confirmation';
    statusLabel = 'Pending Provider Confirmation';
    bookingNote = 'Booking created in our system. In production, the provider would receive a notification and confirm. For the demo, this booking is a real Firestore record showing the complete workflow.';
  }

  // ── 2. Generate bilingual message previews via notification service ─
  const customerMsg = createCustomerConfirmationPreview({
    bookingId,
    serviceType: input.parsedRequest.serviceType,
    providerName: input.selectedProvider.name,
    locationArea: input.parsedRequest.locationText || 'Islamabad',
    requestedSlot: slot,
    estimatedCost: input.priceEstimate?.recommendedEstimate,
    currency: input.priceEstimate?.currency || 'PKR',
    isRegistered,
  });

  const providerMsg = createProviderJobPreview({
    bookingId,
    serviceType: input.parsedRequest.serviceType,
    issueDescription: input.parsedRequest.issueDescription || 'Service needed',
    customerArea: input.parsedRequest.locationText || 'Islamabad',
    requestedSlot: slot,
    urgency: input.parsedRequest.urgency || 'standard',
    estimatedCost: input.priceEstimate?.recommendedEstimate,
    currency: input.priceEstimate?.currency || 'PKR',
  });

  // ── 3. Save booking to Firestore ──────────────────────────────────
  let firestoreSaved = false;

  const bookingRecord: BookingRecord = {
    bookingId,
    workflowId: input.workflowId,
    customerUid: input.customerUid,
    providerId: input.selectedProvider.providerId || input.selectedProvider.candidateId || null,
    providerName: input.selectedProvider.name,
    providerSource,
    serviceType: input.parsedRequest.serviceType,
    issueDescription: input.parsedRequest.issueDescription || '',
    locationArea: input.parsedRequest.locationText || 'Islamabad',
    requestedSlot: slot,
    estimateLow: input.priceEstimate?.estimateLow ?? 0,
    estimateHigh: input.priceEstimate?.estimateHigh ?? 0,
    recommendedEstimate: input.priceEstimate?.recommendedEstimate ?? 0,
    currency: input.priceEstimate?.currency || 'PKR',
    status,
    bookingNote,
    isRegisteredProvider: isRegistered,
    isRealBooking: isRegistered,
    customerMessagePreview: customerMsg.english,
    providerMessagePreview: providerMsg.english,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    await db.collection('bookings').doc(bookingId).set(bookingRecord);
    firestoreSaved = true;
    safeLog.info('BookingService', `Booking saved: ${bookingId} (${status})`);
  } catch (err: any) {
    safeLog.error('BookingService', 'Failed to save booking', err);
    warnings.push('Booking may not have been saved to Firestore.');
  }

  // ── 4. Save booking event ─────────────────────────────────────────
  const bookingEvent: BookingEvent = {
    eventId: `evt_${bookingId}_created`,
    bookingId,
    workflowId: input.workflowId,
    eventType: 'booking_created',
    description: isRegistered
      ? `Booking created for registered provider "${input.selectedProvider.name}".`
      : `Discovery booking logged for unregistered provider "${input.selectedProvider.name}". Onboarding required.`,
    oldStatus: null,
    newStatus: status,
    actor: 'system',
    createdAt: Timestamp.now(),
  };

  try {
    await db.collection('booking_events').doc(bookingEvent.eventId).set(bookingEvent);
  } catch (err: any) {
    safeLog.error('BookingService', 'Failed to save booking event', err);
    warnings.push('Booking event may not have been saved.');
  }

  // ── 5. Save notification records via notification service ─────────
  const notifications: NotificationPreview[] = [];

  const customerNotif = await saveNotificationRecord({
    workflowId: input.workflowId,
    bookingId,
    recipientType: 'customer',
    messageType: 'booking_confirmation',
    messageEnglish: customerMsg.english,
    messageRomanUrdu: customerMsg.romanUrdu,
  });
  notifications.push(customerNotif);

  const providerNotif = await saveNotificationRecord({
    workflowId: input.workflowId,
    bookingId,
    recipientType: 'provider',
    messageType: 'new_job_request',
    messageEnglish: providerMsg.english,
    messageRomanUrdu: providerMsg.romanUrdu,
  });
  notifications.push(providerNotif);

  return {
    bookingId,
    status,
    statusLabel,
    bookingNote,
    isRealBooking: isRegistered,
    providerName: input.selectedProvider.name,
    providerSource,
    serviceType: input.parsedRequest.serviceType,
    locationArea: input.parsedRequest.locationText || 'Islamabad',
    requestedSlot: slot,
    estimateLow: input.priceEstimate?.estimateLow ?? 0,
    estimateHigh: input.priceEstimate?.estimateHigh ?? 0,
    recommendedEstimate: input.priceEstimate?.recommendedEstimate ?? 0,
    currency: input.priceEstimate?.currency || 'PKR',
    customerMessagePreview: customerMsg.english,
    providerMessagePreview: providerMsg.english,
    notifications,
    firestoreSaved,
    warnings,
  };
}
