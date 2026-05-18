// src/config/firebase.ts
// Firebase client configuration for React Native Expo
// Uses EXPO_PUBLIC_ env vars (non-secret client config)
// SAFE: Never crashes at import time — validates config first

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore - getReactNativePersistence exists in firebase/auth
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase client configuration
 * These are NON-SECRET client identifiers — safe for mobile app.
 * Secret API keys (Gemini, Maps) are in the backend ONLY.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

/**
 * Check if Firebase config has the minimum required values
 */
export function isFirebaseConfigValid(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

/**
 * Get diagnostic info about Firebase config (no secrets exposed)
 */
export function getFirebaseConfigDiagnostics(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.appId) missing.push('EXPO_PUBLIC_FIREBASE_APP_ID');
  return { valid: missing.length === 0, missing };
}

// Initialize Firebase (singleton pattern) — SAFE: never throws
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let initError: string | null = null;

function initializeFirebase() {
  // Guard: don't initialize with empty config
  if (!isFirebaseConfigValid()) {
    initError = 'Firebase config missing. Check .env or EAS build env variables.';
    console.warn('[Firebase]', initError);
    return;
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);

      // Initialize Auth with AsyncStorage persistence for React Native
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      app = getApp();
      auth = getAuth(app);
    }

    db = getFirestore(app);
  } catch (e: any) {
    initError = e.message || 'Firebase initialization failed';
    console.error('[Firebase] Init error:', initError);
  }
}

// Run initialization (safe — never throws)
initializeFirebase();

export const firebaseApp: FirebaseApp | null = app;
export const firestore: Firestore | null = db;
export const firebaseAuth: Auth | null = auth;
export const firebaseInitError: string | null = initError;
export default { app, db, auth, initError };

