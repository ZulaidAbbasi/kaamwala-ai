// functions/src/endpoints/diagnostics.ts
// POST /diagnostics — Runs individual or all backend service tests
// Never exposes secrets. Returns status, latency, message, warning.

import { Request, Response } from 'express';
import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { safeLog } from '../utils/safeLogger';


interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  latencyMs: number;
  message: string;
  warning?: string;
  hint?: string;
}

export async function handleDiagnostics(req: Request, res: Response): Promise<void> {
  const { tests } = req.body;
  // tests can be: 'all' | string[] of test names
  const requested: string[] = tests === 'all' || !tests
    ? ['gemini_key', 'maps_key', 'firestore_write', 'gemini_parse', 'places_search', 'geocoding', 'distance']
    : Array.isArray(tests) ? tests : [tests];

  const results: TestResult[] = [];

  for (const test of requested) {
    switch (test) {
      case 'gemini_key':
        results.push(testGeminiKey());
        break;
      case 'maps_key':
        results.push(testMapsKey());
        break;
      case 'firestore_write':
        results.push(await testFirestoreWrite());
        break;
      case 'gemini_parse':
        results.push(await testGeminiParse());
        break;
      case 'places_search':
        results.push(await testPlacesSearch());
        break;
      case 'geocoding':
        results.push(await testGeocoding());
        break;
      case 'distance':
        results.push(await testDistance());
        break;
      default:
        results.push({ test, status: 'skipped', latencyMs: 0, message: `Unknown test: ${test}` });
    }
  }

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warning').length;

  let overall: 'green' | 'yellow' | 'red' = 'green';
  if (failCount > 0) overall = 'red';
  else if (warnCount > 0) overall = 'yellow';

  safeLog.apiCall('POST', '/diagnostics', 200, 0);

  res.json({
    success: true,
    overall,
    summary: `${passCount} passed, ${failCount} failed, ${warnCount} warnings`,
    results,
    timestamp: new Date().toISOString(),
  });
}

// ── Test: Gemini Key Present ────────────────────────────────────────
function testGeminiKey(): TestResult {
  const key = process.env.GEMINI_API_KEY;
  if (key && key.length > 10) {
    return {
      test: 'gemini_key', status: 'pass', latencyMs: 0,
      message: `Gemini API key configured (${key.substring(0, 4)}...${key.substring(key.length - 4)})`,
    };
  }
  return {
    test: 'gemini_key', status: 'fail', latencyMs: 0,
    message: 'GEMINI_API_KEY not found in environment.',
    hint: 'Set GEMINI_API_KEY in functions/.env or Cloud Functions config.',
  };
}

// ── Test: Maps Key Present ──────────────────────────────────────────
function testMapsKey(): TestResult {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (key && key.length > 10) {
    return {
      test: 'maps_key', status: 'pass', latencyMs: 0,
      message: `Maps API key configured (${key.substring(0, 4)}...${key.substring(key.length - 4)})`,
    };
  }
  return {
    test: 'maps_key', status: 'fail', latencyMs: 0,
    message: 'GOOGLE_MAPS_API_KEY not found in environment.',
    hint: 'Set GOOGLE_MAPS_API_KEY in functions/.env or Cloud Functions config.',
  };
}

// ── Test: Firestore Admin Write ─────────────────────────────────────
async function testFirestoreWrite(): Promise<TestResult> {
  const start = Date.now();
  try {
    const docId = `diag_${uuid().substring(0, 8)}`;
    await db.collection('_diagnostics').doc(docId).set({
      test: true,
      timestamp: Timestamp.now(),
    });
    await db.collection('_diagnostics').doc(docId).delete();
    return {
      test: 'firestore_write', status: 'pass', latencyMs: Date.now() - start,
      message: 'Firestore write + delete successful.',
    };
  } catch (e: any) {
    return {
      test: 'firestore_write', status: 'fail', latencyMs: Date.now() - start,
      message: `Firestore write failed: ${e.message?.substring(0, 80)}`,
      hint: 'Check Firebase Admin SDK initialization and service account permissions.',
    };
  }
}

