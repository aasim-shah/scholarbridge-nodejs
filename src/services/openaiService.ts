/**
 * Legacy openaiService.ts - Maintained for backward compatibility
 * Now uses the new AI service architecture that supports multiple providers
 * 
 * To switch AI providers, update the AI_PROVIDER environment variable in .env:
 * - AI_PROVIDER=openai (default)
 * - AI_PROVIDER=gemini (Google Gemini - free tier available)
 * - AI_PROVIDER=grok (xAI Grok - free tier available)
 */

// Re-export from the new AI service
export {
  searchScholarships,
  runSearchBatchWithAI as runSearchBatch,
  getProviderName,
  switchAIProvider,
  getAvailableProviders,
} from "./ai/index.js";

export { getSearchQueries, getTotalBatches } from "./ai/queries.js";

// For information only
export function getCurrentProvider(): string {
  const { getProviderName } = require("./ai/index.js");
  return getProviderName();
}

