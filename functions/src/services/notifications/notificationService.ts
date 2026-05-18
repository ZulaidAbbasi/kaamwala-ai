// functions/src/services/notifications/notificationService.ts
// Notification preview generator + Firestore record writer
// NEVER sends real SMS/WhatsApp. Preview-only unless opted-in provider configured.

import { db, Timestamp, FieldValue } from '../../config/firebaseAdmin';
import { safeLog } from '../../utils/safeLogger';


// ============================================================================
// Types
// ============================================================================

export type NotificationChannel = 'preview' | 'email' | 'sms' | 'whatsapp';
export type NotificationStatus = 'preview_only' | 'queued' | 'sent' | 'failed';
export type RecipientType = 'customer' | 'provider' | 'admin';

export interface NotificationRecord {
  notificationId: string;
  workflowId: string;
  bookingId: string;
  recipientType: RecipientType;
  channel: NotificationChannel;
  messageType: string;
  messageEnglish: string;
  messageRomanUrdu: string;
  status: NotificationStatus;
  simulation: boolean;
  deliveredAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface NotificationPreview {
  notificationId: string;
  recipientType: RecipientType;
  channel: NotificationChannel;
  messageType: string;
  messageEnglish: string;
  messageRomanUrdu: string;
  status: NotificationStatus;
  simulation: boolean;
  labels: string[];
}

// ============================================================================
// Preview Generators
// ============================================================================

/**
 * Customer booking confirmation preview.
 */
export function createCustomerConfirmationPreview(data: {
  bookingId: string;
  serviceType: string;
  providerName: string;
  locationArea: string;
  requestedSlot: string;
  estimatedCost?: number;
  currency?: string;
  isRegistered: boolean;
}): { english: string; romanUrdu: string } {
  const cost = data.estimatedCost
    ? `Estimated cost: ${data.currency || 'PKR'} ${data.estimatedCost.toLocaleString()}`
    : 'Cost will be confirmed by provider';

  let english: string;
  let romanUrdu: string;

  if (data.isRegistered) {
    english = [
      `🔔 KaamWala AI — Booking Confirmation`,
      ``,
      `✅ Your ${data.serviceType} booking has been created!`,
      ``,
      `Booking ID: ${data.bookingId}`,
      `Provider: ${data.providerName}`,
      `Location: ${data.locationArea}`,
      `Time: ${data.requestedSlot}`,
      `${cost}`,
      ``,
      `The provider will confirm your booking shortly.`,
      `We'll notify you when they accept.`,
      ``,
      `— KaamWala AI`,
    ].join('\n');

    romanUrdu = [
      `🔔 KaamWala AI — Booking ki Tasdeeq`,
      ``,
      `✅ Aap ki ${data.serviceType} booking ban gayi hai!`,
      ``,
      `Booking ID: ${data.bookingId}`,
      `Provider: ${data.providerName}`,
      `Jagah: ${data.locationArea}`,
      `Waqt: ${data.requestedSlot}`,
      `${cost}`,
      ``,
      `Provider jald tasdeeq karey ga.`,
      `Hum aapko notify karain gey.`,
      ``,
      `— KaamWala AI`,
    ].join('\n');
  } else {
    english = [
      `📋 KaamWala AI — Provider Found`,
      ``,
      `We found "${data.providerName}" for your ${data.serviceType} request.`,
      ``,
      `⚠️ This provider is not yet registered on KaamWala.`,
      `We've saved your request and will notify you when they join.`,
      ``,
      `Location: ${data.locationArea}`,
      `Time: ${data.requestedSlot}`,
      ``,
      `— KaamWala AI`,
    ].join('\n');

    romanUrdu = [
      `📋 KaamWala AI — Provider Mila`,
      ``,
      `"${data.providerName}" mil gaya hai aap ki ${data.serviceType} request ke liye.`,
      ``,
      `⚠️ Yeh provider abhi KaamWala par registered nahi hai.`,
      `Aap ki request save ho gayi hai. Jab register ho ga, hum notify karain gey.`,
      ``,
      `Jagah: ${data.locationArea}`,
      `Waqt: ${data.requestedSlot}`,
      ``,
      `— KaamWala AI`,
    ].join('\n');
  }

  return { english, romanUrdu };
}

/**
 * Provider new job notification preview.
 */
export function createProviderJobPreview(data: {
  bookingId: string;
  serviceType: string;
  issueDescription: string;
  customerArea: string;
  requestedSlot: string;
  urgency: string;
  estimatedCost?: number;
  currency?: string;
}): { english: string; romanUrdu: string } {
  const english = [
    `🔧 KaamWala AI — New Job Request`,
    ``,
    `You have a new service request!`,
    ``,
    `Booking ID: ${data.bookingId}`,
    `Service: ${data.serviceType}`,
    `Issue: ${data.issueDescription}`,
    `Area: ${data.customerArea}`,
    `Preferred time: ${data.requestedSlot}`,
    `Urgency: ${data.urgency}`,
    data.estimatedCost ? `Estimated value: ${data.currency || 'PKR'} ${data.estimatedCost.toLocaleString()}` : '',
    ``,
    `Reply ACCEPT to confirm or DECLINE to pass.`,
    ``,
    `— KaamWala AI Platform`,
  ].filter(Boolean).join('\n');

  const romanUrdu = [
    `🔧 KaamWala AI — Naya Kaam`,
    ``,
    `Aap ke liye naya kaam aaya hai!`,
    ``,
    `Booking ID: ${data.bookingId}`,
    `Service: ${data.serviceType}`,
    `Masla: ${data.issueDescription}`,
    `Jagah: ${data.customerArea}`,
    `Waqt: ${data.requestedSlot}`,
    `Zaroorat: ${data.urgency}`,
    data.estimatedCost ? `Andaza qeemat: ${data.currency || 'PKR'} ${data.estimatedCost.toLocaleString()}` : '',
    ``,
    `QABOOL karain ya NAHI karain jawab dein.`,
    ``,
    `— KaamWala AI Platform`,
  ].filter(Boolean).join('\n');

  return { english, romanUrdu };
}

/**
 * Cancellation apology preview (sent to customer when provider cancels).
 */
export function createCancellationApologyPreview(data: {
  bookingId: string;
  serviceType: string;
  providerName: string;
  reason?: string;
  fallbackProviderName?: string;
}): { english: string; romanUrdu: string } {
  const hasReplacement = !!data.fallbackProviderName;

  const english = [
    `⚠️ KaamWala AI — Booking Update`,
    ``,
    `We're sorry — "${data.providerName}" has cancelled your ${data.serviceType} booking.`,
    data.reason ? `Reason: ${data.reason}` : '',
    ``,
    hasReplacement
      ? `✅ Good news! We've found a replacement: "${data.fallbackProviderName}".`
      : `We're searching for a replacement provider. We'll notify you shortly.`,
    ``,
    `Booking ID: ${data.bookingId}`,
    `We apologize for the inconvenience.`,
    ``,
    `— KaamWala AI`,
  ].filter(Boolean).join('\n');

  const romanUrdu = [
    `⚠️ KaamWala AI — Booking Update`,
    ``,
    `Maafi chahte hain — "${data.providerName}" ne aap ki ${data.serviceType} booking cancel kar di.`,
    data.reason ? `Wajah: ${data.reason}` : '',
    ``,
    hasReplacement
      ? `✅ Acchi khabar! Humne dosra provider dhundh liya: "${data.fallbackProviderName}".`
      : `Hum dosra provider dhundh rahe hain. Jald notify karain gey.`,
    ``,
    `Booking ID: ${data.bookingId}`,
    `Takleef ke liye maafi.`,
    ``,
    `— KaamWala AI`,
  ].filter(Boolean).join('\n');

  return { english, romanUrdu };
}

/**
 * Dispute resolution message preview.
 */
export function createDisputeMessagePreview(data: {
  bookingId: string;
  serviceType: string;
  disputeType: string;
  resolutionSummary: string;
  compensationOffered?: string;
}): { english: string; romanUrdu: string } {
  const english = [
    `⚖️ KaamWala AI — Dispute Resolution`,
    ``,
    `Regarding your ${data.serviceType} booking (${data.bookingId}):`,
    ``,
    `Issue: ${data.disputeType}`,
    `Resolution: ${data.resolutionSummary}`,
    data.compensationOffered ? `Compensation: ${data.compensationOffered}` : '',
    ``,
    `If you need further assistance, please contact support.`,
    ``,
    `— KaamWala AI`,
  ].filter(Boolean).join('\n');

  const romanUrdu = [
    `⚖️ KaamWala AI — Masla Hal`,
    ``,
    `Aap ki ${data.serviceType} booking (${data.bookingId}) ke baare mein:`,
    ``,
    `Masla: ${data.disputeType}`,
    `Hal: ${data.resolutionSummary}`,
    data.compensationOffered ? `Muavza: ${data.compensationOffered}` : '',
    ``,
    `Mazeed madad ke liye support se rabta karain.`,
    ``,
    `— KaamWala AI`,
  ].filter(Boolean).join('\n');

  return { english, romanUrdu };
}

// ============================================================================
// Firestore Record Writer
// ============================================================================

/**
 * Save a notification record to Firestore.
 * NEVER dispatches real messages — always preview_only unless explicitly configured.
 */
export async function saveNotificationRecord(data: {
  workflowId: string;
  bookingId: string;
  recipientType: RecipientType;
  messageType: string;
  messageEnglish: string;
  messageRomanUrdu: string;
}): Promise<NotificationPreview> {
  const notificationId = `notif_${data.bookingId}_${data.recipientType}_${Date.now()}`;

  const record: NotificationRecord = {
    notificationId,
    workflowId: data.workflowId,
    bookingId: data.bookingId,
    recipientType: data.recipientType,
    channel: 'preview',
    messageType: data.messageType,
    messageEnglish: data.messageEnglish,
    messageRomanUrdu: data.messageRomanUrdu,
    status: 'preview_only',
    simulation: true,
    deliveredAt: null,
    createdAt: Timestamp.now(),
  };

  try {
    await db.collection('notifications').doc(notificationId).set(record);
    safeLog.info('NotificationService', `Notification saved: ${notificationId} (${data.recipientType}, ${data.messageType})`);
  } catch (err: any) {
    safeLog.error('NotificationService', 'Failed to save notification', err);
  }

  return {
    notificationId,
    recipientType: data.recipientType,
    channel: 'preview',
    messageType: data.messageType,
    messageEnglish: data.messageEnglish,
    messageRomanUrdu: data.messageRomanUrdu,
    status: 'preview_only',
    simulation: true,
    labels: [
      'Preview only — no real message sent',
      'No SMS/WhatsApp dispatched',
      'Opted-in provider required for real notification',
    ],
  };
}

// ============================================================================
// Email-Ready Abstraction (for future use)
// ============================================================================

/**
 * Placeholder for future email delivery.
 * Currently returns preview-only status.
 * When configured, this would use SendGrid/Mailgun/etc.
 */
export async function sendEmailNotification(_data: {
  recipientEmail: string;
  subject: string;
  body: string;
}): Promise<{ sent: boolean; reason: string }> {
  // NEVER send real emails in the demo
  safeLog.info('NotificationService', 'Email delivery requested — returning preview-only (no email provider configured)');

  return {
    sent: false,
    reason: 'Email provider not configured. This is a preview-only notification system.',
  };
}
