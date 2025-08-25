'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, DollarSign, TestTube, Crown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AVAILABLE_MODELS, getDefaultModel, getModelById, formatModelCost, type AIModel } from '@/config/models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const TIER_ICONS = {
  premium: Crown,
  popular: Sparkles,
  balanced: Zap,
  budget: DollarSign,
  free: TestTube,
} as const;

const TIER_COLORS = {
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  popular: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  balanced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  budget: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
} as const;

/**
 * ModelSelector - Dropdown component for selecting AI models
 * 
 * Features:
 * - Organized by tiers (Premium, Popular, Balanced, Budget, Free)
 * - Visual indicators for each tier
 * - Cost information and model descriptions
 * - Persists selection to localStorage
 * - Environment-aware defaults
 */
export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted for localStorage access
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedModelInfo = getModelById(selectedModel);
  const Icon = selectedModelInfo ? TIER_ICONS[selectedModelInfo.tier] : Sparkles;

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('clear-match-selected-model', modelId);
    }
  };

  // Group models by tier for organized display
  const modelsByTier = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.tier]) acc[model.tier] = [];
    acc[model.tier]!.push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Sparkles className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="min-w-[180px] justify-between"
        >
          <div className="flex items-center">
            <Icon className="h-4 w-4 mr-2" />
            <span className="truncate">
              {selectedModelInfo?.name || 'Select Model'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[320px] bg-white border shadow-lg z-50">
        <DropdownMenuLabel>Choose AI Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Premium Models */}
        {modelsByTier.premium && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Premium Models
            </DropdownMenuLabel>
            {modelsByTier.premium.map((model) => (
              <ModelMenuItem
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                onSelect={handleModelSelect}
              />
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Popular Models */}
        {modelsByTier.popular && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Popular Models
            </DropdownMenuLabel>
            {modelsByTier.popular.map((model) => (
              <ModelMenuItem
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                onSelect={handleModelSelect}
              />
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Balanced Models */}
        {modelsByTier.balanced && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Balanced Models
            </DropdownMenuLabel>
            {modelsByTier.balanced.map((model) => (
              <ModelMenuItem
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                onSelect={handleModelSelect}
              />
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Budget & Free Models */}
        {(modelsByTier.budget || modelsByTier.free) && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Budget & Testing
            </DropdownMenuLabel>
            {modelsByTier.budget?.map((model) => (
              <ModelMenuItem
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                onSelect={handleModelSelect}
              />
            ))}
            {modelsByTier.free?.map((model) => (
              <ModelMenuItem
                key={model.id}
                model={model}
                isSelected={selectedModel === model.id}
                onSelect={handleModelSelect}
              />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ModelMenuItemProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

function ModelMenuItem({ model, isSelected, onSelect }: ModelMenuItemProps) {
  const Icon = TIER_ICONS[model.tier];
  
  return (
    <DropdownMenuItem 
      onClick={() => onSelect(model.id)}
      className="p-3 cursor-pointer focus:bg-accent"
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex items-start space-x-3">
          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {model.name}
              </p>
              {model.isRecommended && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  Recommended
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {model.description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-0 ${TIER_COLORS[model.tier]}`}
              >
                {formatModelCost(model)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {model.strengths.slice(0, 2).join(', ')}
              </span>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="w-2 h-2 rounded-full bg-primary ml-2 mt-2" />
        )}
      </div>
    </DropdownMenuItem>
  );
}