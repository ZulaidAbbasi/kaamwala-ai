import {
  ParsedServiceRequest,
  RankingExplanation,
  CustomerMessage,
  ProviderMessage,
  DisputeResolution,
} from './geminiSchemas';
import { matchServiceFromText } from '../serviceTaxonomy';

/**
 * Keyword-based service type detection (no AI needed).
 * Now uses centralized taxonomy for comprehensive matching.
 */
const SERVICE_KEYWORDS: Record<string, string[]> = {
  'AC Repair': ['ac', 'air conditioner', 'cooling', 'compressor', 'split', 'inverter', 'hvac', 'thanda', 'thandi hawa',
    'اے سی', 'ائر کنڈیشنر', 'اے سی مرمت', 'ٹھنڈا', 'کولنگ', 'کمپریسر', 'اسپلٹ'],
  'Plumber': ['plumber', 'plumbing', 'pipe', 'leak', 'tap', 'nalkay', 'geyser', 'drain', 'pani', 'bathroom', 'sink', 'toilet',
    'پلمبر', 'نلکا', 'نلکے', 'پائپ', 'لیک', 'ٹونٹی', 'گیزر', 'نالی', 'پانی', 'باتھ روم', 'ٹوائلٹ'],
  'Electrician': ['electrician', 'electrical', 'bijli', 'wire', 'wiring', 'switch', 'socket', 'ups', 'generator', 'electric', 'light', 'fan',
    'الیکٹریشن', 'بجلی', 'تار', 'وائرنگ', 'سوئچ', 'ساکٹ', 'جنریٹر', 'لائٹ', 'پنکھا'],
  'Cleaning': ['cleaner', 'cleaning', 'clean', 'safai', 'deep clean', 'house clean', 'office clean',
    'صفائی', 'کلینر', 'کلیننگ', 'گھر صاف'],
  'Painter': ['painter', 'paint', 'rang wala', 'wall paint', 'interior paint', 'exterior paint',
    'پینٹر', 'پینٹ', 'رنگ', 'دیوار'],
  'Carpenter': ['carpenter', 'carpentry', 'furniture', 'door', 'cabinet', 'wood', 'lakdi',
    'بڑھئی', 'فرنیچر', 'دروازہ', 'لکڑی', 'الماری'],
  'Appliance Repair': ['washing machine', 'fridge', 'refrigerator', 'microwave', 'oven', 'dishwasher',
    'واشنگ مشین', 'فریج', 'مائیکروویو', 'اوون'],
  'Pest Control': ['pest', 'cockroach', 'mosquito', 'termite', 'keera', 'fumigation',
    'کیڑے', 'مکوڑے', 'دیمک', 'مچھر', 'کاکروچ'],
  'Car Wash': ['car wash', 'wash car', 'vehicle wash', 'auto wash', 'gaari wash', 'car cleaning', 'detailing', 'car detailing',
    'گاڑی دھلوانا', 'کار واش', 'گاڑی صاف'],
  'Mechanic': ['mechanic', 'auto repair', 'car repair', 'bike repair', 'motorcycle repair', 'garage', 'workshop',
    'مکینک', 'گاڑی مرمت', 'ورکشاپ', 'گیراج'],
  'Tutor': ['tutor', 'tuition', 'teacher', 'math teacher', 'english teacher', 'coaching', 'academy',
    'ٹیوٹر', 'ٹیوشن', 'استاد', 'ٹیچر'],
  'Beautician': ['beautician', 'beauty salon', 'parlor', 'parlour', 'makeup', 'facial', 'bridal', 'mehndi',
    'بیوٹیشن', 'پارلر', 'میک اپ', 'مہندی'],
  'Barber': ['barber', 'barber shop', 'barbershop', 'men salon', 'gents salon', 'shave', 'shaving', 'hair cut', 'haircut', 'beard', 'nai', 'hajam', 'baal katao', 'baal katwao', 'baal katwane', 'baal kato',
    'نائی', 'حجام', 'بال', 'داڑھی', 'بال کٹوانا'],
  'Dentist': ['dentist', 'dental', 'teeth', 'tooth', 'toothache', 'daant',
    'ڈینٹسٹ', 'دانت', 'دانتوں'],
  'Doctor': ['doctor', 'clinic', 'medical', 'physician', 'hospital', 'checkup',
    'ڈاکٹر', 'کلینک', 'ہسپتال', 'معائنہ'],
  // Extended services
  'Tailor': ['tailor', 'darzi', 'stitching', 'silai', 'suit', 'shalwar kameez', 'alteration', 'silwana',
    'درزی', 'سلائی', 'شلوار قمیض', 'سلوانا'],
  'Photographer': ['photographer', 'photography', 'videographer', 'video', 'photoshoot', 'wedding photography', 'cameraman',
    'فوٹوگرافر', 'ویڈیو'],
  'Maid': ['maid', 'kaam wali', 'domestic help', 'house help', 'bai', 'kaam wala', 'massi',
    'کام والی', 'ماسی', 'گھریلو ملازمہ'],
  'Driver': ['driver', 'chauffeur', 'monthly driver', 'driver chahiye',
    'ڈرائیور', 'ڈرائیور چاہیے'],
  'Cook': ['cook', 'chef', 'bawarchi', 'catering', 'khana', 'food service', 'tiffin',
    'باورچی', 'کھانا', 'شیف'],
  'Gardener': ['gardener', 'mali', 'garden', 'landscaping', 'lawn', 'plants', 'grass',
    'مالی', 'باغبان', 'باغ'],
  'Mobile Repair': ['mobile repair', 'phone repair', 'screen repair', 'iphone repair', 'samsung repair', 'mobile ki screen', 'screen toot', 'phone fix', 'mobile fix',
    'موبائل مرمت', 'فون مرمت', 'اسکرین ٹوٹ'],
  'Computer Repair': ['computer repair', 'pc repair', 'desktop repair', 'computer fix', 'computer service', 'pc fix', 'cpu repair', 'computer kharab',
    'کمپیوٹر مرمت', 'کمپیوٹر خراب'],
  'Laptop Repair': ['laptop repair', 'laptop fix', 'laptop service', 'laptop screen', 'laptop kharab', 'notebook repair',
    'لیپ ٹاپ مرمت', 'لیپ ٹاپ خراب'],
  'Gym/Fitness': ['gym', 'fitness', 'trainer', 'personal trainer', 'yoga', 'exercise', 'workout',
    'جم', 'ٹرینر'],
  'Laundry': ['laundry', 'dry clean', 'dhobi', 'ironing', 'press wala', 'kapde dhulwao',
    'دھوبی', 'لانڈری', 'استری', 'پریس'],
  'Veterinarian': ['vet', 'veterinary', 'veterinarian', 'pet', 'animal doctor', 'pet grooming', 'dog', 'cat doctor',
    'جانوروں کا ڈاکٹر'],
  'Movers': ['movers', 'packers', 'shifting', 'moving', 'relocation', 'saman shift', 'saman pack',
    'سامان', 'شفٹنگ', 'پیکرز'],
  'Courier': ['courier', 'delivery', 'parcel', 'send package', 'pick drop',
    'کوریئر', 'ڈلیوری', 'پارسل'],
  'Event Planner': ['event planner', 'event', 'wedding planner', 'birthday party', 'tent service', 'decoration', 'decor',
    'ایونٹ', 'شادی', 'سجاوٹ'],
  'Welder': ['welder', 'welding', 'lohar', 'iron work', 'grille', 'gate repair', 'railing',
    'ویلڈر', 'لوہار'],
  'Mason': ['mason', 'mistri', 'construction', 'tiles', 'marble', 'cement', 'brick',
    'مستری', 'ٹائلز', 'سیمنٹ', 'اینٹ', 'تعمیر'],
  'Solar': ['solar', 'solar panel', 'inverter', 'solar installation', 'solar system',
    'سولر', 'سولر پینل'],
  'Internet/WiFi': ['internet', 'wifi', 'ptcl', 'broadband', 'cable', 'network', 'router', 'wifi setup',
    'انٹرنیٹ', 'وائی فائی', 'راؤٹر'],
  'Waterproofing': ['waterproof', 'waterproofing', 'roof repair', 'leakage', 'dampness', 'seepage',
    'واٹر پروف', 'چھت مرمت', 'لیکیج', 'سیلن'],
  'Glass Work': ['glass', 'mirror', 'aluminium', 'upvc', 'window repair', 'glass work',
    'شیشہ', 'آئینہ', 'المونیم', 'کھڑکی'],
  'Security Guard': ['security guard', 'guard', 'chowkidar', 'watchman', 'security',
    'چوکیدار', 'گارڈ', 'سیکیورٹی'],
  'Salon': ['salon', 'hair salon', 'hair', 'hair color', 'hair style',
    'سیلون', 'بالوں'],
  'Car Rental': ['car rent', 'car rental', 'rent a car', 'rent car', 'car hire', 'rent-a-car', 'gaari rent', 'gaari kiraye', 'gaari kiraya', 'car kiraye', 'car kiraya', 'car rent pr', 'car on rent',
    'گاڑی کرایے', 'کار رینٹ'],
  'Taxi': ['taxi', 'cab', 'uber', 'careem', 'indriver', 'sawari',
    'ٹیکسی', 'سواری'],
  'Tow Truck': ['tow truck', 'towing', 'roadside assistance', 'gaari uthwao',
    'گاڑی اٹھوانا'],
  'AC Installation': ['ac install', 'ac installation', 'ac lagwao', 'ac lagwana',
    'اے سی لگوانا', 'اے سی لگانا'],
  'CCTV/Security Camera': ['cctv', 'security camera', 'surveillance', 'camera lagwao',
    'سی سی ٹی وی', 'کیمرا لگوانا'],
  'General Handyman': ['handyman',
    'مرمت', 'ٹیکنیشن', 'کاریگر', 'مستری'],
};

