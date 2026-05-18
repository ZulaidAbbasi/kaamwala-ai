// functions/src/types/provider.ts
// Provider candidate type — normalized from Google Places or registered profiles

/**
 * A provider candidate discovered via Google Places or our registry.
 */
export interface ProviderCandidate {
  candidateId: string;
  source: 'google_places' | 'registered_provider';
  placeId: string | null;
  providerId: string | null;
  name: string;
  address: string;
  location: { lat: number; lng: number } | null;
  rating: number | null;
  reviewCount: number | null;
  openNow: boolean | null;
  businessStatus: string;
  categories: string[];
  distanceEstimateKm: number | null;
  travelTimeEstimateMinutes: number | null;
  isRegistered: boolean;
  bookable: boolean;
  statusLabel: string;
  missingFields: string[];
  dataWarnings: string[];
  confidence: number;
  rawDataSummary: Record<string, any>;
  phoneNumber?: string | null;
  websiteUri?: string | null;
  googleMapsUri?: string | null;
}

/**
 * Registered provider profile from Firestore.
 */
export interface RegisteredProvider {
  providerId: string;
  ownerUid: string;
  businessName: string;
  serviceCategories: string[];
  serviceAreas: string[];
  contactEmail?: string;
  contactPhone?: string | null;
  verified: boolean;
  active: boolean;
  source: 'registered' | 'imported' | 'demo-controlled';
  locationArea: string;
  geo?: { lat: number; lng: number };
  baseVisitFee: number;
  availability: {
    days: string[];
    timeSlots: string[];
  };
  internalRating: number;
  completedJobs: number;
  cancellationCount: number;
}
