/**
 * AI Model Configuration for Clear Match Chat
 * 
 * This file contains the available AI models, their metadata, and default selection logic.
 * Models are organized by tier to help users understand pricing and use cases.
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'google' | 'deepseek';
  tier: 'premium' | 'popular' | 'balanced' | 'budget' | 'free';
  description: string;
  strengths: string[];
  approximateCostPer1kTokens: {
    prompt: number;
    completion: number;
  };
  contextLength: number;
  isRecommended?: boolean;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    tier: 'premium',
    description: 'Latest flagship model with advanced reasoning capabilities',
    strengths: ['Complex reasoning', 'Code analysis', 'Research tasks', 'Long-form content'],
    approximateCostPer1kTokens: {
      prompt: 0.003,
      completion: 0.015,
    },
    contextLength: 200000,
    isRecommended: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'popular',
    description: 'Well-rounded model excellent for creative and analytical tasks',
    strengths: ['Creative writing', 'General intelligence', 'Conversational', 'Problem solving'],
    approximateCostPer1kTokens: {
      prompt: 0.005,
      completion: 0.015,
    },
    contextLength: 128000,
    isRecommended: true,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    tier: 'balanced',
    description: 'Speed-optimized model for quick, efficient responses',
    strengths: ['Fast responses', 'General chat', 'Quick analysis', 'Cost-effective'],
    approximateCostPer1kTokens: {
      prompt: 0.0003,
      completion: 0.0025,
    },
    contextLength: 1048576,
  },
  {
    id: 'deepseek/deepseek-chat-v3.1',
    name: 'DeepSeek V3.1',
    provider: 'deepseek',
    tier: 'budget',
    description: 'Ultra-affordable model with solid performance',
    strengths: ['Cost-effective', 'Code generation', 'General tasks', 'High value'],
    approximateCostPer1kTokens: {
      prompt: 0.0002,
      completion: 0.0008,
    },
    contextLength: 32000,
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'GPT-OSS-20B (Free)',
    provider: 'openai',
    tier: 'free',
    description: 'Free model perfect for testing and development',
    strengths: ['No cost', 'Testing', 'Development', 'Basic tasks'],
    approximateCostPer1kTokens: {
      prompt: 0,
      completion: 0,
    },
    contextLength: 8192,
  },
];

/**
 * Get the default model based on environment
 * - Development/Staging: Free model for testing
 * - Production: GPT-4o for reliability
 */
export function getDefaultModel(): string {
  const isProduction = process.env.NODE_ENV === 'production' && 
                      process.env.VERCEL_ENV === 'production';
  
  if (isProduction) {
    return 'openai/gpt-4o';
  } else {
    // Development or staging
    return 'openai/gpt-oss-20b:free';
  }
}

/**
 * Get model information by ID
 */
export function getModelById(modelId: string): AIModel | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}

/**
 * Get models grouped by tier
 */
export function getModelsByTier() {
  const grouped: Record<string, AIModel[]> = {
    premium: [],
    popular: [],
    balanced: [],
    budget: [],
    free: [],
  };

  AVAILABLE_MODELS.forEach(model => {
    grouped[model.tier]!.push(model);
  });

  return grouped;
}

/**
 * Format cost for display
 */
export function formatModelCost(model: AIModel): string {
  if (model.tier === 'free') {
    return 'Free';
  }
  
  const avgCost = (model.approximateCostPer1kTokens.prompt + model.approximateCostPer1kTokens.completion) / 2;
  
  if (avgCost < 0.001) {
    return 'Nearly Free';
  } else if (avgCost < 0.005) {
    return 'Low Cost';
  } else if (avgCost < 0.015) {
    return 'Standard';
  } else {
    return 'Premium';
  }
}