/**
 * Keyword-based urgency detection.
 */
const URGENCY_KEYWORDS: Record<string, string[]> = {
  'emergency': ['abhi', 'foran', 'urgent', 'emergency', 'jaldi', 'immediately',
    'ابھی', 'فوری', 'جلدی', 'ایمرجنسی'],
  'today': ['aaj', 'today', 'tonight',
    'آج', 'آج رات'],
  'tomorrow_morning': ['kal subah', 'tomorrow morning',
    'کل صبح'],
  'tomorrow': ['kal', 'tomorrow',
    'کل'],
  'this_week': ['is hafte', 'this week', 'is hafta',
    'اس ہفتے'],
};

/**
 * Keyword-based budget detection.
 */
const BUDGET_KEYWORDS: Record<string, string[]> = {
  'low': ['sasta', 'cheap', 'budget', 'zyada nahi', 'kam', 'low budget',
    'سستا', 'بجٹ', 'زیادہ نہیں', 'کم'],
  'high': ['achha', 'best', 'premium', 'quality', 'mehenga bhi chalega',
    'اچھا', 'بہترین', 'پریمیم', 'کوالٹی'],
};

/**
 * Smart service extraction: try to pull the actual service noun from the text
 * instead of defaulting to "General Handyman".
 */
function extractServiceFromText(rawText: string): string {
  const lower = rawText.toLowerCase().trim();
  
  // ── Special pattern: "X rent/rental/hire" or "rent X" ──────────────
  if (/\b(car|gaari|vehicle|bike|motorcycle)\b.*\b(rent|rental|hire|kiraye?|kiraya?)\b/i.test(lower) ||
      /\b(rent|rental|hire|kiraye?|kiraya?)\b.*\b(car|gaari|vehicle|bike|motorcycle)\b/i.test(lower)) {
    if (/\b(bike|motorcycle)\b/.test(lower)) return 'Bike Rental';
    return 'Car Rental';
  }

  // ── Roman Urdu verb-ending patterns (banwana, krwana, lagwana, etc.) ──
  const romanUrduVerbPatterns = [
    // "mujhe X chahiye/chiyea/chaiye" — the most common Roman Urdu pattern
    /(?:mujhe|humein|hume|muje|hamen)\s+(.+?)\s+(?:chahiye|chahye|chaiye|chiyea|chiye|chahia|chaahiye)/i,
    // "X chahiye" without mujhe
    /^(.+?)\s+(?:chahiye|chahye|chaiye|chiyea|chiye|chahia|chaahiye)$/i,
    // "X banwana/krwana/lagwana hai/ha" — "swimming pool banwana hai"
    /^(.+?)\s+(?:banwana|krwana|karwana|lagwana|repair|thik|fix|karna|krna)\s+(?:hai|ha|hain|chahiye|chiyea|chaiye)$/i,
    // "apna X repair/banwana/krwana" — "apna computer repair krwana ha"  
    /(?:apna|apni|apne|mera|meri|mere)\s+(.+?)\s+(?:repair|banwana|krwana|karwana|lagwana|thik|fix|karna|krna)/i,
    // "X repair krwana/karna hai"
    /^(.+?)\s+(?:repair|fix)\s+(?:krwana|karwana|karna|krna|krao|karao)\s*(?:hai|ha|hain)?$/i,
    // "X lagwao/banwao/karwao/repair karo" — action verbs
    /(.+?)\s+(?:lagwao|lagao|banwao|karwao|krwao|thik karo|repair karo|fix karo)\s*$/i,
  ];

  for (const pattern of romanUrduVerbPatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      let extracted = match[1].trim();
      // Remove noise words from start
      extracted = extracted.replace(/^(ek |koi |kuch |please |pls |bhai |yar |yaar |apna |apni |mera |meri |mere )/, '').trim();
      if (extracted.length > 2 && !['the', 'some', 'any', 'one', 'koi', 'ek', 'please', 'mujhe'].includes(extracted)) {
        // Re-check taxonomy with extracted text before returning raw
        const taxonomyCheck = matchServiceFromText(extracted);
        if (taxonomyCheck) return taxonomyCheck;
        // Capitalize and return as-is — better than "General Service"
        const capitalized = extracted.replace(/\b\w/g, c => c.toUpperCase());
        return capitalized;
      }
    }
  }

  // ── English patterns ──
  const englishPatterns = [
    // "need/want/find X"
    /(?:need|find|looking for|want|require)\s+(?:a |an )?([\w][\w\s]{2,30}?)(?:\s+(?:near|in|at|for|service|provider|wala|wali))/i,
    // "X near/in Y" 
    /^([\w][\w\s]{2,20}?)(?:\s+(?:near|in|at|for)\s)/i,
    // "X wala/wali" 
    /^([\w][\w\s]{2,15}?)(?:\s+(?:wala|wali))/i,
    // "X ka kaam" or "X ki zaroorat"
    /([\w][\w\s]{2,15}?)(?:\s+(?:ka kaam|ki zaroorat|ki zarurat))/i,
    // Simple: "X service"
    /([\w][\w\s]{2,15}?)(?:\s+service)/i,
  ];
  
  for (const pattern of englishPatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      let extracted = match[1].trim();
      extracted = extracted.replace(/^(ek |koi |kuch |please |pls )/, '').trim();
      if (extracted.length > 2 && !['the', 'some', 'any', 'one', 'koi', 'ek', 'please'].includes(extracted)) {
        const taxonomyCheck = matchServiceFromText(extracted);
        if (taxonomyCheck) return taxonomyCheck;
        const capitalized = extracted.replace(/\b\w/g, c => c.toUpperCase());
        return capitalized;
      }
    }
  }

  // ── Last resort: use the raw text itself as service type ──
  // Better to pass the user's exact words to Google Places than "General Service"
  // Remove common noise and use the core text
  let cleaned = lower
    .replace(/\b(mujhe|muje|humein|hume|hamen|chahiye|chahye|chiyea|chaiye|hai|ha|hain|please|pls|bhai|yar|yaar)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length > 3 && cleaned.length < 50) {
    const taxonomyCheck = matchServiceFromText(cleaned);
    if (taxonomyCheck) return taxonomyCheck;
    return cleaned.replace(/\b\w/g, c => c.toUpperCase());
  }
  
  return 'General Service';
}

