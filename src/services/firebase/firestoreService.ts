// src/services/firebase/firestoreService.ts
// Firestore read operations for mobile app
// Write operations go through backend API — mobile only reads
// SAFE: All operations guard against null firestore

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { ServiceRequest, Booking, AgentTrace, ProviderProfile } from '../../types';

/**
 * Check if Firestore is available
 */
function requireFirestore() {
  if (!firestore) {
    throw new Error('Firestore not initialized. Check Firebase configuration.');
  }
  return firestore;
}

/**
 * Get a service request by workflow ID
 */
export async function getServiceRequest(workflowId: string): Promise<ServiceRequest | null> {
  const db = requireFirestore();
  const docRef = doc(db, 'service_requests', workflowId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { ...snapshot.data(), workflowId: snapshot.id } as ServiceRequest;
}

/**
 * Get bookings for a user
 */
export async function getUserBookings(userId: string): Promise<Booking[]> {
  const db = requireFirestore();
  const q = query(
    collection(db, 'bookings'),
    where('customerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), bookingId: doc.id } as Booking));
}

/**
 * Get agent traces for a workflow
 */
export async function getAgentTraces(workflowId: string): Promise<AgentTrace[]> {
  const db = requireFirestore();
  const q = query(
    collection(db, 'agent_traces'),
    where('workflowId', '==', workflowId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), traceId: doc.id } as AgentTrace));
}

/**
 * Get registered provider profiles
 */
export async function getRegisteredProviders(
  serviceCategory?: string,
  area?: string
): Promise<ProviderProfile[]> {
  const db = requireFirestore();
  let q = query(
    collection(db, 'provider_profiles'),
    where('active', '==', true)
  );

  const snapshot = await getDocs(q);
  let providers = snapshot.docs.map(
    (doc) => ({ ...doc.data(), providerId: doc.id } as ProviderProfile)
  );

  // Client-side filter (Firestore doesn't support array-contains + where combo well)
  if (serviceCategory) {
    providers = providers.filter((p) => p.serviceCategories.includes(serviceCategory));
  }
  if (area) {
    providers = providers.filter((p) => p.serviceAreas.includes(area));
  }

  return providers;
}

/**
 * Listen to booking status changes in real-time
 */
export function onBookingChanged(
  bookingId: string,
  callback: (booking: Booking | null) => void
): Unsubscribe {
  const db = requireFirestore();
  const docRef = doc(db, 'bookings', bookingId);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ ...snapshot.data(), bookingId: snapshot.id } as Booking);
  });
}

/**
 * Test Firestore connection
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const db = requireFirestore();
    const testRef = doc(db, 'app_metrics', 'connection_test');
    await getDoc(testRef);
    return true;
  } catch (error) {
    console.error('[Firestore] Connection test failed:', error);
    return false;
  }
}
