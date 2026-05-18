// functions/src/utils/testGemini.ts
// Test helper for Gemini service — run locally to verify API connectivity
// Usage: npx ts-node src/utils/testGemini.ts (with .env configured)
//
// This file is NOT deployed to Cloud Functions.
// It's a local development tool only.

import { fallbackParseRequest } from '../services/gemini/geminiFallback';

/**
 * Test inputs for multilingual NLU parsing.
 */
export const TEST_INPUTS = {
  romanUrdu: 'AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.',
  english: 'I need a plumber urgently. My kitchen pipe is leaking badly. I am in F-10, Islamabad.',
  mixed: 'Mujhe ek electrician chahiye for wiring work in G-12. Tomorrow afternoon would be best.',
  urduScript: 'میرا اے سی خراب ہے، جی تیرہ میں کل صبح ٹیکنیشن بھیجیں',
  minimal: 'AC repair G-13',
  vague: 'kuch kaam karwana hai',
};

/**
 * Run fallback parser on all test inputs and print results.
 * This tests the keyword-based fallback without needing a Gemini API key.
 */
export function testFallbackParser(): void {
  console.log('=== KaamWala AI — Fallback Parser Test ===\n');

  for (const [label, input] of Object.entries(TEST_INPUTS)) {
    console.log(`--- ${label} ---`);
    console.log(`Input: "${input}"`);

    const result = fallbackParseRequest(input);

    console.log(`Service Type: ${result.serviceType}`);
    console.log(`Location: ${result.locationText || '(not detected)'}`);
    console.log(`Urgency: ${result.urgency}`);
    console.log(`Budget: ${result.budgetSensitivity}`);
    console.log(`Language: ${result.languageDetected}`);
    console.log(`Confidence: ${result.confidenceScore}`);
    console.log(`Missing: ${result.missingFields.join(', ') || 'none'}`);
    console.log(`Summary: ${result.normalizedEnglishSummary}`);
    console.log('');
  }
}

/**
 * Validate that the Gemini client module structure is correct.
 * Does NOT call the API — just checks imports resolve.
 */
export function testModuleStructure(): boolean {
  try {
    // These imports verify the module graph compiles
    require('../services/gemini/geminiClient');
    require('../services/gemini/geminiSchemas');
    require('../services/gemini/geminiPrompts');
    require('../services/gemini/geminiFallback');
    console.log('✅ All Gemini modules loaded successfully.');
    return true;
  } catch (err: any) {
    console.error('❌ Module load failed:', err.message);
    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  testFallbackParser();
}