// ── Test: Gemini Parse ──────────────────────────────────────────────
async function testGeminiParse(): Promise<TestResult> {
  const start = Date.now();
  try {
    const { parseServiceRequest } = await import('../services/gemini/geminiClient');
    const result = await parseServiceRequest('AC repair test');
    return {
      test: 'gemini_parse', status: 'pass', latencyMs: Date.now() - start,
      message: `Gemini parse OK. Source: ${result.source}. Service: ${result.parsed.serviceType}.`,
      warning: result.source === 'fallback' ? 'Used keyword fallback — Gemini may be unavailable.' : undefined,
    };
  } catch (e: any) {
    return {
      test: 'gemini_parse', status: 'fail', latencyMs: Date.now() - start,
      message: `Gemini parse failed: ${e.message?.substring(0, 80)}`,
      hint: 'Verify GEMINI_API_KEY is valid and Gemini API is enabled in Google Cloud Console.',
    };
  }
}

// ── Test: Places Search ─────────────────────────────────────────────
async function testPlacesSearch(): Promise<TestResult> {
  const start = Date.now();
  try {
    const { searchNearbyProviders } = await import('../services/maps/placesService');
    const result = await searchNearbyProviders('AC repair', 'G-13 Islamabad');
    return {
      test: 'places_search', status: 'pass', latencyMs: Date.now() - start,
      message: `Places search OK. Found ${result.totalFound} results. Source: ${result.source}.`,
      warning: result.totalFound === 0 ? 'Zero results — try a different query or area.' : undefined,
    };
  } catch (e: any) {
    return {
      test: 'places_search', status: 'fail', latencyMs: Date.now() - start,
      message: `Places search failed: ${e.message?.substring(0, 80)}`,
      hint: 'Verify GOOGLE_MAPS_API_KEY is valid and Places API (New) is enabled.',
    };
  }
}

// ── Test: Geocoding ─────────────────────────────────────────────────
async function testGeocoding(): Promise<TestResult> {
  const start = Date.now();
  try {
    const { geocodeLocation } = await import('../services/maps/geocodingService');
    const result = await geocodeLocation('G-13 Islamabad');
    if (result?.location && result.location.lat !== 0) {
      return {
        test: 'geocoding', status: 'pass', latencyMs: Date.now() - start,
        message: `Geocoding OK. Lat: ${result.location.lat.toFixed(4)}, Lng: ${result.location.lng.toFixed(4)}.`,
      };
    }
    return {
      test: 'geocoding', status: 'warning', latencyMs: Date.now() - start,
      message: 'Geocoding returned no coordinates.',
      warning: 'Geocoding API may not be enabled or the query produced no results.',
      hint: 'Enable Geocoding API in Google Cloud Console.',
    };
  } catch (e: any) {
    return {
      test: 'geocoding', status: 'fail', latencyMs: Date.now() - start,
      message: `Geocoding failed: ${e.message?.substring(0, 80)}`,
      hint: 'Verify GOOGLE_MAPS_API_KEY is valid and Geocoding API is enabled.',
    };
  }
}

// ── Test: Distance/Routes ───────────────────────────────────────────
async function testDistance(): Promise<TestResult> {
  const start = Date.now();
  try {
    const { estimateDistance } = await import('../services/maps/distanceService');
    const result = await estimateDistance(
      { lat: 33.7, lng: 73.05 },
      { lat: 33.72, lng: 73.07 },
    );
    if (result?.estimate) {
      return {
        test: 'distance', status: 'pass', latencyMs: Date.now() - start,
        message: `Distance OK. ${result.estimate.distanceText}, ${result.estimate.durationText}. Source: ${result.source}.`,
      };
    }
    return {
      test: 'distance', status: 'warning', latencyMs: Date.now() - start,
      message: `Distance returned fallback estimate. Source: ${result.source}.`,
      warning: 'Distance Matrix API may not be enabled — using straight-line fallback.',
      hint: 'Enable Distance Matrix API in Google Cloud Console for accurate travel times.',
    };
  } catch (e: any) {
    return {
      test: 'distance', status: 'fail', latencyMs: Date.now() - start,
      message: `Distance test failed: ${e.message?.substring(0, 80)}`,
      hint: 'Verify GOOGLE_MAPS_API_KEY and Distance Matrix API are enabled.',
    };
  }
}
