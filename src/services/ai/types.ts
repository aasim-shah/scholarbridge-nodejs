import { ParsedScholarship } from "../../types/index.js";

/**
 * Abstract interface for AI service providers
 * All AI providers (OpenAI, Grok, Gemini) must implement this interface
 */
export interface AIServiceProvider {
  /**
   * Search for scholarships using the AI model's web search capability
   * @param query - The search query string
   * @returns Array of parsed scholarships
   */
  searchScholarships(query: string): Promise<ParsedScholarship[]>;

  /**
   * Get the name of the provider for logging
   */
  getProviderName(): string;

  /**
   * Check if the provider is configured (has valid API key)
   */
  isConfigured(): boolean;
}

/**
 * Configuration for the AI service
 */
export interface AIServiceConfig {
  provider: "openai" | "grok" | "gemini";
  openaiApiKey?: string;
  grokApiKey?: string;
  geminiApiKey?: string;
}