/**
 * Detect language from text.
 */
function detectLanguage(text: string): 'urdu' | 'roman_urdu' | 'english' | 'mixed' {
  const hasUrduScript = /[\u0600-\u06FF]/.test(text);
  const hasEnglishWords = /\b(need|want|repair|fix|please|service|tomorrow|today|near)\b/i.test(text);
  const hasRomanUrdu = /\b(chahiye|kaam|nahi|mein|hai|kal|subah|abhi|zyada|wala|karo)\b/i.test(text);

  if (hasUrduScript && (hasEnglishWords || hasRomanUrdu)) return 'mixed';
  if (hasUrduScript) return 'urdu';
  if (hasRomanUrdu && hasEnglishWords) return 'mixed';
  if (hasRomanUrdu) return 'roman_urdu';
  return 'english';
}

/**
 * Find matching keywords in text.
 */
function findKeyword(text: string, keywords: Record<string, string[]>): string | null {
  const lower = text.toLowerCase();
  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lower.includes(word)) return category;
    }
  }
  return null;
}

/**
 * Extract location from text using common Pakistan area patterns.
 */
function extractLocation(text: string): string {
  // Match sector patterns: G-13, F-10/2, I-8, DHA Phase 5, etc.
  const sectorMatch = text.match(/\b([A-Z]-\d{1,2}(?:\/\d)?|DHA\s*Phase\s*\d|Bahria\s*Town|Saddar|Blue\s*Area|Gulberg|Model\s*Town|Johar\s*Town)/i);
  if (sectorMatch) return sectorMatch[1];

  // Match Urdu sector patterns: جی-13, ایف-8, آئی-10, etc.
  const urduSectorMap: Record<string, string> = {
    'جی': 'G', 'ایف': 'F', 'آئی': 'I', 'ای': 'E', 'ڈی': 'D',
    'سی': 'C', 'بی': 'B', 'ایچ': 'H',
  };
  const urduSectorMatch = text.match(/(جی|ایف|آئی|ای|ڈی|سی|بی|ایچ)[\s-]*(\d{1,2})/);
  if (urduSectorMatch) {
    const letter = urduSectorMap[urduSectorMatch[1]] || urduSectorMatch[1];
    return `${letter}-${urduSectorMatch[2]}`;
  }

  // Match Urdu area names
  const urduAreas: Record<string, string> = {
    'اسلام آباد': 'Islamabad', 'لاہور': 'Lahore', 'کراچی': 'Karachi',
    'راولپنڈی': 'Rawalpindi', 'فیصل آباد': 'Faisalabad', 'ملتان': 'Multan',
    'پشاور': 'Peshawar', 'صدر': 'Saddar', 'بلو ایریا': 'Blue Area',
    'گلبرگ': 'Gulberg', 'بحریہ ٹاؤن': 'Bahria Town', 'ڈی ایچ اے': 'DHA',
  };
  for (const [urdu, eng] of Object.entries(urduAreas)) {
    if (text.includes(urdu)) return eng;
  }

  // Match "mein" pattern: "G-13 mein" or "location mein" or Urdu میں
  const meinMatch = text.match(/(\S+)\s+(?:mein|میں)\b/i);
  if (meinMatch) {
    // Check if the matched word before mein is a sector
    const beforeMein = meinMatch[1];
    // Try Urdu sector again on this segment
    const innerMatch = beforeMein.match(/(جی|ایف|آئی|ای)[\s-]*(\d{1,2})/);
    if (innerMatch) {
      const letter = urduSectorMap[innerMatch[1]] || innerMatch[1];
      return `${letter}-${innerMatch[2]}`;
    }
    return beforeMein;
  }

  return '';
}

