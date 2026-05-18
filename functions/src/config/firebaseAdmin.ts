// functions/src/config/firebaseAdmin.ts
// Shared Firebase Admin initializer — ensures initializeApp() is called exactly once
// All modules that need Firestore must import from this file
// Uses modular Firebase Admin SDK imports to avoid premature initialization

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// Initialize only if no app exists yet
if (getApps().length === 0) {
  initializeApp();
}

/** Shared Firestore instance — safe to use at module level after init */
export const db = getFirestore();

/** Re-export Firestore types for use across the codebase */
export { Timestamp, FieldValue };
