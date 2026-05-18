// functions/src/index.ts
// Firebase Cloud Functions — Backend API for KaamWala AI
// ALL secret API keys accessed via env.ts — NEVER hardcoded or logged

import { db } from './config/firebaseAdmin';
import { onRequest } from 'firebase-functions/v2/https';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { getEnvHealthStatus, validateEnv } from './config/env';
import { safeLog } from './utils/safeLogger';
import { handleParseRequest } from './endpoints/parseRequest';
import { handleDiscoverProviders } from './endpoints/discoverProviders';
import { handleSeedDemoProviders, handleListProviders, handleGetProvider } from './endpoints/providers';
import { handleRankProviders } from './endpoints/rankProviders';
import { handleEstimatePrice } from './endpoints/estimatePrice';
import { handleCreateBooking } from './endpoints/createBooking';
import { handleSimulateFollowUp } from './endpoints/simulateFollowUp';
import {
  handleSimulateProviderCancellation,
  handleNoProviderFoundEndpoint,
  handleLowConfidenceEndpoint,
  handleResolveDispute,
} from './endpoints/fallbackRecovery';
import { handleRunWorkflow } from './endpoints/runWorkflow';
import { handleEvaluateOutcome } from './endpoints/evaluateOutcome';
import { handleDiagnostics } from './endpoints/diagnostics';
import {
  handleAcceptBooking,
  handleRejectBooking,
  handleCancelBooking,
  handleCompleteBooking,
  handleListBookings,
} from './endpoints/bookingActions';

// ============================================================================
// Express App Setup
// ============================================================================
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Request timing middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any)._startTime = Date.now();
  next();
});

// ============================================================================
// GET /health — Public health check (no auth required)
// Returns service status + boolean presence of API keys (never the keys)
// ============================================================================
app.get('/health', (_req: Request, res: Response) => {
  const envStatus = getEnvHealthStatus();
  const missingVars = validateEnv();

  const status = missingVars.length === 0 ? 'ok' : 'degraded';

  res.json({
    status,
    service: 'KaamWala AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    project: envStatus.projectId,
    apis: {
      gemini: {
        configured: envStatus.geminiKeyPresent,
        preview: envStatus.geminiKeyPreview,
        model: 'Gemini AI (chain: 3.1-flash-lite → 3-flash → 2.5-flash-lite → 2.5-flash → 2.0-flash → 2.0-flash-lite)',
      },
      maps: {
        configured: envStatus.mapsKeyPresent,
        preview: envStatus.mapsKeyPreview,
      },
      firestore: {
        connected: true,
      },
    },
    missingConfig: missingVars.length > 0 ? missingVars : undefined,
  });

  safeLog.apiCall('GET', '/health', 200, 0);
});

// ============================================================================
// API Endpoints
// ============================================================================

app.post('/parseRequest', handleParseRequest);

app.post('/discoverProviders', handleDiscoverProviders);

app.post('/rankProviders', handleRankProviders);

app.post('/estimatePrice', handleEstimatePrice);

app.post('/createBooking', handleCreateBooking);

app.post('/simulateFollowUp', handleSimulateFollowUp);

app.post('/runWorkflow', handleRunWorkflow);

app.post('/evaluateOutcome', handleEvaluateOutcome);

app.post('/diagnostics', handleDiagnostics);

app.post('/simulateProviderCancellation', handleSimulateProviderCancellation);

app.post('/resolveDispute', handleResolveDispute);

app.post('/handleNoProviderFound', handleNoProviderFoundEndpoint);

app.post('/handleLowConfidenceRequest', handleLowConfidenceEndpoint);

app.get('/workflow/:workflowId', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  try {
    const snap = await db.collection('service_requests').where('workflowId', '==', workflowId).limit(1).get();
    if (snap.empty) {
      res.json({ workflowId, found: false, message: 'No workflow data found for this ID.' });
    } else {
      res.json({ workflowId, found: true, data: snap.docs[0].data() });
    }
  } catch (e: any) {
    res.json({ workflowId, found: false, message: 'Lookup failed.' });
  }
});

app.get('/traces/:workflowId', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  try {
    const snap = await db.collection('agent_traces').where('workflowId', '==', workflowId).orderBy('createdAt', 'asc').limit(50).get();
    const traces = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ workflowId, count: traces.length, traces });
  } catch (e: any) {
    // Fallback if index doesn't exist
    const snap = await db.collection('agent_traces').where('workflowId', '==', workflowId).limit(50).get();
    const traces = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ workflowId, count: traces.length, traces });
  }
});

// Provider management
app.post('/seedDemoProviders', handleSeedDemoProviders);
app.get('/providers', handleListProviders);
app.get('/providers/:providerId', handleGetProvider);

// Booking lifecycle
app.post('/acceptBooking', handleAcceptBooking);
app.post('/rejectBooking', handleRejectBooking);
app.post('/cancelBooking', handleCancelBooking);
app.post('/completeBooking', handleCompleteBooking);
app.get('/bookings', handleListBookings);

// ============================================================================
// Startup validation
// ============================================================================
const missingOnStart = validateEnv();
if (missingOnStart.length > 0) {
  safeLog.warn('STARTUP', `Missing environment variables: ${missingOnStart.join(', ')}. Some endpoints will fail.`);
} else {
  safeLog.info('STARTUP', 'All environment variables configured.');
}

// ============================================================================
// Export as Firebase Cloud Function (v2)
// ============================================================================
export const api = onRequest({ cors: true, invoker: 'public' }, app);
