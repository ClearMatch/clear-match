/**
 * AI Model Configuration for Clear Match Chat
 * 
 * This file contains the available AI models, their metadata, and default selection logic.
 * Models are organized by tier to help users understand pricing and use cases.
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'google' | 'deepseek' | 'qwen' | 'z-ai';
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
    id: 'qwen/qwen3-coder',
    name: 'Qwen3 Coder (Free)',
    provider: 'qwen',
    tier: 'free',
    description: 'Free model with function calling support - perfect for testing and development',
    strengths: ['Function calling', 'Code generation', 'No cost', 'Large context', 'Testing'],
    approximateCostPer1kTokens: {
      prompt: 0,
      completion: 0,
    },
    contextLength: 262144,
    isRecommended: true,
  },
  {
    id: 'z-ai/glm-4.5-air',
    name: 'GLM-4.5 Air (Free)',
    provider: 'z-ai',
    tier: 'free',
    description: 'Another free option with function calling support',
    strengths: ['Function calling', 'No cost', 'Large context', 'Testing'],
    approximateCostPer1kTokens: {
      prompt: 0,
      completion: 0,
    },
    contextLength: 131072,
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    tier: 'budget',
    description: 'Very affordable model optimized for speed and efficiency',
    strengths: ['Function calling', 'Fast responses', 'Cost-effective', 'Massive context'],
    approximateCostPer1kTokens: {
      prompt: 0.0001,
      completion: 0.0004,
    },
    contextLength: 1048576,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'popular',
    description: 'Well-rounded model excellent for creative and analytical tasks',
    strengths: ['Function calling', 'Creative writing', 'General intelligence', 'Problem solving'],
    approximateCostPer1kTokens: {
      prompt: 0.005,
      completion: 0.015,
    },
    contextLength: 128000,
    isRecommended: true,
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    tier: 'premium',
    description: 'Latest flagship model with advanced reasoning capabilities',
    strengths: ['Function calling', 'Complex reasoning', 'Code analysis', 'Research tasks'],
    approximateCostPer1kTokens: {
      prompt: 0.003,
      completion: 0.015,
    },
    contextLength: 200000,
  },
];

/**
 * Get the default model based on environment
 * - All environments: Use Claude Sonnet 4 for reliable performance
 * - Premium model provides best function calling capabilities
 */
export function getDefaultModel(): string {
  // Using Claude Sonnet 4 for reliable function calling capabilities
  // Claude models have excellent function calling support through OpenRouter
  return 'anthropic/claude-sonnet-4';
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