/**
 * Fallback NLU parser — keyword-based, no AI needed.
 * Uses centralized taxonomy + local keywords for comprehensive matching.
 */
export function fallbackParseRequest(rawText: string): ParsedServiceRequest {
  // First try centralized taxonomy (most comprehensive)
  let serviceType = matchServiceFromText(rawText);
  // Then try local keywords
  if (!serviceType) serviceType = findKeyword(rawText, SERVICE_KEYWORDS);
  // Smart extraction: pull the actual service noun from text instead of "General Handyman"
  if (!serviceType) serviceType = extractServiceFromText(rawText);
  const urgency = findKeyword(rawText, URGENCY_KEYWORDS) as ParsedServiceRequest['urgency'] || 'unspecified';
  const budget = findKeyword(rawText, BUDGET_KEYWORDS) as ParsedServiceRequest['budgetSensitivity'] || 'unspecified';
  const location = extractLocation(rawText);
  const language = detectLanguage(rawText);

  const missingFields: string[] = [];
  if (!location) missingFields.push('locationText');
  if (urgency === 'unspecified') missingFields.push('urgency');

  return {
    serviceType,
    issueDescription: rawText.substring(0, 200),
    locationText: location,
    preferredDate: urgency.includes('tomorrow') ? 'tomorrow' : '',
    preferredTimeWindow: urgency === 'tomorrow_morning' ? 'morning' : '',
    urgency,
    budgetSensitivity: budget,
    qualityPreference: 'unspecified',
    constraints: [],
    languageDetected: language,
    confidenceScore: 0.35,
    missingFields,
    clarificationQuestion: missingFields.length > 0
      ? `Could you specify ${missingFields.join(' and ')}?`
      : '',
    normalizedEnglishSummary: `${serviceType} service requested. ${location ? `Location: ${location}.` : ''} ${urgency !== 'unspecified' ? `Urgency: ${urgency}.` : ''} [Parsed by keyword fallback]`,
  };
}

