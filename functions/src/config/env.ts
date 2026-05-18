// functions/src/config/env.ts
// Secure environment variable loader for Cloud Functions
// Reads from process.env (populated by functions/.env or Secret Manager)
// NEVER logs or returns actual secret values

interface EnvConfig {
  /** Gemini API key — SECRET */
  geminiApiKey: string;
  /** Google Maps/Places API key — SECRET */
  googleMapsApiKey: string;
  /** Firebase project ID — not secret */
  firebaseProjectId: string;
}

interface EnvHealthStatus {
  geminiKeyPresent: boolean;
  geminiKeyPreview: string;
  mapsKeyPresent: boolean;
  mapsKeyPreview: string;
  projectId: string;
}

/**
 * Mask a secret value for safe display in health checks.
 * Shows first 4 chars + "****" + last 2 chars.
 * Returns "(not set)" if empty.
 */
function maskSecret(value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    return '(not set)';
  }
  if (value.length <= 8) {
    return value.substring(0, 2) + '****';
  }
  return value.substring(0, 4) + '****' + value.substring(value.length - 2);
}

/**
 * Load and validate all required environment variables.
 * Throws on startup if critical secrets are missing.
 */
function loadEnv(): EnvConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const firebaseProjectId = process.env.KAAMWALA_PROJECT_ID || process.env.GCLOUD_PROJECT || 'kaamwala-ai';

  return {
    geminiApiKey,
    googleMapsApiKey,
    firebaseProjectId,
  };
}

/**
 * Validate that required secrets are present.
 * Returns list of missing variable names.
 */
export function validateEnv(): string[] {
  const missing: string[] = [];
  const config = loadEnv();

  if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');
  if (!config.googleMapsApiKey) missing.push('GOOGLE_MAPS_API_KEY');

  return missing;
}

/**
 * Get the full config. Only call from backend endpoint handlers.
 * NEVER pass this object to a response or log it.
 */
export function getEnvConfig(): EnvConfig {
  return loadEnv();
}

/**
 * Get safe health status for the /health endpoint.
 * Shows only boolean presence and masked previews — no full secrets.
 */
export function getEnvHealthStatus(): EnvHealthStatus {
  const config = loadEnv();
  return {
    geminiKeyPresent: config.geminiApiKey.length > 0,
    geminiKeyPreview: maskSecret(config.geminiApiKey),
    mapsKeyPresent: config.googleMapsApiKey.length > 0,
    mapsKeyPreview: maskSecret(config.googleMapsApiKey),
    projectId: config.firebaseProjectId,
  };
}
