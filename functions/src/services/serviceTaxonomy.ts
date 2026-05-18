// functions/src/services/serviceTaxonomy.ts
// Deterministic service taxonomy — maps raw text keywords to canonical service types
// Used by fallback parser, Places search, and relevance filtering

export interface ServiceCategory {
  canonical: string;           // Canonical service type name
  searchQuery: string;         // Primary Google Places search query
  keywords: string[];          // English keywords
  romanUrdu: string[];         // Roman Urdu keywords
  googlePlacesTypes: string[]; // Acceptable Google Places types
  rejectTypes: string[];       // Types that should NEVER match this service
}

export const SERVICE_TAXONOMY: ServiceCategory[] = [
  {
    canonical: 'AC Repair',
    searchQuery: 'AC repair service',
    keywords: ['ac', 'a/c', 'air conditioner', 'air conditioning', 'cooling', 'compressor', 'ac technician', 'ac repair', 'hvac', 'split ac', 'inverter ac', 'ac service'],
    romanUrdu: ['ac kaam nahi', 'thandi hawa nahi', 'cooling issue', 'ac wala', 'ac thik karo'],
    googlePlacesTypes: ['hvac_contractor', 'electrician', 'home_goods_store', 'general_contractor', 'electrical_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank', 'mosque', 'church'],
  },
  {
    canonical: 'Electrician',
    searchQuery: 'electrician',
    keywords: ['electrician', 'electrical', 'bijli', 'wiring', 'switch', 'fan', 'light', 'breaker', 'short circuit', 'socket', 'ups', 'generator', 'electric'],
    romanUrdu: ['bijli ka kaam', 'bijli wala', 'wire kharab', 'switch nahi chal raha', 'light nahi aa rahi'],
    googlePlacesTypes: ['electrician', 'electrical_store', 'general_contractor'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Plumber',
    searchQuery: 'plumber',
    keywords: ['plumber', 'plumbing', 'pipe', 'leak', 'pani', 'tap', 'drain', 'bathroom', 'sink', 'toilet', 'geyser', 'nalkay', 'sanitary'],
    romanUrdu: ['pani leak', 'nalkay wala', 'pipe toot gaya', 'geyser kharab', 'pani nahi aa raha', 'bathroom ka kaam'],
    googlePlacesTypes: ['plumber', 'general_contractor'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Car Wash',
    searchQuery: 'car wash',
    keywords: ['car wash', 'wash car', 'vehicle wash', 'auto wash', 'car cleaning', 'car detailing', 'detailing', 'vehicle cleaning', 'car service station'],
    romanUrdu: ['gaari wash', 'gaari dhulwani', 'car dhulwao', 'gaari saaf karo'],
    googlePlacesTypes: ['car_wash', 'car_repair', 'gas_station'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank', 'mosque', 'clinic'],
  },
  {
    canonical: 'Mechanic',
    searchQuery: 'auto mechanic',
    keywords: ['mechanic', 'auto repair', 'car repair', 'bike repair', 'motorcycle repair', 'garage', 'workshop', 'engine', 'brake', 'tire', 'tyre'],
    romanUrdu: ['gaari kharab', 'mechanic wala', 'gaari thik karo', 'bike repair', 'workshop'],
    googlePlacesTypes: ['car_repair', 'car_dealer', 'gas_station'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Cleaning',
    searchQuery: 'cleaning service',
    keywords: ['cleaner', 'cleaning', 'house cleaning', 'office cleaning', 'deep clean', 'maid', 'housekeeper', 'safai', 'domestic help'],
    romanUrdu: ['safai wala', 'ghar saaf karo', 'safai karo', 'deep clean karo'],
    googlePlacesTypes: ['cleaning_service', 'laundry'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Tutor',
    searchQuery: 'tutor tuition center',
    keywords: ['tutor', 'tuition', 'teacher', 'math teacher', 'english teacher', 'home tutor', 'coaching', 'academy', 'education'],
    romanUrdu: ['tuition wala', 'teacher chahiye', 'padhai', 'coaching center'],
    googlePlacesTypes: ['school', 'university', 'library'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Beautician',
    searchQuery: 'beauty salon',
    keywords: ['beautician', 'beauty salon', 'makeup', 'facial', 'hair', 'salon', 'parlor', 'parlour', 'bridal', 'mehndi', 'waxing', 'haircut', 'styling', 'hair cutting', 'hair color', 'hair colour', 'nail', 'manicure', 'pedicure'],
    romanUrdu: ['parlor wali', 'makeup karo', 'facial karo', 'beauty salon'],
    googlePlacesTypes: ['beauty_salon', 'hair_salon', 'spa'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Barber',
    searchQuery: 'barber shop',
    keywords: ['barber', 'barber shop', 'barbershop', 'men salon', 'gents salon', 'shave', 'shaving', 'hair cut', 'men hair', 'gents hair', 'beard', 'beard trim', 'nai', 'hajam'],
    romanUrdu: ['nai', 'hajam', 'baal katwao', 'baal katao', 'shave karo', 'darhi banwao', 'gents salon'],
    googlePlacesTypes: ['hair_salon', 'beauty_salon', 'barber_shop'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank', 'car_wash', 'car_repair'],
  },
  {
    canonical: 'Painter',
    searchQuery: 'house painter',
    keywords: ['painter', 'paint', 'house painting', 'wall paint', 'interior paint', 'exterior paint', 'rang'],
    romanUrdu: ['rang wala', 'paint karo', 'diwar ka rang'],
    googlePlacesTypes: ['painter', 'general_contractor', 'home_goods_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Carpenter',
    searchQuery: 'carpenter furniture repair',
    keywords: ['carpenter', 'carpentry', 'furniture', 'wood', 'door', 'cabinet', 'shelf', 'wardrobe', 'lakdi'],
    romanUrdu: ['carpenter wala', 'lakdi ka kaam', 'furniture banwao', 'darwaza thik karo'],
    googlePlacesTypes: ['general_contractor', 'furniture_store', 'home_goods_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Appliance Repair',
    searchQuery: 'appliance repair',
    keywords: ['washing machine', 'fridge', 'refrigerator', 'microwave', 'oven', 'dishwasher', 'dryer', 'appliance'],
    romanUrdu: ['machine kharab', 'fridge thik karo', 'washing machine ka kaam'],
    googlePlacesTypes: ['electrician', 'home_goods_store', 'electronics_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Pest Control',
    searchQuery: 'pest control service',
    keywords: ['pest', 'cockroach', 'mosquito', 'termite', 'ant', 'rat', 'rodent', 'fumigation', 'keera'],
    romanUrdu: ['keera maar', 'cockroach ka spray', 'makhi maar'],
    googlePlacesTypes: ['pest_control', 'cleaning_service'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank'],
  },
  {
    canonical: 'Dentist',
    searchQuery: 'dentist',
    keywords: ['dentist', 'dental', 'teeth', 'tooth', 'toothache', 'dental clinic'],
    romanUrdu: ['daant ka doctor', 'dental wala'],
    googlePlacesTypes: ['dentist', 'dental_clinic'],
    rejectTypes: ['car_wash', 'electrician', 'plumber', 'restaurant'],
  },
  {
    canonical: 'Doctor',
    searchQuery: 'clinic doctor',
    keywords: ['doctor', 'clinic', 'medical', 'physician', 'hospital', 'checkup'],
    romanUrdu: ['doctor chahiye', 'clinic', 'checkup'],
    googlePlacesTypes: ['doctor', 'hospital', 'health', 'physiotherapist'],
    rejectTypes: ['car_wash', 'electrician', 'plumber', 'restaurant'],
  },
  {
    canonical: 'Car Rental',
    searchQuery: 'car rental',
    keywords: ['car rent', 'car rental', 'rent a car', 'rent car', 'car hire', 'vehicle rent', 'vehicle rental', 'car booking', 'rental car', 'car on rent', 'rent-a-car'],
    romanUrdu: ['car rent', 'gaari rent', 'gaari kiraye', 'gaari kiraya', 'car kiraye', 'car kiraya', 'car rent pr', 'gaari rent pe', 'gaari rent pr', 'car chahiye rent', 'rent pe gaari', 'car kiray pe', 'gaari kiray pe', 'car rent pe chahiye', 'car rent pr chiyea', 'car rent pr chahiye'],
    googlePlacesTypes: ['car_rental', 'car_dealer', 'travel_agency'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'school', 'hospital', 'bank', 'mosque'],
  },
  {
    canonical: 'Tailor',
    searchQuery: 'tailor stitching',
    keywords: ['tailor', 'stitching', 'alteration', 'suit', 'shalwar kameez', 'dress', 'silai'],
    romanUrdu: ['darzi', 'silai wala', 'suit silwao', 'kapde silwao', 'darzi chahiye', 'silai karo'],
    googlePlacesTypes: ['tailor', 'clothing_store', 'shopping_mall'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Photographer',
    searchQuery: 'photographer studio',
    keywords: ['photographer', 'photography', 'videographer', 'video', 'photoshoot', 'wedding photography', 'cameraman', 'photo studio', 'studio'],
    romanUrdu: ['photographer chahiye', 'photo wala', 'video wala', 'shadi ki video', 'cameraman chahiye'],
    googlePlacesTypes: ['photographer', 'photo_studio'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Cook',
    searchQuery: 'catering chef cook',
    keywords: ['cook', 'chef', 'catering', 'food service', 'tiffin', 'home cook', 'meal prep'],
    romanUrdu: ['bawarchi', 'khana banane wala', 'catering chahiye', 'cook chahiye', 'khana wala', 'tiffin service'],
    googlePlacesTypes: ['restaurant', 'catering', 'meal_delivery'],
    rejectTypes: ['dentist', 'dental', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Maid',
    searchQuery: 'domestic help house cleaning service',
    keywords: ['maid', 'domestic help', 'house help', 'housekeeper', 'house cleaning'],
    romanUrdu: ['kaam wali', 'kaam wala', 'massi', 'bai', 'ghar ka kaam', 'ghar ki safai'],
    googlePlacesTypes: ['cleaning_service', 'home_goods_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Driver',
    searchQuery: 'driver hire car service',
    keywords: ['driver', 'chauffeur', 'car driver', 'monthly driver', 'hire driver'],
    romanUrdu: ['driver chahiye', 'gaari chalane wala', 'driver rakhna hai'],
    googlePlacesTypes: ['taxi_stand', 'car_rental', 'travel_agency'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank'],
  },
  {
    canonical: 'Gardener',
    searchQuery: 'gardener landscaping',
    keywords: ['gardener', 'garden', 'landscaping', 'lawn', 'plants', 'grass', 'tree'],
    romanUrdu: ['mali', 'mali chahiye', 'garden ka kaam', 'lawn ka kaam', 'pouday lagao'],
    googlePlacesTypes: ['landscaper', 'garden_center', 'nursery'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Mobile Repair',
    searchQuery: 'mobile phone repair',
    keywords: ['mobile repair', 'phone repair', 'screen repair', 'iphone repair', 'samsung repair', 'mobile fix', 'phone fix'],
    romanUrdu: ['mobile ki screen', 'screen toot gayi', 'phone thik karo', 'mobile kharab', 'phone ki battery'],
    googlePlacesTypes: ['cell_phone_store', 'electronics_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Computer Repair',
    searchQuery: 'computer repair service',
    keywords: ['computer repair', 'pc repair', 'desktop repair', 'computer fix', 'computer service', 'pc fix', 'cpu repair'],
    romanUrdu: ['computer kharab', 'computer thik karo', 'pc repair', 'computer wala'],
    googlePlacesTypes: ['computer_repair', 'electronics_store', 'computer_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Laptop Repair',
    searchQuery: 'laptop repair service',
    keywords: ['laptop repair', 'laptop fix', 'laptop service', 'laptop screen', 'notebook repair'],
    romanUrdu: ['laptop kharab', 'laptop thik karo', 'laptop wala', 'laptop ki screen'],
    googlePlacesTypes: ['computer_repair', 'electronics_store', 'computer_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Movers',
    searchQuery: 'movers packers shifting service',
    keywords: ['movers', 'packers', 'shifting', 'moving', 'relocation', 'house shifting', 'office shifting'],
    romanUrdu: ['saman shift', 'saman pack', 'shifting chahiye', 'ghar shift', 'saman uthwao'],
    googlePlacesTypes: ['moving_company', 'storage', 'trucking_company'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Event Planner',
    searchQuery: 'event planner decoration',
    keywords: ['event planner', 'event', 'wedding planner', 'birthday party', 'tent service', 'decoration', 'decor', 'party organizer'],
    romanUrdu: ['event ka kaam', 'shadi ka intezaam', 'tent wala', 'decoration chahiye', 'party plan'],
    googlePlacesTypes: ['event_planner', 'wedding_venue', 'banquet_hall'],
    rejectTypes: ['dentist', 'dental', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Welder',
    searchQuery: 'welder iron work grille',
    keywords: ['welder', 'welding', 'iron work', 'grille', 'gate', 'railing', 'steel work'],
    romanUrdu: ['lohar', 'lohar chahiye', 'gate banwao', 'grille lagwao', 'welding ka kaam'],
    googlePlacesTypes: ['general_contractor', 'hardware_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Mason',
    searchQuery: 'mason construction tiles',
    keywords: ['mason', 'construction', 'tiles', 'marble', 'cement', 'brick', 'building', 'renovation'],
    romanUrdu: ['mistri', 'mistri chahiye', 'tiles lagwao', 'taameer', 'ghar banwao', 'renovation'],
    googlePlacesTypes: ['general_contractor', 'hardware_store', 'building_materials_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Solar',
    searchQuery: 'solar panel installation',
    keywords: ['solar', 'solar panel', 'inverter', 'solar installation', 'solar system', 'solar energy'],
    romanUrdu: ['solar lagwao', 'solar panel chahiye', 'solar system lagwao'],
    googlePlacesTypes: ['electrician', 'solar_energy', 'general_contractor'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Laundry',
    searchQuery: 'laundry dry cleaning',
    keywords: ['laundry', 'dry clean', 'dry cleaning', 'ironing', 'washing clothes'],
    romanUrdu: ['dhobi', 'kapde dhulwao', 'press wala', 'istri wala', 'dry clean chahiye'],
    googlePlacesTypes: ['laundry', 'dry_cleaner'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Courier',
    searchQuery: 'courier delivery service',
    keywords: ['courier', 'delivery', 'parcel', 'package', 'send', 'pick drop', 'shipping'],
    romanUrdu: ['courier chahiye', 'parcel bhejo', 'delivery chahiye', 'saman bhijwao'],
    googlePlacesTypes: ['courier_service', 'post_office', 'shipping_company'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Security Guard',
    searchQuery: 'security guard service',
    keywords: ['security guard', 'guard', 'security', 'watchman'],
    romanUrdu: ['chowkidar', 'guard chahiye', 'security wala', 'darban'],
    googlePlacesTypes: ['security_service'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Waterproofing',
    searchQuery: 'waterproofing roof repair leakage',
    keywords: ['waterproof', 'waterproofing', 'roof repair', 'leakage', 'dampness', 'seepage', 'roof'],
    romanUrdu: ['leakage ka kaam', 'roof leak', 'pani aa raha', 'waterproof karo', 'chhat thik karo'],
    googlePlacesTypes: ['roofing_contractor', 'general_contractor'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Internet/WiFi',
    searchQuery: 'internet wifi setup broadband',
    keywords: ['internet', 'wifi', 'broadband', 'ptcl', 'cable', 'network', 'router', 'wifi setup'],
    romanUrdu: ['internet lagwao', 'wifi chahiye', 'ptcl wala', 'net nahi chal raha'],
    googlePlacesTypes: ['telecommunications', 'internet_service_provider', 'electronics_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Glass Work',
    searchQuery: 'glass work aluminium window',
    keywords: ['glass', 'mirror', 'aluminium', 'upvc', 'window repair', 'glass work', 'glass cutting'],
    romanUrdu: ['sheesha lagwao', 'glass wala', 'aluminium ka kaam', 'window ka sheesha'],
    googlePlacesTypes: ['glass_shop', 'general_contractor', 'hardware_store'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Gym/Fitness',
    searchQuery: 'gym fitness trainer',
    keywords: ['gym', 'fitness', 'trainer', 'personal trainer', 'yoga', 'exercise', 'workout', 'fitness center'],
    romanUrdu: ['gym chahiye', 'trainer chahiye', 'exercise karna hai', 'gym wala'],
    googlePlacesTypes: ['gym', 'fitness_center', 'health_club'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Veterinarian',
    searchQuery: 'veterinarian pet clinic',
    keywords: ['vet', 'veterinary', 'veterinarian', 'pet', 'animal doctor', 'pet grooming', 'dog', 'cat'],
    romanUrdu: ['janwar ka doctor', 'pet doctor', 'kutte ka doctor'],
    googlePlacesTypes: ['veterinarian', 'pet_store', 'animal_hospital'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
  {
    canonical: 'Tow Truck',
    searchQuery: 'tow truck roadside assistance',
    keywords: ['tow', 'tow truck', 'roadside assistance', 'car tow', 'breakdown', 'towing'],
    romanUrdu: ['gaari uthwao', 'tow wala', 'gaari khinchwao', 'gaari band pad gayi'],
    googlePlacesTypes: ['towing_service', 'car_repair'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank'],
  },
  {
    canonical: 'Taxi',
    searchQuery: 'taxi cab ride service',
    keywords: ['taxi', 'cab', 'ride', 'uber', 'careem', 'indriver', 'booking ride'],
    romanUrdu: ['taxi chahiye', 'cab chahiye', 'sawari chahiye', 'gaari chahiye jane ke liye'],
    googlePlacesTypes: ['taxi_stand', 'car_rental', 'travel_agency'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank'],
  },
  {
    canonical: 'AC Installation',
    searchQuery: 'AC installation service',
    keywords: ['ac install', 'ac installation', 'install ac', 'new ac', 'ac fitting', 'split ac install'],
    romanUrdu: ['ac lagwana', 'ac lagwao', 'naya ac lagwana hai', 'ac fit karo'],
    googlePlacesTypes: ['hvac_contractor', 'electrician', 'general_contractor'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank'],
  },
  {
    canonical: 'CCTV/Security Camera',
    searchQuery: 'CCTV camera installation security',
    keywords: ['cctv', 'camera', 'security camera', 'surveillance', 'cctv install'],
    romanUrdu: ['cctv lagwao', 'camera lagwao', 'security camera chahiye'],
    googlePlacesTypes: ['security_service', 'electronics_store', 'electrician'],
    rejectTypes: ['dentist', 'dental', 'restaurant', 'hospital', 'bank', 'car_wash'],
  },
];

// ============================================================================
// Lookup functions
// ============================================================================

/**
 * Match raw text against taxonomy to find the best service type.
 * Returns canonical name or null if no match.
 */
export function matchServiceFromText(rawText: string): string | null {
  const lower = rawText.toLowerCase();
  
  for (const cat of SERVICE_TAXONOMY) {
    // Check English keywords
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) return cat.canonical;
    }
    // Check Roman Urdu keywords
    for (const kw of cat.romanUrdu) {
      if (lower.includes(kw)) return cat.canonical;
    }
  }
  return null;
}

/**
 * Get the Google Places search query for a service type.
 * Only matches canonical taxonomy names — does NOT do keyword matching.
 * If the service type isn't in taxonomy (e.g. Gemini identified something new),
 * uses the Gemini service type directly as the search query.
 */
export function getSearchQueryForService(serviceType: string): string {
  const lower = serviceType.toLowerCase().trim();
  
  // Only exact canonical match — don't do keyword matching here
  // Keyword matching caused "Computer Repair" to match "Mobile Repair" taxonomy
  for (const cat of SERVICE_TAXONOMY) {
    if (cat.canonical.toLowerCase() === lower) return cat.searchQuery;
  }
  
  // Not in taxonomy — Gemini identified a specific service type
  // Use it directly as the Google Places search query (this is the RIGHT thing to do)
  return serviceType;
}

/**
 * Get the canonical service type from a parsed serviceType string.
 */
export function canonicalizeServiceType(serviceType: string): string {
  const lower = serviceType.toLowerCase().trim();
  
  // Only exact canonical match — Gemini's output is already specific enough
  for (const cat of SERVICE_TAXONOMY) {
    if (cat.canonical.toLowerCase() === lower) return cat.canonical;
  }
  return serviceType; // Gemini's type is already good — return as-is
}

/**
 * Check if a Google Places result is relevant to the requested service.
 * Returns a relevance score 0-1.
 */
export function scoreProviderRelevance(
  providerName: string,
  providerTypes: string[],
  requestedService: string
): { score: number; relevant: boolean; reason: string } {
  const lower = requestedService.toLowerCase();
  const nameLower = providerName.toLowerCase();
  const typesLower = (providerTypes || []).map(t => t.toLowerCase());
  
  // Find the matching category — ONLY exact canonical match
  // Don't use keyword matching here — it causes "Computer Repair" to match "Mobile Repair"
  let matchedCat: ServiceCategory | null = null;
  for (const cat of SERVICE_TAXONOMY) {
    if (cat.canonical.toLowerCase() === lower) { matchedCat = cat; break; }
  }
  
  if (!matchedCat) {
    // No taxonomy match — allow all with neutral score
    return { score: 0.5, relevant: true, reason: 'No taxonomy filter available' };
  }
  
  // Check reject types first
  for (const reject of matchedCat.rejectTypes) {
    if (nameLower.includes(reject)) {
      return { score: 0, relevant: false, reason: `Provider name "${providerName}" contains rejected term "${reject}" for ${matchedCat.canonical}` };
    }
    for (const type of typesLower) {
      if (type.includes(reject)) {
        return { score: 0.05, relevant: false, reason: `Provider type "${type}" is rejected for ${matchedCat.canonical}` };
      }
    }
  }
  
  // Check positive matches
  // Name match
  for (const kw of matchedCat.keywords) {
    if (nameLower.includes(kw)) {
      return { score: 1.0, relevant: true, reason: `Provider name matches keyword "${kw}"` };
    }
  }
  
  // Type match
  for (const acceptType of matchedCat.googlePlacesTypes) {
    for (const type of typesLower) {
      if (type.includes(acceptType) || acceptType.includes(type)) {
        return { score: 0.8, relevant: true, reason: `Provider type "${type}" matches accepted type "${acceptType}"` };
      }
    }
  }
  
  // Search query in name
  const queryWords = matchedCat.searchQuery.toLowerCase().split(/\s+/);
  for (const word of queryWords) {
    if (word.length > 2 && nameLower.includes(word)) {
      return { score: 0.6, relevant: true, reason: `Provider name contains search term "${word}"` };
    }
  }
  
  // No match — low relevance
  return { score: 0.15, relevant: false, reason: `Provider "${providerName}" has no relevance indicators for ${matchedCat.canonical}` };
}

/**
 * Check if a service type is "Other" or too vague to search.
 */
export function isVagueServiceType(serviceType: string): boolean {
  const vague = ['other', 'unspecified', 'general', 'unknown', 'near me', 'service', 'help', 'general handyman', 'handyman', 'general service'];
  const lower = serviceType.toLowerCase().trim();
  return vague.includes(lower) || lower.length < 2;
}