/**
 * Fallback ranking — sort by distance only.
 */
export function fallbackRanking(
  candidates: Array<{ candidateId: string; name: string; distance?: number; rating?: number; isRegistered: boolean }>
): RankingExplanation {
  const sorted = [...candidates].sort((a, b) => {
    // Registered first, then by distance
    if (a.isRegistered !== b.isRegistered) return a.isRegistered ? -1 : 1;
    return (a.distance || 99999) - (b.distance || 99999);
  });

  return {
    rankedProviders: sorted.map((c, i) => ({
      candidateId: c.candidateId,
      rank: i + 1,
      score: Math.max(0.3, 1 - i * 0.1),
      reasoning: `Ranked by distance${c.isRegistered ? ' (registered provider)' : ''} [fallback mode]`,
      factors: {
        distance: { score: Math.max(0.3, 1 - i * 0.15), detail: `Position ${i + 1} by distance` },
        rating: { score: (c.rating || 3) / 5, detail: `${c.rating || 'N/A'} stars` },
        relevance: { score: 0.5, detail: 'Not evaluated (fallback mode)' },
        budgetFit: { score: 0.5, detail: 'Not evaluated (fallback mode)' },
      },
    })),
    overallReasoning: 'Ranked by distance and registration status. AI ranking was unavailable. [FALLBACK]',
    baselineComparison: 'Without AI: manual search through 10+ providers.',
  };
}

