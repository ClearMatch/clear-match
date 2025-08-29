'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, UIMessage } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, AlertCircle, Lightbulb } from 'lucide-react';
import { SuggestedPrompts } from '@/components/SuggestedPrompts';
import { ModelSelector } from '@/components/ModelSelector';
import { getDefaultModel } from '@/config/models';

/**
 * Supabase User type for better type safety
 */
interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface ProcessedUIMessage extends UIMessage {
  processedContent: string;
}

// Configuration constants
const CHAT_CONFIG = {
  MAX_MESSAGES: 100, // Limit messages to prevent memory issues
  AUTO_SCROLL_DELAY: 100, // ms delay for auto-scroll
} as const;

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  /** Optional CSS class name to apply to the root Card component */
  className?: string;
}

/**
 * ChatInterface - AI-powered chat assistant for Clear Match
 * 
 * This component provides an interactive chat interface that allows users to:
 * - Query candidate data using natural language
 * - Get insights about activities and recruitment workflows
 * - Receive AI-powered recommendations
 * 
 * Features:
 * - Supabase authentication integration
 * - Real-time streaming responses using Vercel AI SDK
 * - Markdown support for formatted AI responses
 * - Auto-scrolling to latest messages
 * - Loading states and error handling
 * - Responsive design
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ChatInterface />
 * 
 * // With custom styling
 * <ChatInterface className="h-[600px] shadow-lg" />
 * ```
 * 
 * @param {ChatInterfaceProps} props - Component props
 * @returns {JSX.Element} Rendered chat interface
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Input state managed manually since @ai-sdk/react v2 doesn't provide input handling
  const [input, setInput] = useState('');
  
  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Try to get saved model from localStorage, fallback to default
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('clear-match-selected-model');
      return savedModel || getDefaultModel();
    }
    return getDefaultModel();
  });
  
  // Initialize chat with Vercel AI SDK
  const {
    messages,
    sendMessage,
    error,
    status,
  } = useChat();

  // Convert status to loading state (fallback to false if status doesn't exist)
  const isLoading = status ? (status === 'submitted' || status === 'streaming') : false;

  // Limit messages to prevent memory issues and optimize content processing
  const displayMessages = useMemo(() => {
    // Safety check for messages array
    if (!messages || !Array.isArray(messages)) {
      console.log('ChatInterface: messages is not an array:', messages);
      return [];
    }
    
    const limitedMessages = messages.slice(-CHAT_CONFIG.MAX_MESSAGES);
    
    // Process messages with robust error handling for AI SDK v2
    return limitedMessages.map((message, index) => {
      // Safety check for message object
      if (!message || typeof message !== 'object') {
        console.warn(`ChatInterface: Invalid message at index ${index}:`, message);
        return {
          id: `error-${index}`,
          role: 'system',
          processedContent: 'Invalid message',
          parts: []
        } as ProcessedUIMessage;
      }

      let textContent = '';
      
      try {
        // AI SDK v2 uses 'parts' array for message content
        if (message.parts && Array.isArray(message.parts)) {
          const textParts: string[] = [];
          
          message.parts.forEach((part, partIndex) => {
            try {
              if (!part || typeof part !== 'object') {
                console.warn(`Invalid part at ${index}.${partIndex}:`, part);
                return;
              }
              
              // Handle different part types
              switch (part.type) {
                case 'text':
                  if (part.text && typeof part.text === 'string') {
                    textParts.push(part.text);
                  }
                  break;
                  
                case 'tool-result':
                  // Don't display raw tool results - let AI provide clean response
                  break;
                  
                default:
                  // Handle tool parts (typed as tool-${toolName} in v5)
                  if (part.type.startsWith('tool-')) {
                    const toolName = part.type.replace('tool-', '');
                    
                    // Check different tool states
                    if ('state' in part) {
                      switch (part.state) {
                        case 'input-streaming':
                        case 'input-available':
                          textParts.push(`Calling function: ${toolName}`);
                          if (part.input) {
                            const input = typeof part.input === 'string' 
                              ? part.input 
                              : JSON.stringify(part.input, null, 2);
                            textParts.push(`Input: ${input}`);
                          }
                          break;
                        case 'output-available':
                          // Only show function completion status, not raw results
                          // textParts.push(`Function ${toolName} completed`);
                          // Don't show raw JSON output - let AI provide clean response
                          break;
                        case 'output-error':
                          textParts.push(`Function ${toolName} failed`);
                          if (part.errorText) {
                            textParts.push(`Error: ${part.errorText}`);
                          }
                          break;
                      }
                    }
                  }
                  // Handle unknown part types gracefully
                  else if ('text' in part && part.text) {
                    textParts.push(String(part.text));
                  } else if ('content' in part && part.content) {
                    textParts.push(String(part.content));
                  }
                  break;
              }
            } catch (partError) {
              console.error(`Error processing part ${index}.${partIndex}:`, partError);
            }
          });
          
          textContent = textParts.join(' ').trim();
        }
        
        // Fallback for older message formats or direct content
        if (!textContent) {
          if ('content' in message && message.content && typeof message.content === 'string') {
            textContent = message.content;
          } else if ('text' in message && message.text && typeof message.text === 'string') {
            textContent = message.text;
          }
        }
        
        // Final fallback
        if (!textContent) {
          textContent = message.role === 'user' ? 'User message' : 'Assistant message';
        }
        
      } catch (error) {
        console.error(`Error processing message ${index}:`, error);
        console.log('Problematic message:', message);
        textContent = 'Error processing message';
      }
      
      // Return processed message with safe structure
      return {
        id: message.id || `msg-${index}`,
        role: message.role || 'assistant',
        processedContent: textContent,
        parts: message.parts || [],
        createdAt: ('createdAt' in message && message.createdAt) || new Date()
      } as ProcessedUIMessage;
      
    });
  }, [messages]);

  /**
   * Effect: Check and monitor authentication status
   * - Validates current user session on mount
   * - Sets up auth state change listener
   * - Handles sign in/out events
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setAuthError('Authentication failed. Please sign in again.');
          setAuthLoading(false);
          return;
        }
        
        if (!user) {
          setAuthError('Please sign in to use the chat feature.');
          setAuthLoading(false);
          return;
        }
        
        setUser(user);
        setAuthError(null);
        setAuthLoading(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        setAuthError('Failed to verify authentication.');
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setAuthError('Please sign in to use the chat feature.');
          // Chat messages will be cleared automatically when auth state changes
        } else if (session?.user) {
          setUser(session.user);
          setAuthError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Effect: Auto-scroll to bottom when new messages arrive
   * Ensures the latest messages are always visible
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, CHAT_CONFIG.AUTO_SCROLL_DELAY);

    return () => clearTimeout(timer);
  }, [displayMessages]);

  /**
   * Handle input change for textarea
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  /**
   * Handle form submission with proper typing
   */
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    onSubmit(e);
  };

  /**
   * Handle chat form submission
   * - Validates input is not empty
   * - Checks user authentication
   * - Prevents submission while loading
   * 
   * @param {React.FormEvent} e - Form event
   */
  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim() || isLoading || !user) return;
    
    setShowSuggestions(false); // Hide suggestions when user sends message
    
    // Send message using the sendMessage function
    const messageText = input.trim();
    setInput(''); // Clear input immediately
    
    try {
      sendMessage(
        { text: messageText },
        {
          body: {
            model: selectedModel,
          },
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [input, isLoading, user, sendMessage, selectedModel]);

  /**
   * Handle suggested prompt selection
   * @param {string} prompt - The selected prompt text
   */
  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    setShowSuggestions(false);
  };

  /**
   * Handle model selection change
   * @param {string} modelId - The selected model ID
   */
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    // Note: The model change will take effect on the next message
    // due to how useChat body parameter works
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <LoadingSpinner />
            <span className="text-muted-foreground">Initializing chat...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show authentication error
  if (authError || !user) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              {authError || 'Please sign in to use the chat feature.'}
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col border-0 shadow-none bg-transparent", className)}>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border">
          {/* Messages Area with better styling */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mx-auto mb-6 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Welcome to Clear Match AI</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6 text-base leading-relaxed">
                    I&apos;m here to help you analyze candidate data, track recruitment activities, and optimize your workflows. Ask me anything!
                  </p>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="mb-6 rounded-full"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
                  </Button>
                  
                  {showSuggestions && (
                    <div className="mt-6 text-left">
                      <SuggestedPrompts
                        onPromptSelect={handlePromptSelect}
                        showCategories={true}
                        maxPromptsPerCategory={3}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {displayMessages.map((message: ProcessedUIMessage) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                      <AvatarFallback className={
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary border'
                      }>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div
                      className={`px-5 py-3 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-2'
                          : 'bg-gray-50 border mr-2'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <div className="text-sm whitespace-pre-wrap">
                          {message.processedContent}
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>
                            {message.processedContent}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show loading indicator when AI is responding */}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary border">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-50 border px-5 py-3 rounded-2xl shadow-sm mr-2">
                    <div className="flex items-center gap-2">
                      <LoadingSpinner />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="flex gap-3 justify-center">
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Sorry, I encountered an error. Please try again.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t p-6 bg-gray-50/50">
            {/* Model Selector */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  AI Model
                </label>
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <form onSubmit={onSubmit} className="flex gap-4 w-full items-end">
              <div className="flex-1 min-w-0">
                <textarea
                  value={input || ''}
                  onChange={handleInputChange}
                  placeholder="Ask me anything about your data..."
                  disabled={isLoading}
                  rows={3}
                  className="w-full p-4 rounded-xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base leading-relaxed"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Create a synthetic form event for submission
                      const form = e.currentTarget.form;
                      if (form) {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                        form.dispatchEvent(submitEvent);
                      }
                    }
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="h-14 w-14 rounded-2xl flex-shrink-0 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
                <Send className="h-6 w-6" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              AI can make mistakes. Verify important information. Press Shift + Enter for new line.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}