// functions/src/services/gemini/geminiPrompts.ts
// Prompt templates for all Gemini API calls
// Designed for Pakistan's informal economy, multilingual support

/**
 * System instruction for the NLU (Natural Language Understanding) agent.
 */
export const NLU_SYSTEM_INSTRUCTION = `You are KaamWala AI, an intelligent service request parser for Pakistan's informal economy.

YOUR ROLE: You are the PRIMARY intelligence. You must deeply UNDERSTAND user intent — not match keywords.
Users may ask for ANY service imaginable. There are millions of possible queries. You must understand ALL of them.

Your job is to extract structured service request data from user input that may be in:
- Urdu script (اردو)
- Roman Urdu (transliterated)  
- English
- Mixed language (code-switching)

RULES:
1. Extract ONLY what the user explicitly stated. Do NOT invent details.
2. If a field is not mentioned, set it to the appropriate default/empty value.
3. For location, extract the area name as written (e.g., "G-13", "F-10", "Saddar", "DHA Phase 2").
4. For urgency, infer from time words: "abhi" = emergency, "kal" = tomorrow, "is hafte" = this_week.
5. For budget, infer from words: "sasta" = low, "budget nahi hai" = low, "achha kaam" = balanced.
6. Confidence should reflect how clearly the request was understood (0.0 to 1.0).
7. Always provide a normalizedEnglishSummary that a non-Urdu speaker can understand.
8. List any fields you could not extract in missingFields.
9. If important info is missing, suggest ONE clarification question.
10. Do NOT include any personal data (phone, name, CNIC) in your output.
11. Do NOT fabricate provider information.
12. Do NOT claim to have contacted anyone.

SERVICE TYPE EXTRACTION — CRITICAL:
You are NOT a keyword matcher. You must UNDERSTAND what the user wants.
- "computer repair" means COMPUTER repair (desktop/laptop), NOT phone/mobile repair
- "mobile repair" or "phone repair" means PHONE repair, NOT computer repair
- These are DIFFERENT services. Never confuse them.
- "car rent" means Car Rental — NOT car wash, NOT mechanic
- Always use the MOST SPECIFIC and ACCURATE service name
- You can return ANY service type — you are not limited to a predefined list
- Examples: "Computer Repair", "Laptop Repair", "AC Repair", "Plumber", "Car Rental", "Wedding Photographer", "Math Tutor", "Gym Trainer", etc.
- If the user asks for something unusual (e.g., "swimming pool cleaner", "tree cutting", "drone operator"), identify it accurately

COMMON SERVICE CATEGORIES (but you are NOT limited to these):
- AC Repair, Electrician, Plumber, Painter, Carpenter, Cleaning
- Barber, Beauty Salon, Beautician, Hair Salon, Makeup Artist
- Car Wash, Car Mechanic, Auto Repair, Tyre Shop, Denter/Painter
- Car Rental, Rent a Car, Vehicle Hire
- Computer Repair, Laptop Repair, PC Repair (DIFFERENT from Mobile Repair)
- Mobile Repair, Phone Repair, Screen Repair (DIFFERENT from Computer Repair)
- Tutor, Teacher, Coaching Center, Academy
- Doctor, Dentist, Clinic, Physiotherapist, Eye Doctor
- Pest Control, Fumigation
- Tailor, Darzi, Stitching
- Gardener, Landscaping, Mali
- Movers, Packers, Shifting Service
- Photographer, Videographer, Event Planner
- Laundry, Dry Cleaning, Dhobi
- Gym, Fitness Trainer, Yoga
- Veterinarian, Pet Grooming
- Courier, Delivery Service
- Catering, Cook, Chef
- Security Guard, Driver, Maid
- Appliance Repair (washing machine, fridge, microwave, oven)
- Welding, Iron Work, Grille
- Glass Work, Aluminium Work, UPVC
- Solar Panel Installation, Inverter
- Internet, Cable, PTCL, WiFi Setup
- Waterproofing, Roof Repair, Leakage
- Taxi, Cab, Ride Service
- Tow Truck, Roadside Assistance
- AC Installation, AC Fitting
- CCTV, Security Camera Installation

CRITICAL: NEVER use "General Handyman", "General Service", or "Other" when the service is clearly identifiable.
Only use "Other" if the request GENUINELY cannot be categorized into any known service.

For Roman Urdu common service terms:
- "nai" or "hajam" = Barber
- "darzi" = Tailor  
- "mali" = Gardener
- "dhobi" = Laundry
- "bawarchi" or "cook" = Cook/Chef
- "driver" = Driver
- "maid" or "kaam wali" = Maid/Domestic Help
- "mistri" = Mason/Construction Worker
- "lohar" = Welder/Iron Worker
- "painter" or "rang wala" = Painter
- "rent" + "car/gaari" = Car Rental
- "car rent pr" or "gaari kiraye" = Car Rental
- "taxi" or "cab" or "sawari" = Taxi
- "tow" or "gaari uthwao" = Tow Truck
- "cctv" or "camera lagwao" = CCTV/Security Camera
- "computer repair" or "laptop repair" = Computer Repair (NOT Mobile Repair)`;

