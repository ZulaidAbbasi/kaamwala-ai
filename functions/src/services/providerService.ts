// functions/src/services/providerService.ts
// Registered provider management — CRUD, matching, and demo seeding
// Only registered providers can receive real bookings

import { db, Timestamp, FieldValue } from '../config/firebaseAdmin';
import { RegisteredProvider } from '../types/provider';
import { safeLog } from '../utils/safeLogger';
const COLLECTION = 'provider_profiles';

// ============================================================================
// Demo Registered Providers
// These are controlled test providers for hackathon judging.
// They demonstrate the real booking system safely.
// ============================================================================

const DEMO_PROVIDERS: (RegisteredProvider & { createdAt: any; updatedAt: any })[] = [
  // ── Islamabad Providers ──────────────────────────────────────────────
  {
    providerId: 'prov_demo_ac_01',
    ownerUid: 'demo_owner_01',
    businessName: 'CoolTech AC Solutions',
    serviceCategories: ['ac_repair', 'hvac', 'ac repair'],
    serviceAreas: ['G-13', 'G-12', 'G-11', 'G-10', 'G-9'],
    contactEmail: 'demo-cooltech@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'G-13, Islamabad',
    geo: { lat: 33.6310, lng: 73.0271 },
    baseVisitFee: 1500,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['morning', 'afternoon'],
    },
    internalRating: 4.5,
    completedJobs: 47,
    cancellationCount: 2,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    providerId: 'prov_demo_elec_01',
    ownerUid: 'demo_owner_02',
    businessName: 'Bright Sparks Electrical',
    serviceCategories: ['electrical', 'wiring', 'electrician'],
    serviceAreas: ['F-10', 'F-11', 'F-8', 'F-7', 'G-13'],
    contactEmail: 'demo-brightsparks@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'F-10, Islamabad',
    geo: { lat: 33.6940, lng: 73.0134 },
    baseVisitFee: 1200,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: ['morning', 'afternoon', 'evening'],
    },
    internalRating: 4.2,
    completedJobs: 31,
    cancellationCount: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    providerId: 'prov_demo_plumb_01',
    ownerUid: 'demo_owner_03',
    businessName: 'PakFlow Plumbing Services',
    serviceCategories: ['plumbing', 'plumber', 'pipe', 'geyser'],
    serviceAreas: ['G-13', 'G-14', 'G-15', 'H-13', 'I-8'],
    contactEmail: 'demo-pakflow@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'G-14, Islamabad',
    geo: { lat: 33.6180, lng: 73.0340 },
    baseVisitFee: 1000,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      timeSlots: ['morning', 'afternoon'],
    },
    internalRating: 4.7,
    completedJobs: 62,
    cancellationCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    providerId: 'prov_demo_tutor_01',
    ownerUid: 'demo_owner_04',
    businessName: 'EduPak Home Tutors',
    serviceCategories: ['tutor', 'tuition', 'education'],
    serviceAreas: ['G-13', 'G-14', 'G-15', 'F-10', 'F-11'],
    contactEmail: 'demo-edupak@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'G-13, Islamabad',
    geo: { lat: 33.6295, lng: 73.0250 },
    baseVisitFee: 800,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['afternoon', 'evening'],
    },
    internalRating: 4.8,
    completedJobs: 89,
    cancellationCount: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    providerId: 'prov_demo_beauty_01',
    ownerUid: 'demo_owner_05',
    businessName: 'GlowUp Beauty Studio',
    serviceCategories: ['beautician', 'beauty', 'salon', 'makeup'],
    serviceAreas: ['G-13', 'G-11', 'F-10', 'F-11', 'F-8'],
    contactEmail: 'demo-glowup@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'F-11, Islamabad',
    geo: { lat: 33.6870, lng: 73.0240 },
    baseVisitFee: 2000,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['morning', 'afternoon'],
    },
    internalRating: 4.6,
    completedJobs: 34,
    cancellationCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },

  // ── Multan Providers ─────────────────────────────────────────────────
  {
    providerId: 'prov_demo_multan_ac_01',
    ownerUid: 'demo_owner_multan_01',
    businessName: 'Multan Cool AC Services',
    serviceCategories: ['ac_repair', 'hvac', 'ac repair', 'air conditioner', 'cooling'],
    serviceAreas: ['Gulgasht Colony', 'Cantt', 'Shah Rukn-e-Alam', 'Bosan Road', 'Nishtar Road'],
    contactEmail: 'demo-multanac@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'Gulgasht Colony, Multan',
    geo: { lat: 30.1984, lng: 71.4546 },
    baseVisitFee: 1200,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['morning', 'afternoon', 'evening'],
    },
    internalRating: 4.4,
    completedJobs: 53,
    cancellationCount: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    providerId: 'prov_demo_multan_elec_01',
    ownerUid: 'demo_owner_multan_02',
    businessName: 'Multan Electric Masters',
    serviceCategories: ['electrical', 'wiring', 'electrician', 'generator', 'ups'],
    serviceAreas: ['Defence Colony', 'Gulgasht Colony', 'Cantt', 'Mumtazabad', 'New Multan'],
    contactEmail: 'demo-multanelec@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'Defence Colony, Multan',
    geo: { lat: 30.2044, lng: 71.4390 },
    baseVisitFee: 1000,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      timeSlots: ['morning', 'afternoon'],
    },
    internalRating: 4.3,
    completedJobs: 41,
    cancellationCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    providerId: 'prov_demo_multan_plumb_01',
    ownerUid: 'demo_owner_multan_03',
    businessName: 'Multan Plumbing Pro',
    serviceCategories: ['plumbing', 'plumber', 'pipe', 'geyser', 'water'],
    serviceAreas: ['Cantt', 'Shah Rukn-e-Alam', 'Bosan Road', 'Gulgasht Colony'],
    contactEmail: 'demo-multanplumb@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'Cantt, Multan',
    geo: { lat: 30.1928, lng: 71.4697 },
    baseVisitFee: 900,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['morning', 'afternoon'],
    },
    internalRating: 4.6,
    completedJobs: 38,
    cancellationCount: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },

  // ── Lahore Providers ─────────────────────────────────────────────────
  {
    providerId: 'prov_demo_lahore_ac_01',
    ownerUid: 'demo_owner_lahore_01',
    businessName: 'Lahore AC Experts',
    serviceCategories: ['ac_repair', 'hvac', 'ac repair', 'air conditioner', 'cooling'],
    serviceAreas: ['Gulberg', 'DHA', 'Model Town', 'Johar Town', 'Garden Town'],
    contactEmail: 'demo-lahoreac@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'Gulberg, Lahore',
    geo: { lat: 31.5204, lng: 74.3587 },
    baseVisitFee: 1400,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['morning', 'afternoon', 'evening'],
    },
    internalRating: 4.5,
    completedJobs: 67,
    cancellationCount: 2,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    providerId: 'prov_demo_lahore_elec_01',
    ownerUid: 'demo_owner_lahore_02',
    businessName: 'Lahore PowerFix Electrical',
    serviceCategories: ['electrical', 'wiring', 'electrician', 'generator', 'solar'],
    serviceAreas: ['DHA', 'Gulberg', 'Cantt', 'Model Town', 'Township'],
    contactEmail: 'demo-lahoreelec@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'DHA, Lahore',
    geo: { lat: 31.4804, lng: 74.3795 },
    baseVisitFee: 1100,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['morning', 'afternoon'],
    },
    internalRating: 4.3,
    completedJobs: 55,
    cancellationCount: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },

  // ── Karachi Providers ────────────────────────────────────────────────
  {
    providerId: 'prov_demo_karachi_ac_01',
    ownerUid: 'demo_owner_karachi_01',
    businessName: 'Karachi Cool Zone',
    serviceCategories: ['ac_repair', 'hvac', 'ac repair', 'air conditioner', 'cooling'],
    serviceAreas: ['Clifton', 'DHA', 'Gulshan-e-Iqbal', 'North Nazimabad', 'Saddar'],
    contactEmail: 'demo-karachiac@kaamwala-demo.test',
    contactPhone: null,
    verified: true,
    active: true,
    source: 'demo-controlled' as const,
    locationArea: 'Clifton, Karachi',
    geo: { lat: 24.8138, lng: 67.0300 },
    baseVisitFee: 1600,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      timeSlots: ['morning', 'afternoon', 'evening'],
    },
    internalRating: 4.4,
    completedJobs: 72,
    cancellationCount: 3,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

