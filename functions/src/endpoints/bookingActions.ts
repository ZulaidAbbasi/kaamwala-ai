// functions/src/endpoints/bookingActions.ts
// POST /acceptBooking, /rejectBooking, /completeBooking, /cancelBooking
// Provider lifecycle actions — real Firestore state transitions

import { Request, Response } from 'express';
import { db, Timestamp } from '../config/firebaseAdmin';
import { logTrace } from '../services/traceLogger';
import { safeLog } from '../utils/safeLogger';

type BookingStatus = 'pending_provider_confirmation' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'onboarding_required' | 'failed';

async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  actor: string,
  description: string
): Promise<{ success: boolean; oldStatus?: string; error?: string }> {
  try {
    const docRef = db.collection('bookings').doc(bookingId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: `Booking ${bookingId} not found.` };
    }

    const data = doc.data()!;
    const oldStatus = data.status;

    // Validate transition
    const validTransitions: Record<string, string[]> = {
      pending_provider_confirmation: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      rejected: [],
      cancelled: [],
      completed: [],
      onboarding_required: ['cancelled'],
    };

    if (!validTransitions[oldStatus]?.includes(newStatus)) {
      return { success: false, error: `Cannot transition from ${oldStatus} to ${newStatus}.` };
    }

    // Update booking
    await docRef.update({
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // Log booking event
    const eventId = `evt_${bookingId}_${newStatus}_${Date.now()}`;
    await db.collection('booking_events').doc(eventId).set({
      eventId,
      bookingId,
      workflowId: data.workflowId || '',
      eventType: `booking_${newStatus}`,
      description,
      oldStatus,
      newStatus,
      actor,
      createdAt: Timestamp.now(),
    });

    // Log trace
    await logTrace({
      workflowId: data.workflowId || bookingId,
      agentName: 'Booking_Agent',
      phase: 'action',
      observation: `Booking ${bookingId} status changed: ${oldStatus} → ${newStatus}.`,
      reasoningSummary: description,
      decision: `Status updated to ${newStatus} by ${actor}.`,
      actionTaken: `booking_${newStatus}`,
      toolUsed: 'firestore',
      confidence: 1.0,
      latencyMs: 0,
    });

    safeLog.info('BookingActions', `Booking ${bookingId}: ${oldStatus} → ${newStatus} by ${actor}`);
    return { success: true, oldStatus };
  } catch (err: any) {
    safeLog.error('BookingActions', `Failed to update booking ${bookingId}`, err);
    return { success: false, error: err.message };
  }
}

/**
 * POST /acceptBooking — Provider accepts a pending booking
 */
export async function handleAcceptBooking(req: Request, res: Response): Promise<void> {
  const { bookingId } = req.body;
  if (!bookingId) { res.status(400).json({ success: false, error: 'bookingId is required.' }); return; }

  const result = await updateBookingStatus(bookingId, 'confirmed', 'provider', 'Provider accepted the booking request.');
  if (!result.success) { res.status(400).json({ success: false, error: result.error }); return; }

  res.json({ success: true, bookingId, oldStatus: result.oldStatus, newStatus: 'confirmed', message: 'Booking confirmed by provider.' });
}

/**
 * POST /rejectBooking — Provider rejects a pending booking
 */
export async function handleRejectBooking(req: Request, res: Response): Promise<void> {
  const { bookingId, reason } = req.body;
  if (!bookingId) { res.status(400).json({ success: false, error: 'bookingId is required.' }); return; }

  const result = await updateBookingStatus(bookingId, 'rejected', 'provider', reason || 'Provider rejected the booking request.');
  if (!result.success) { res.status(400).json({ success: false, error: result.error }); return; }

  res.json({ success: true, bookingId, oldStatus: result.oldStatus, newStatus: 'rejected', message: 'Booking rejected by provider.' });
}

/**
 * POST /cancelBooking — Either party cancels a booking
 */
export async function handleCancelBooking(req: Request, res: Response): Promise<void> {
  const { bookingId, actor, reason } = req.body;
  if (!bookingId) { res.status(400).json({ success: false, error: 'bookingId is required.' }); return; }

  const result = await updateBookingStatus(bookingId, 'cancelled', actor || 'user', reason || 'Booking cancelled.');
  if (!result.success) { res.status(400).json({ success: false, error: result.error }); return; }

  res.json({ success: true, bookingId, oldStatus: result.oldStatus, newStatus: 'cancelled', message: 'Booking cancelled.' });
}

/**
 * POST /completeBooking — Mark booking as completed after service delivery
 */
export async function handleCompleteBooking(req: Request, res: Response): Promise<void> {
  const { bookingId } = req.body;
  if (!bookingId) { res.status(400).json({ success: false, error: 'bookingId is required.' }); return; }

  const result = await updateBookingStatus(bookingId, 'completed', 'provider', 'Service completed successfully.');
  if (!result.success) { res.status(400).json({ success: false, error: result.error }); return; }

  res.json({ success: true, bookingId, oldStatus: result.oldStatus, newStatus: 'completed', message: 'Booking marked as completed.' });
}

/**
 * GET /bookings — List bookings, optionally filtered by status or providerId
 */
export async function handleListBookings(req: Request, res: Response): Promise<void> {
  const { status, providerId } = req.query;
  try {
    let query: FirebaseFirestore.Query = db.collection('bookings');
    if (status) query = query.where('status', '==', status);
    if (providerId) query = query.where('providerId', '==', providerId);

    const snap = await query.orderBy('createdAt', 'desc').limit(20).get();
    const bookings = snap.docs.map(d => {
      const data = d.data();
      return {
        bookingId: data.bookingId,
        providerName: data.providerName,
        providerSource: data.providerSource,
        serviceType: data.serviceType,
        issueDescription: data.issueDescription || '',
        locationArea: data.locationArea,
        requestedSlot: data.requestedSlot,
        status: data.status,
        isRealBooking: data.isRealBooking,
        recommendedEstimate: data.recommendedEstimate,
        currency: data.currency,
        bookingNote: data.bookingNote || '',
        customerMessagePreview: data.customerMessagePreview || '',
        createdAt: data.createdAt,
      };
    });

    res.json({ success: true, bookings, total: bookings.length });
  } catch (err: any) {
    safeLog.error('ListBookings', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
