'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Activity, 
  BarChart3, 
  Calendar,
  Search,
  Target,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

/**
 * Suggested prompt category
 */
interface PromptCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  prompts: SuggestedPrompt[];
}

/**
 * Individual suggested prompt
 */
interface SuggestedPrompt {
  id: string;
  text: string;
  category: string;
  description: string;
  keywords: string[];
}

/**
 * Props for SuggestedPrompts component
 */
interface SuggestedPromptsProps {
  /** Callback when a prompt is selected */
  onPromptSelect: (prompt: string) => void;
  /** Whether to show categories */
  showCategories?: boolean;
  /** Maximum number of prompts to show per category */
  maxPromptsPerCategory?: number;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Pre-defined prompt categories and suggestions
 */
const promptCategories: PromptCategory[] = [
  {
    id: 'candidates',
    title: 'Candidates',
    description: 'Query and analyze candidate data',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800',
    prompts: [
      {
        id: 'active-candidates',
        text: 'Show me all active candidates',
        category: 'candidates',
        description: 'List all candidates currently in the recruitment pipeline',
        keywords: ['candidates', 'active', 'pipeline']
      },
      {
        id: 'python-candidates',
        text: 'Find candidates with Python experience',
        category: 'candidates',
        description: 'Search for candidates with specific technical skills',
        keywords: ['candidates', 'skills', 'python', 'technical']
      },
      {
        id: 'interview-stage',
        text: 'List candidates in the interview stage',
        category: 'candidates',
        description: 'Filter candidates by recruitment stage',
        keywords: ['candidates', 'interview', 'stage', 'status']
      },
      {
        id: 'top-rated',
        text: 'Who are the top-rated candidates?',
        category: 'candidates',
        description: 'Identify highest-rated candidates for prioritization',
        keywords: ['candidates', 'rating', 'top', 'priority']
      }
    ]
  },
  {
    id: 'activities',
    title: 'Activities',
    description: 'Track tasks and recruitment activities',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800',
    prompts: [
      {
        id: 'recent-activities',
        text: 'What are my recent activities?',
        category: 'activities',
        description: 'Review recent recruitment activities and tasks',
        keywords: ['activities', 'recent', 'tasks']
      },
      {
        id: 'tasks-due',
        text: 'Show me tasks due this week',
        category: 'activities',
        description: 'View upcoming deadlines and priorities',
        keywords: ['tasks', 'due', 'deadline', 'week']
      },
      {
        id: 'interview-count',
        text: 'How many interviews did we conduct last month?',
        category: 'activities',
        description: 'Get metrics on interview activity',
        keywords: ['interviews', 'count', 'monthly', 'metrics']
      },
      {
        id: 'process-status',
        text: 'What\'s the status of ongoing recruitment processes?',
        category: 'activities',
        description: 'Overview of all active recruitment processes',
        keywords: ['process', 'status', 'recruitment', 'ongoing']
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Get insights and metrics',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800',
    prompts: [
      {
        id: 'recruitment-metrics',
        text: 'Give me a summary of recruitment metrics',
        category: 'analytics',
        description: 'Comprehensive overview of key performance indicators',
        keywords: ['metrics', 'analytics', 'summary', 'kpi']
      },
      {
        id: 'pipeline-status',
        text: 'What\'s our candidate pipeline looking like?',
        category: 'analytics',
        description: 'Pipeline health and stage distribution',
        keywords: ['pipeline', 'funnel', 'distribution', 'health']
      },
      {
        id: 'conversion-rates',
        text: 'Show conversion rates by stage',
        category: 'analytics',
        description: 'Analyze conversion rates between recruitment stages',
        keywords: ['conversion', 'rates', 'stages', 'funnel']
      },
      {
        id: 'source-analysis',
        text: 'Which sources bring the best candidates?',
        category: 'analytics',
        description: 'Analyze candidate source effectiveness',
        keywords: ['sources', 'quality', 'effectiveness', 'roi']
      }
    ]
  },
  {
    id: 'productivity',
    title: 'Productivity',
    description: 'Workflow optimization and tips',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800',
    prompts: [
      {
        id: 'next-actions',
        text: 'What should I focus on next?',
        category: 'productivity',
        description: 'Get AI-powered recommendations for next actions',
        keywords: ['recommendations', 'priority', 'focus', 'next']
      },
      {
        id: 'optimize-workflow',
        text: 'How can I optimize my recruitment workflow?',
        category: 'productivity',
        description: 'Get suggestions for process improvements',
        keywords: ['optimization', 'workflow', 'efficiency', 'process']
      },
      {
        id: 'time-analysis',
        text: 'Where am I spending most of my time?',
        category: 'productivity',
        description: 'Analyze time allocation across activities',
        keywords: ['time', 'analysis', 'allocation', 'efficiency']
      },
      {
        id: 'bottlenecks',
        text: 'Identify bottlenecks in our hiring process',
        category: 'productivity',
        description: 'Find process inefficiencies and delays',
        keywords: ['bottlenecks', 'delays', 'process', 'efficiency']
      }
    ]
  }
];

/**
 * SuggestedPrompts - AI chat prompt suggestions component
 * 
 * Provides categorized suggested prompts to help users get started
 * with the AI assistant and discover available capabilities.
 * 
 * Features:
 * - Categorized prompt organization
 * - Search and filtering
 * - Contextual suggestions
 * - One-click prompt insertion
 * 
 * @example
 * ```tsx
 * <SuggestedPrompts 
 *   onPromptSelect={(prompt) => setInput(prompt)}
 *   showCategories={true}
 * />
 * ```
 */
export function SuggestedPrompts({
  onPromptSelect,
  showCategories = true,
  maxPromptsPerCategory = 4,
  className = ''
}: SuggestedPromptsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filter prompts based on search query
   */
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return promptCategories;

    return promptCategories.map(category => ({
      ...category,
      prompts: category.prompts.filter(prompt =>
        prompt.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    })).filter(category => category.prompts.length > 0);
  }, [searchQuery]);

  /**
   * Get random suggestions from all categories
   */
  const getRandomSuggestions = (count: number = 6) => {
    const allPrompts = promptCategories.flatMap(cat => cat.prompts);
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  /**
   * Handle prompt selection
   */
  const handlePromptSelect = (prompt: string) => {
    onPromptSelect(prompt);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Suggested Prompts</h3>
        </div>
        
        {/* Quick refresh for new suggestions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Could implement random rotation here
            setSelectedCategory(null);
            setSearchQuery('');
          }}
          title="Refresh suggestions"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Categories and prompts */}
      <ScrollArea className="h-96">
        {showCategories && !searchQuery && !selectedCategory ? (
          // Category overview
          <div className="space-y-3">
            {promptCategories.map((category) => (
              <Card 
                key={category.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/20"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${category.color}`}>
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{category.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {category.prompts.length} prompts
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            ))}
            
            {/* Quick suggestions */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Popular Suggestions
              </h4>
              <div className="space-y-2">
                {getRandomSuggestions(3).map((prompt) => (
                  <Button
                    key={prompt.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 text-sm"
                    onClick={() => handlePromptSelect(prompt.text)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p>{prompt.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {prompt.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Prompt list (filtered or category-specific)
          <div className="space-y-4">
            {/* Back button when viewing specific category */}
            {selectedCategory && !searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="mb-4"
              >
                ← Back to Categories
              </Button>
            )}

            {filteredCategories.map((category) => {
              // Filter by selected category if applicable
              if (selectedCategory && category.id !== selectedCategory) {
                return null;
              }

              const displayPrompts = category.prompts.slice(0, maxPromptsPerCategory);

              return (
                <div key={category.id}>
                  {(searchQuery || !selectedCategory) && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded ${category.color}`}>
                        {category.icon}
                      </div>
                      <h4 className="font-medium text-sm">{category.title}</h4>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {displayPrompts.map((prompt) => (
                      <Button
                        key={prompt.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50"
                        onClick={() => handlePromptSelect(prompt.text)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{prompt.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {prompt.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {prompt.keywords.slice(0, 3).map((keyword) => (
                                <Badge
                                  key={keyword}
                                  variant="secondary"
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {category.prompts.length > maxPromptsPerCategory && selectedCategory !== category.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="w-full mt-2"
                    >
                      View all {category.prompts.length} prompts
                    </Button>
                  )}
                </div>
              );
            })}

            {/* No results message */}
            {filteredCategories.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-medium mb-2">No prompts found</h4>
                <p className="text-sm text-muted-foreground">
                  Try different keywords or browse categories
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}