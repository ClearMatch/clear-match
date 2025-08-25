import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, CoreMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type definitions for message formats from AI SDK
interface MessagePart {
  type: 'text';
  text?: string;
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts?: MessagePart[];
  content?: string;
}

interface ChatRequestBody {
  messages: UIMessage[];
}

// Configuration constants
const CHAT_API_CONFIG = {
  RATE_LIMIT: 10, // requests per minute
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute in ms
  MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
  TEMPERATURE: 0.7,
} as const;

// Simple in-memory rate limiting (use Redis in production)
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = userRequestCounts.get(userId);
  
  if (!userRequests || now > userRequests.resetTime) {
    // Reset or create new tracking
    userRequestCounts.set(userId, { count: 1, resetTime: now + CHAT_API_CONFIG.RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userRequests.count >= CHAT_API_CONFIG.RATE_LIMIT) {
    return false;
  }
  
  userRequests.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse the request body
    const body: ChatRequestBody = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Convert UI messages to the format expected by streamText
    // Handle both old format (with parts) and new format (direct content)
    const formattedMessages: CoreMessage[] = messages.map((msg: UIMessage): CoreMessage => {
      // Handle new message format from @ai-sdk/react v2
      if (msg.parts && Array.isArray(msg.parts)) {
        const textContent = msg.parts
          .filter((part: MessagePart | string) => {
            // Handle both object parts and string parts
            if (typeof part === 'string') return true;
            return part.type === 'text' && part.text;
          })
          .map((part: MessagePart | string) => {
            if (typeof part === 'string') return part;
            return part.text;
          })
          .filter((text): text is string => text !== undefined && text !== '')
          .join('');
        return {
          role: msg.role,
          content: textContent || ''
        };
      }
      // Handle standard format
      return {
        role: msg.role,
        content: msg.content || ''
      };
    });

    // System prompt with Clear Match context
    const systemPrompt = `You are the Clear Match AI Assistant, a helpful AI that assists with candidate relationship management and recruiting tasks.

Context about Clear Match:
- Clear Match is a comprehensive candidate relationship management platform
- Users manage candidates, tasks, and recruitment workflows
- The platform integrates with HubSpot CRM and Clay.com for data enrichment
- Users can track job postings, candidate activities, and recruitment metrics

Your capabilities:
- Answer questions about recruiting best practices
- Help with candidate data analysis and insights
- Provide guidance on workflow optimization
- Assist with understanding recruitment metrics
- Offer suggestions for improving candidate engagement

Guidelines:
- Be helpful, professional, and concise
- Focus on recruiting and talent management topics
- If asked about technical implementation details, provide clear explanations
- When discussing data analysis, suggest actionable insights
- Always maintain a supportive and encouraging tone

Current user ID: ${user.id}`;

    // Validate OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Create OpenRouter provider instance
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Create the chat completion with streaming
    const result = await streamText({
      model: openrouter(CHAT_API_CONFIG.MODEL),
      system: systemPrompt,
      messages: formattedMessages,
      temperature: CHAT_API_CONFIG.TEMPERATURE,
    });

    // Return the streaming response in UI message format
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}