// ============================================================================
// Public API
// ============================================================================

/**
 * Seed the 3 demo registered providers into Firestore.
 * Overwrites existing documents with the same providerId.
 * Returns count of providers seeded.
 */
export async function createDemoRegisteredProviders(): Promise<{
  seeded: number;
  providerIds: string[];
  errors: string[];
}> {
  const providerIds: string[] = [];
  const errors: string[] = [];

  for (const provider of DEMO_PROVIDERS) {
    try {
      await db.collection(COLLECTION).doc(provider.providerId).set({
        ...provider,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      providerIds.push(provider.providerId);
      safeLog.info('ProviderService', `Seeded demo provider: ${provider.businessName} (${provider.providerId})`);
    } catch (err: any) {
      errors.push(`Failed to seed ${provider.providerId}: ${err.message}`);
      safeLog.error('ProviderService', `Failed to seed ${provider.providerId}`, err);
    }
  }

  return {
    seeded: providerIds.length,
    providerIds,
    errors,
  };
}

/**
 * List registered providers matching a service type and optional location.
 */
export async function listRegisteredProviders(
  serviceType?: string,
  locationArea?: string
): Promise<RegisteredProvider[]> {
  try {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION).where('active', '==', true);

    const snap = await query.get();
    let providers = snap.docs.map((doc) => doc.data() as RegisteredProvider);

    // Filter by service type — flexible matching
    if (serviceType) {
      const lowerType = serviceType.toLowerCase();
      providers = providers.filter((p) =>
        p.serviceCategories.some((cat) => {
          const lowerCat = cat.toLowerCase();
          return lowerType.includes(lowerCat) || lowerCat.includes(lowerType.split(' ')[0]);
        })
      );
    }

    // Filter by location area — flexible matching
    if (locationArea) {
      const lowerArea = locationArea.toLowerCase();
      providers = providers.filter((p) =>
        p.serviceAreas.some((area) => lowerArea.includes(area.toLowerCase()))
        || p.locationArea.toLowerCase().includes(lowerArea)
        || lowerArea.includes(p.locationArea.split(',')[0].toLowerCase())
      );
    }

    return providers;
  } catch (err: any) {
    safeLog.error('ProviderService', 'Failed to list providers', err);
    return [];
  }
}

/**
 * Match a discovered Google Places result to a registered provider.
 * Matches by placeId first, then by name similarity + location proximity.
 */
export async function matchDiscoveredToRegisteredProvider(
  placeId: string | null,
  name: string,
  location: { lat: number; lng: number } | null
): Promise<RegisteredProvider | null> {
  try {
    const snap = await db.collection(COLLECTION).where('active', '==', true).get();
    const providers = snap.docs.map((doc) => doc.data() as RegisteredProvider);

    // Match by placeId (exact)
    if (placeId) {
      const byPlaceId = providers.find((p: any) => p.placeId === placeId);
      if (byPlaceId) return byPlaceId;
    }

    // Match by name similarity (contains check)
    const lowerName = name.toLowerCase();
    const byName = providers.find((p) => {
      const lowerBiz = p.businessName.toLowerCase();
      return lowerName.includes(lowerBiz) || lowerBiz.includes(lowerName);
    });

    if (byName) return byName;

    // Match by location proximity (within 500m)
    if (location && location.lat !== 0) {
      const nearby = providers.find((p) => {
        if (!p.geo) return false;
        const dist = haversineDistance(location.lat, location.lng, p.geo.lat, p.geo.lng);
        return dist < 0.5; // 500 meters
      });
      if (nearby) return nearby;
    }

    return null;
  } catch (err: any) {
    safeLog.error('ProviderService', 'Failed to match provider', err);
    return null;
  }
}

/**
 * Get a single provider profile by ID.
 */
export async function getProviderProfile(providerId: string): Promise<RegisteredProvider | null> {
  try {
    const doc = await db.collection(COLLECTION).doc(providerId).get();
    if (!doc.exists) return null;
    return doc.data() as RegisteredProvider;
  } catch (err: any) {
    safeLog.error('ProviderService', `Failed to get provider ${providerId}`, err);
    return null;
  }
}

/**
 * Get all registered providers (for admin/debug views).
 */
export async function getAllRegisteredProviders(): Promise<RegisteredProvider[]> {
  try {
    const snap = await db.collection(COLLECTION).get();
    return snap.docs.map((doc) => doc.data() as RegisteredProvider);
  } catch (err: any) {
    safeLog.error('ProviderService', 'Failed to get all providers', err);
    return [];
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Haversine distance between two points in km.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
