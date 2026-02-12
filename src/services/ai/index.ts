import { ParsedScholarship } from "../../types/index.js";
import { AIServiceProvider, AIServiceConfig } from "./types.js";
import { OpenAIProvider } from "./openai.provider.js";
import { GeminiProvider } from "./gemini.provider.js";
import { GrokProvider } from "./grok.provider.js";
import { runSearchBatch } from "./utils.js";

/**
 * AI Service Manager
 * Manages multiple AI providers and allows easy switching between them
 */
class AIServiceManager {
  private currentProvider: AIServiceProvider | null = null;
  private config: AIServiceConfig;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      provider: (process.env.AI_PROVIDER as any) || "grok",
      openaiApiKey: process.env.OPENAI_API_KEY,
      grokApiKey: process.env.GROK_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
    };

    this.initializeProvider();
  }

  /**
   * Initialize the provider based on configuration
   */
  private initializeProvider(): void {
    const { provider } = this.config;

    switch (provider) {
      case "openai":
        if (this.config.openaiApiKey) {
          this.currentProvider = new OpenAIProvider(this.config.openaiApiKey);
          console.log("[AI Service] ✓ Initialized with OpenAI provider");
        } else {
          console.warn("[AI Service] ⚠ OpenAI API key not found");
        }
        break;

      case "gemini":
        if (this.config.geminiApiKey) {
          this.currentProvider = new GeminiProvider(this.config.geminiApiKey);
          console.log("[AI Service] ✓ Initialized with Gemini provider");
        } else {
          console.warn("[AI Service] ⚠ Gemini API key not found");
        }
        break;

      case "grok":
        if (this.config.grokApiKey) {
          this.currentProvider = new GrokProvider(this.config.grokApiKey);
          console.log("[AI Service] ✓ Initialized with Grok provider");
        } else {
          console.warn("[AI Service] ⚠ Grok API key not found");
        }
        break;

      default:
        console.error(`[AI Service] ✗ Unknown provider: ${provider}`);
    }

    if (!this.currentProvider) {
      const availableKeys = [];
      if (this.config.openaiApiKey) availableKeys.push('openai');
      if (this.config.geminiApiKey) availableKeys.push('gemini');
      if (this.config.grokApiKey) availableKeys.push('grok');
      
      const errorMsg = `[AI Service] Failed to initialize provider: ${provider}. ` +
        (availableKeys.length > 0 
          ? `Available providers: ${availableKeys.join(', ')}. Consider switching to one of them in your .env file.`
          : `No API keys found. Please add an API key to your .env file.`);
      
      throw new Error(errorMsg);
    }
  }

  /**
   * Switch to a different AI provider
   * @param provider - The provider to switch to
   */
  switchProvider(provider: "openai" | "grok" | "gemini"): void {
    this.config.provider = provider;
    this.currentProvider = null;
    this.initializeProvider();
    console.log(`[AI Service] Switched to ${this.getProviderName()} provider`);
  }

  /**
   * Get the current provider instance
   */
  getProvider(): AIServiceProvider {
    if (!this.currentProvider) {
      throw new Error("[AI Service] No provider initialized");
    }
    return this.currentProvider;
  }

  /**
   * Get the name of the current provider
   */
  getProviderName(): string {
    return this.currentProvider?.getProviderName() || "None";
  }

  /**
   * Check if the current provider is configured
   */
  isConfigured(): boolean {
    return this.currentProvider?.isConfigured() || false;
  }

  /**
   * Search for scholarships using the current provider
   */
  async searchScholarships(query: string): Promise<ParsedScholarship[]> {
    if (!this.currentProvider) {
      throw new Error("[AI Service] No provider initialized");
    }
    return this.currentProvider.searchScholarships(query);
  }

  /**
   * Run a batch of search queries
   */
  async runSearchBatch(queries: string[]): Promise<ParsedScholarship[]> {
    if (!this.currentProvider) {
      throw new Error("[AI Service] No provider initialized");
    }

    return runSearchBatch(
      queries,
      (query) => this.currentProvider!.searchScholarships(query),
      this.getProviderName()
    );
  }

  /**
   * Get available providers and their configuration status
   */
  getAvailableProviders(): {
    provider: string;
    configured: boolean;
    current: boolean;
  }[] {
    return [
      {
        provider: "openai",
        configured: !!this.config.openaiApiKey,
        current: this.config.provider === "openai",
      },
      {
        provider: "gemini",
        configured: !!this.config.geminiApiKey,
        current: this.config.provider === "gemini",
      },
      {
        provider: "grok",
        configured: !!this.config.grokApiKey,
        current: this.config.provider === "grok",
      },
    ];
  }
}

// Lazy singleton instance
let aiServiceInstance: AIServiceManager | null = null;

function getAIService(): AIServiceManager {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIServiceManager();
  }
  return aiServiceInstance;
}

// Export singleton accessor
export const aiService = {
  get instance() {
    return getAIService();
  }
};

// Export for backward compatibility and easy usage
export const searchScholarships = (query: string) =>
  getAIService().searchScholarships(query);

export const runSearchBatchWithAI = (queries: string[]) =>
  getAIService().runSearchBatch(queries);

export const getProviderName = () => getAIService().getProviderName();

export const switchAIProvider = (provider: "openai" | "grok" | "gemini") =>
  getAIService().switchProvider(provider);

export const getAvailableProviders = () => getAIService().getAvailableProviders();

export const getCurrentProvider = () => getAIService().getProviderName();
