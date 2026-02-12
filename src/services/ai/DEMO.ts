/**
 * DEMONSTRATION: How to Switch AI Providers
 * 
 * This file demonstrates the different ways you can switch between
 * OpenAI, Gemini, and Grok providers in your application.
 */

// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
const envPath = path.resolve(__dirname, "..", "..", "..", ".env");
console.log('[DEMO] Loading .env from:', envPath);
const result = config({ path: envPath });

if (result.error) {
  console.error('[DEMO] Error loading .env:', result.error);
} else {
  console.log('[DEMO] Environment loaded successfully');
  console.log('[DEMO] AI_PROVIDER:', process.env.AI_PROVIDER);
  console.log('[DEMO] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('[DEMO] OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('[DEMO] GROK_API_KEY:', process.env.GROK_API_KEY ? '✓ Set' : '✗ Not set');
}

import { switchAIProvider, searchScholarships, getAvailableProviders, getCurrentProvider } from './index.js';

// ============================================================================
// METHOD 1: Switch Provider at Runtime (Programmatically)
// ============================================================================

async function demonstrateRuntimeSwitching() {
  console.log('\n=== METHOD 1: Runtime Switching ===\n');
  
  // Check which providers are available (have API keys configured)
  const available = getAvailableProviders();
  console.log('Available providers:', available);
  
  // Check current provider
  console.log('Current provider:', getCurrentProvider());
  
  // Switch to Gemini (free tier)
  try {
    switchAIProvider('gemini');
    console.log('✅ Switched to Gemini');
    console.log('Current provider:', getCurrentProvider());
    
    // Now all calls use Gemini
    const geminiResults = await searchScholarships('computer science scholarships');
    console.log(`Found ${geminiResults.length} scholarships using Gemini`);
  } catch (error) {
    console.error('❌ Failed to switch to Gemini:', error);
  }
  
  // Switch to Grok
  try {
    switchAIProvider('grok');
    console.log('✅ Switched to Grok');
    console.log('Current provider:', getCurrentProvider());
    
    // Now all calls use Grok
    const grokResults = await searchScholarships('engineering scholarships');
    console.log(`Found ${grokResults.length} scholarships using Grok`);
  } catch (error) {
    console.error('❌ Failed to switch to Grok:', error);
  }
  
  // Switch to OpenAI
  try {
    switchAIProvider('openai');
    console.log('✅ Switched to OpenAI');
    console.log('Current provider:', getCurrentProvider());
    
    // Now all calls use OpenAI
    const openaiResults = await searchScholarships('medical scholarships');
    console.log(`Found ${openaiResults.length} scholarships using OpenAI`);
  } catch (error) {
    console.error('❌ Failed to switch to OpenAI:', error);
  }
}

// ============================================================================
// METHOD 2: Environment Variable (Recommended for Production)
// ============================================================================

function demonstrateEnvironmentVariable() {
  console.log('\n=== METHOD 2: Environment Variable ===\n');
  console.log('Edit your .env file and set:');
  console.log('');
  console.log('For Gemini (FREE):');
  console.log('  AI_PROVIDER=gemini');
  console.log('  GEMINI_API_KEY=your_gemini_key_here');
  console.log('');
  console.log('For Grok (FREE):');
  console.log('  AI_PROVIDER=grok');
  console.log('  GROK_API_KEY=your_grok_key_here');
  console.log('');
  console.log('For OpenAI (PAID):');
  console.log('  AI_PROVIDER=openai');
  console.log('  OPENAI_API_KEY=your_openai_key_here');
  console.log('');
  console.log('Then restart your server. That\'s it!');
}

// ============================================================================
// METHOD 3: Quick Test Script
// ============================================================================

async function testCurrentProvider() {
  console.log('\n=== METHOD 3: Test Current Provider ===\n');
  
  const current = getCurrentProvider();
  console.log(`Testing ${current} provider...`);
  
  try {
    const results = await searchScholarships('test scholarship');
    console.log(`✅ ${current} is working! Found ${results.length} scholarships`);
    
    if (results.length > 0) {
      console.log('\nFirst scholarship:');
      console.log('  Title:', results[0].title);
      console.log('  Link:', results[0].link);
      console.log('  Amount:', results[0].amount);
    }
  } catch (error) {
    console.error(`❌ ${current} failed:`, error);
  }
}

// ============================================================================
// COST COMPARISON
// ============================================================================

function showCostComparison() {
  console.log('\n=== Cost Comparison ===\n');
  console.log('OpenAI GPT-4o:');
  console.log('  Input:  $2.50 per 1M tokens');
  console.log('  Output: $10.00 per 1M tokens');
  console.log('  Status: ❌ PAID');
  console.log('');
  console.log('Google Gemini 1.5 Flash:');
  console.log('  Free tier: 15 requests per minute');
  console.log('  Paid: $0.075 per 1M input tokens, $0.30 per 1M output tokens');
  console.log('  Status: ✅ FREE (with limits)');
  console.log('');
  console.log('xAI Grok:');
  console.log('  Free tier: $25 in credits per month');
  console.log('  Input:  $5 per 1M tokens');
  console.log('  Output: $15 per 1M tokens');
  console.log('  Status: ✅ FREE (with credits)');
  console.log('');
  console.log('💡 Recommendation: Start with Gemini (highest free tier limits)');
}

// ============================================================================
// RUN DEMONSTRATION
// ============================================================================

export async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   AI Provider Switching Demo - ScholarBridge          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  showCostComparison();
  demonstrateEnvironmentVariable();
  
  try {
    await testCurrentProvider();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 To fix this:');
    console.log('1. Get a FREE API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Add to your .env file:');
    console.log('   AI_PROVIDER=gemini');
    console.log('   GEMINI_API_KEY=your_key_here');
    console.log('3. Run this demo again: npm run test:ai');
  }
  
  // Uncomment to test runtime switching
  // await demonstrateRuntimeSwitching();
  
  console.log('\n✅ Demo complete!\n');
}

// Run if called directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runDemo().catch(console.error);
}
