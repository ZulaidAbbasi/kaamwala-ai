// functions/src/endpoints/providers.ts
// Provider management endpoints — seed, list, get
// Only demo-controlled providers for hackathon

import { Request, Response } from 'express';
import {
  createDemoRegisteredProviders,
  getAllRegisteredProviders,
  getProviderProfile,
  listRegisteredProviders,
} from '../services/providerService';
import { safeLog } from '../utils/safeLogger';

/**
 * POST /seedDemoProviders — Seed the 3 demo registered providers
 */
export async function handleSeedDemoProviders(_req: Request, res: Response): Promise<void> {
  const start = Date.now();

  try {
    const result = await createDemoRegisteredProviders();

    safeLog.apiCall('POST', '/seedDemoProviders', 200, Date.now() - start);

    res.json({
      success: true,
      message: `Seeded ${result.seeded} demo registered providers.`,
      providerIds: result.providerIds,
      errors: result.errors.length > 0 ? result.errors : undefined,
      note: 'These are demo-controlled providers for hackathon judging. They are NOT random Google businesses.',
    });
  } catch (err: any) {
    safeLog.error('SeedDemoProviders', 'Failed', err);
    res.status(500).json({
      success: false,
      error: { code: 'SEED_FAILED', message: err.message },
    });
  }
}

/**
 * GET /providers — List all registered providers, optionally filtered
 * Query params: serviceType, locationArea
 */
export async function handleListProviders(req: Request, res: Response): Promise<void> {
  const start = Date.now();
  const { serviceType, locationArea } = req.query;

  try {
    const providers = serviceType || locationArea
      ? await listRegisteredProviders(
          serviceType as string | undefined,
          locationArea as string | undefined
        )
      : await getAllRegisteredProviders();

    safeLog.apiCall('GET', '/providers', 200, Date.now() - start);

    res.json({
      success: true,
      providers: providers.map((p) => ({
        providerId: p.providerId,
        businessName: p.businessName,
        serviceCategories: p.serviceCategories,
        serviceAreas: p.serviceAreas,
        locationArea: p.locationArea,
        verified: p.verified,
        active: p.active,
        source: p.source,
        baseVisitFee: p.baseVisitFee,
        availability: p.availability,
        internalRating: p.internalRating,
        completedJobs: p.completedJobs,
        cancellationCount: p.cancellationCount,
        // NOTE: contactEmail/Phone intentionally excluded from API response
      })),
      total: providers.length,
      note: providers.some((p) => p.source === 'demo-controlled')
        ? 'Includes demo-controlled providers for hackathon judging.'
        : undefined,
    });
  } catch (err: any) {
    safeLog.error('ListProviders', 'Failed', err);
    res.status(500).json({
      success: false,
      error: { code: 'LIST_FAILED', message: err.message },
    });
  }
}

/**
 * GET /providers/:providerId — Get a single provider profile
 */
export async function handleGetProvider(req: Request, res: Response): Promise<void> {
  const { providerId } = req.params;

  if (!providerId) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_ID', message: 'providerId is required.' },
    });
    return;
  }

  try {
    const provider = await getProviderProfile(providerId);

    if (!provider) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Provider ${providerId} not found.` },
      });
      return;
    }

    res.json({
      success: true,
      provider: {
        providerId: provider.providerId,
        businessName: provider.businessName,
        serviceCategories: provider.serviceCategories,
        serviceAreas: provider.serviceAreas,
        locationArea: provider.locationArea,
        verified: provider.verified,
        active: provider.active,
        source: provider.source,
        baseVisitFee: provider.baseVisitFee,
        availability: provider.availability,
        internalRating: provider.internalRating,
        completedJobs: provider.completedJobs,
        cancellationCount: provider.cancellationCount,
      },
    });
  } catch (err: any) {
    safeLog.error('GetProvider', 'Failed', err);
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: err.message },
    });
  }
}