/**
 * Fallback customer message.
 */
export function fallbackCustomerMessage(serviceType: string, providerName: string): CustomerMessage {
  return {
    subject: `${serviceType} Booking Update`,
    body: `Your ${serviceType} request with ${providerName} has been noted. We will update you shortly. [Auto-generated]`,
    tone: 'friendly',
    channel: 'in_app',
  };
}

/**
 * Fallback provider message.
 */
export function fallbackProviderMessage(serviceType: string, area: string): ProviderMessage {
  return {
    subject: `New ${serviceType} Job`,
    body: `A new ${serviceType} job is available in ${area || 'your area'}. Please check your dashboard for details. [Auto-generated preview]`,
    urgencyLabel: '🟡 Normal',
    actionRequired: 'Review job details in dashboard',
  };
}

/**
 * Fallback dispute resolution.
 */
export function fallbackDisputeResolution(disputeType: string, description: string): DisputeResolution {
  return {
    analysis: `A ${disputeType} dispute was reported: ${description.substring(0, 100)}. [Auto-generated analysis]`,
    suggestedResolution: 'Please contact the provider directly to resolve. If unresolved, escalate to platform support.',
    fairnessScore: 0.5,
    escalationNeeded: true,
    customerMessage: 'We are reviewing your complaint and will respond shortly.',
    providerMessage: 'A customer has raised a concern about your service. Please review.',
  };
}
