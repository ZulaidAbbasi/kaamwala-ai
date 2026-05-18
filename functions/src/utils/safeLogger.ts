// functions/src/utils/safeLogger.ts
// Safe logging utility that redacts secrets, tokens, and sensitive data
// Use this instead of raw console.log in all backend code

/** Patterns that look like API keys or tokens */
const REDACT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /AIzaSy[A-Za-z0-9_-]{30,}/g, label: '[REDACTED_FIREBASE_KEY]' },
  { pattern: /sk-[A-Za-z0-9]{40,}/g, label: '[REDACTED_SK_KEY]' },
  { pattern: /ya29\.[A-Za-z0-9_-]{50,}/g, label: '[REDACTED_OAUTH_TOKEN]' },
  { pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, label: '[REDACTED_JWT]' },
  { pattern: /[A-Za-z0-9_-]{35,}/g, label: '[REDACTED_LONG_SECRET]' },
];

/** Fields that should never be logged */
const SENSITIVE_FIELDS = new Set([
  'apiKey', 'api_key', 'apikey',
  'secret', 'password', 'token',
  'authorization', 'credential',
  'phone', 'email', 'cnic',
  'geminiApiKey', 'googleMapsApiKey',
  'GEMINI_API_KEY', 'GOOGLE_MAPS_API_KEY',
]);

/**
 * Redact sensitive patterns from a string.
 */
function redactString(input: string): string {
  let result = input;
  for (const { pattern, label } of REDACT_PATTERNS) {
    // Reset regex lastIndex since we're reusing global patterns
    pattern.lastIndex = 0;
    result = result.replace(pattern, label);
  }
  return result;
}

/**
 * Deep-redact an object, replacing sensitive field values.
 */
function redactObject(obj: Record<string, any>, depth = 0): Record<string, any> {
  if (depth > 5) return { _truncated: true };

  const safe: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      safe[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      safe[key] = redactString(value);
    } else if (Array.isArray(value)) {
      safe[key] = value.map((item) =>
        typeof item === 'object' && item !== null ? redactObject(item, depth + 1) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      safe[key] = redactObject(value, depth + 1);
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Format a value for safe logging.
 */
function safeFormat(value: any): string {
  if (value === undefined || value === null) return String(value);
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(redactObject(value), null, 2);
    } catch {
      return '[Unserializable object]';
    }
  }
  return String(value);
}

/**
 * Safe logger — redacts secrets from all output.
 * Drop-in replacement for console.log/warn/error.
 */
export const safeLog = {
  info(tag: string, message: string, data?: any): void {
    const parts = [`[${tag}] ${message}`];
    if (data !== undefined) parts.push(safeFormat(data));
    console.log(parts.join(' | '));
  },

  warn(tag: string, message: string, data?: any): void {
    const parts = [`[${tag}] ⚠ ${message}`];
    if (data !== undefined) parts.push(safeFormat(data));
    console.warn(parts.join(' | '));
  },

  error(tag: string, message: string, error?: any): void {
    const parts = [`[${tag}] ❌ ${message}`];
    if (error instanceof Error) {
      parts.push(redactString(error.message));
    } else if (error !== undefined) {
      parts.push(safeFormat(error));
    }
    console.error(parts.join(' | '));
  },

  /** Log an API call (method, path, latency) without logging request body */
  apiCall(method: string, path: string, statusCode: number, latencyMs: number): void {
    console.log(`[API] ${method} ${path} → ${statusCode} (${latencyMs}ms)`);
  },
};
