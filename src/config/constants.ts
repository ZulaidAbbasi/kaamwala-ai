// src/config/constants.ts
// App-wide constants

export const APP_NAME = 'KaamWala AI';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'AI Service Orchestrator for Pakistan\'s Informal Economy';

/**
 * Supported service categories
 */
export const SERVICE_CATEGORIES = [
  { key: 'hvac', label: 'AC Repair / HVAC', urdu: 'اے سی مرمت' },
  { key: 'plumbing', label: 'Plumbing', urdu: 'پلمبنگ' },
  { key: 'electrical', label: 'Electrical', urdu: 'بجلی کا کام' },
  { key: 'painting', label: 'Painting', urdu: 'پینٹنگ' },
  { key: 'carpentry', label: 'Carpentry', urdu: 'بڑھئی' },
  { key: 'cleaning', label: 'Cleaning', urdu: 'صفائی' },
  { key: 'appliance', label: 'Appliance Repair', urdu: 'آلات کی مرمت' },
  { key: 'general', label: 'General Handyman', urdu: 'عام مرمت' },
] as const;

/**
 * Agentic phases for trace logging
 */
export const AGENT_PHASES = [
  'OBSERVE',
  'UNDERSTAND',
  'REASON',
  'DECIDE',
  'ACT',
  'EVALUATE',
  'RECOVER',
] as const;

/**
 * Booking status flow
 */
export const BOOKING_STATUSES = [
  'confirmed_pending_provider',
  'provider_accepted',
  'in_progress',
  'completed',
  'cancelled',
] as const;

/**
 * Demo request for judges
 */
export const DEMO_REQUEST =
  'AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.';

/**
 * Default search radius in meters
 */
export const DEFAULT_SEARCH_RADIUS = 5000;
