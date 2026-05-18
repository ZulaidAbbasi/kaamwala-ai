// src/services/auth/authService.ts
// Firebase Anonymous Authentication service
// SAFE: Handles missing Firebase config gracefully

import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth, firebaseInitError } from '../../config/firebase';

/**
 * Sign in anonymously — creates a temporary user ID
 * Used for hackathon demo. Can be upgraded to email/phone auth later.
 */
export async function signInAnonymous(): Promise<User> {
  if (!firebaseAuth) {
    throw new Error(
      firebaseInitError || 'Firebase Auth not initialized. Check your .env configuration.'
    );
  }

  try {
    const result = await signInAnonymously(firebaseAuth);
    console.log('[Auth] Signed in anonymously:', result.user.uid.substring(0, 8) + '...');
    return result.user;
  } catch (error: any) {
    console.error('[Auth] Anonymous sign-in failed:', error.message);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return firebaseAuth?.currentUser ?? null;
}

/**
 * Get current user ID (or throw if not authenticated)
 */
export function getCurrentUserId(): string {
  const user = firebaseAuth?.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.uid;
}

/**
 * Listen for auth state changes
 */
export function onAuthChanged(callback: (user: User | null) => void): () => void {
  if (!firebaseAuth) {
    // If auth is not initialized, immediately call with null and return no-op unsubscribe
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, callback);
}

/**
 * Get auth token for backend API calls
 */
export async function getAuthToken(): Promise<string> {
  const user = firebaseAuth?.currentUser;
  if (!user) {
    throw new Error('User not authenticated — cannot get auth token');
  }
  return user.getIdToken();
}