/**
 * Build the NLU parse request prompt.
 */
export function buildParseRequestPrompt(rawText: string): string {
  return `Parse the following service request. The user may write in Urdu, Roman Urdu, English, or mixed language. Identify the EXACT service they need — do NOT default to "General Handyman" or "Other" when a specific service is clearly stated.

USER INPUT:
"${rawText}"

Respond with ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:

{
  "serviceType": "string — the specific service name like 'Barber', 'AC Repair', 'Plumber', 'Tailor', 'Car Wash', 'Dentist', etc. Use the most specific and accurate name.",
  "issueDescription": "string — what the user needs, in English",
  "locationText": "string — area/location as mentioned by user, or empty string",
  "preferredDate": "string — 'today', 'tomorrow', specific date, or empty string",
  "preferredTimeWindow": "string — 'morning', 'afternoon', 'evening', or empty string",
  "urgency": "one of: emergency | today | tomorrow_morning | tomorrow | this_week | flexible | unspecified",
  "budgetSensitivity": "one of: low | medium | high | unspecified",
  "qualityPreference": "one of: budget | balanced | premium | unspecified",
  "constraints": ["array of specific constraints mentioned, e.g., 'female technician', 'must be experienced'"],
  "languageDetected": "one of: urdu | roman_urdu | english | mixed | unknown",
  "confidenceScore": 0.0,
  "missingFields": ["array of fields that could not be extracted"],
  "clarificationQuestion": "string — one follow-up question if important info is missing, or empty string",
  "normalizedEnglishSummary": "string — full English summary of the request"

  IMPORTANT for serviceType:
  - 'barber shop' or 'nai' → 'Barber'
  - 'salon' or 'beauty parlor' → 'Beautician'
  - 'darzi' or 'tailor' → 'Tailor'
  - 'gym' or 'fitness' → 'Gym/Fitness'
  - 'photographer' → 'Photographer'
  - 'mobile repair' or 'phone repair' → 'Mobile Repair' (phones only)
  - 'computer repair' or 'laptop repair' or 'PC repair' → 'Computer Repair' (NOT Mobile Repair!)
  - 'car rent' or 'rent a car' or 'gaari rent' or 'gaari kiraye' or 'car rent pr chiyea' → 'Car Rental'
  - 'taxi' or 'cab' or 'sawari' → 'Taxi'
  - 'tow truck' or 'gaari uthwao' → 'Tow Truck'
  - 'cctv' or 'camera lagwao' → 'CCTV/Security Camera'
  - 'ac lagwao' or 'ac install' → 'AC Installation'
  - NEVER use 'General Handyman', 'General Service', or 'Other' when the service is clearly identifiable
  - If user says "rent" with any vehicle word, the service type MUST be 'Car Rental' or 'Bike Rental'
  - If user says "computer", the service type MUST contain 'Computer', NOT 'Mobile'
  - You are NOT limited to the examples above. Identify ANY service accurately.
}`;
}

/**
 * Build the ranking explanation prompt.
 */
export function buildRankingPrompt(
  serviceRequest: { serviceType: string; urgency: string; budget: string; location: string },
  candidates: Array<{ candidateId: string; name: string; rating: number; distance: string; isRegistered: boolean; baseVisitFee?: number }>
): string {
  return `You are ranking service providers for a customer request.

SERVICE REQUEST:
- Type: ${serviceRequest.serviceType}
- Urgency: ${serviceRequest.urgency}
- Budget: ${serviceRequest.budget}
- Location: ${serviceRequest.location}

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

RANKING RULES:
1. Consider: distance, rating, relevance to service type, budget fit
2. Registered providers should be ranked higher (they are verified)
3. Do NOT invent facts about providers
4. Do NOT claim providers have accepted or are available unless data says so
5. Score each factor 0.0 to 1.0
6. Provide clear reasoning for each ranking

Respond with ONLY valid JSON:

{
  "rankedProviders": [
    {
      "candidateId": "string",
      "rank": 1,
      "score": 0.0,
      "reasoning": "string",
      "factors": {
        "distance": { "score": 0.0, "detail": "string" },
        "rating": { "score": 0.0, "detail": "string" },
        "relevance": { "score": 0.0, "detail": "string" },
        "budgetFit": { "score": 0.0, "detail": "string" }
      }
    }
  ],
  "overallReasoning": "string — why this ordering makes sense",
  "baselineComparison": "string — what would happen without AI assistance"
}`;
}

/**
 * Build a customer notification message prompt.
 */
export function buildCustomerMessagePrompt(data: {
  serviceType: string;
  providerName: string;
  timeSlot: string;
  location: string;
  messageType: 'booking_confirmed' | 'reminder' | 'provider_enroute' | 'completed';
}): string {
  return `Generate a friendly customer notification message for a service booking in Pakistan.

Context:
- Service: ${data.serviceType}
- Provider: ${data.providerName}
- Time: ${data.timeSlot}
- Location: ${data.location}
- Message type: ${data.messageType}

RULES:
1. Write in simple, friendly English with optional Urdu/Roman Urdu phrases
2. Keep it under 160 characters for SMS compatibility
3. Do NOT include any real phone numbers or addresses
4. Do NOT claim this is a confirmed real appointment (this is a demo preview)

Respond with ONLY valid JSON:

{
  "subject": "string — short subject line",
  "body": "string — the notification message",
  "tone": "string — friendly | formal | urgent",
  "channel": "sms"
}`;
}

/**
 * Build a provider notification preview prompt.
 */
export function buildProviderMessagePrompt(data: {
  serviceType: string;
  customerArea: string;
  issueDescription: string;
  urgency: string;
  timeSlot: string;
}): string {
  return `Generate a provider notification preview for a new service job in Pakistan.

Context:
- Service: ${data.serviceType}
- Customer area: ${data.customerArea}
- Issue: ${data.issueDescription}
- Urgency: ${data.urgency}
- Requested time: ${data.timeSlot}

RULES:
1. Professional tone suitable for a service provider
2. Include key job details
3. Do NOT include customer personal information
4. Do NOT claim this is a real job (this is a preview/demo)

Respond with ONLY valid JSON:

{
  "subject": "string",
  "body": "string — the notification",
  "urgencyLabel": "string — 🔴 Urgent | 🟡 Normal | 🟢 Flexible",
  "actionRequired": "string — what the provider should do"
}`;
}

/**
 * Build a dispute resolution prompt.
 */
export function buildDisputePrompt(data: {
  disputeType: string;
  description: string;
  estimateRange: { min: number; max: number };
  actualCharge?: number;
  serviceType: string;
}): string {
  return `Analyze a service dispute and suggest a fair resolution.

Context:
- Dispute type: ${data.disputeType}
- Description: ${data.description}
- Original estimate: PKR ${data.estimateRange.min} – ${data.estimateRange.max}
- Actual charge: ${data.actualCharge ? `PKR ${data.actualCharge}` : 'Not specified'}
- Service type: ${data.serviceType}

RULES:
1. Be fair to both customer and provider
2. Consider Pakistan market norms for the service type
3. Do NOT make legal claims
4. Do NOT contact anyone
5. This is a DEMO resolution — label it as such

Respond with ONLY valid JSON:

{
  "analysis": "string — what happened and why",
  "suggestedResolution": "string — recommended action",
  "fairnessScore": 0.0,
  "escalationNeeded": false,
  "customerMessage": "string — message to show customer",
  "providerMessage": "string — message to show provider"
}`;
}
