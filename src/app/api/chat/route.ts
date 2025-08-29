import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, CoreMessage, tool } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel, getModelById } from '@/config/models';
import { z } from 'zod';
import { 
  searchContacts,
  createActivity,
  getRecentActivities,
  getContactById,
  getContactActivities,
  getContactStats,
  updateActivityStatus,
  type SearchContactsParams,
  type CreateActivityParams,
  type GetContactStatsParams,
  type FormattedResult
} from '@/lib/chat-functions';
import type { Contact } from '@/components/Contact/ContactList/Types';
import type { ActivityData } from '@/components/MyTask/Services/Types';

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
  model?: string;
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
    const { messages, model: requestedModel } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Determine which model to use
    let selectedModel = requestedModel || getDefaultModel();
    
    // Validate the requested model exists in our configuration
    if (requestedModel && !getModelById(requestedModel)) {
      console.warn(`Unknown model requested: ${requestedModel}, falling back to default`);
      selectedModel = getDefaultModel();
    }

    console.log(`Using AI model: ${selectedModel} for user: ${user.id}`);

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

    // Define tools using the tool() helper from AI SDK
    // @ts-ignore - AI SDK v5 tool typing compatibility issue
    const tools = {
      searchContacts: tool({
        description: 'Search for contacts based on various criteria like name, company, tech stack, engagement score, etc.',
        parameters: z.object({
          searchTerm: z.string().optional().describe('Search term to match against names, companies, or job titles'),
          techStack: z.array(z.string()).optional().describe('Array of technologies/skills to search for'),
          company: z.string().optional().describe('Company name to search for'),
          engagementScoreMin: z.number().optional().describe('Minimum engagement score (1-10)'),
          yearsExperienceMin: z.number().optional().describe('Minimum years of experience'),
          isActiveLooking: z.boolean().optional().describe('Whether to filter for actively looking candidates'),
          limit: z.number().optional().describe('Maximum number of results to return (default: 20)')
        }),
        // @ts-ignore - AI SDK v5 tool typing compatibility
        execute: async (params: SearchContactsParams) => {
          console.log('🔍 Executing searchContacts:', params);
          const result = await searchContacts(params);
          console.log('✅ searchContacts result:', result);
          return result;
        },
      }),
      
      createActivity: tool({
        description: 'Create a new activity or task, optionally associated with a contact',
        parameters: z.object({
          contactId: z.string().optional().describe('ID of the contact this activity is for (optional)'),
          type: z.enum([
            // Original types from database constraint
            'none', 'email', 'call', 'video', 'text',
            // New event types from GitHub issue #138
            'new-job-posting', 'open-to-work', 'laid-off', 'interview', 
            'funding-news', 'company-layoffs', 'birthday', 'meeting',
            'm-and-a-activity', 'email-reply-received', 'follow-up', 
            'holiday', 'personal-interest-tag', 'dormant-status'
          ]).default('follow-up').describe('Type of activity (must match database constraint exactly)'),
          subject: z.string().describe('Brief subject/title of the activity'),
          description: z.string().describe('Detailed description of the activity'),
          dueDate: z.string().optional().describe('Due date in ISO format (optional, defaults to 1 week from now)'),
          priority: z.number().min(1).max(4).optional().default(2).describe('Priority level: 1=Low, 2=Medium, 3=High, 4=Critical')
        }),
        // @ts-ignore - AI SDK v5 tool typing compatibility
        execute: async (params: CreateActivityParams) => {
          console.log('🛠️ Executing createActivity with params:', JSON.stringify(params, null, 2));
          console.log('🔍 Activity type received:', params.type, 'typeof:', typeof params.type);
          
          // Ensure defaults are applied correctly (AI SDK v5 compatibility fix)
          const processedParams: CreateActivityParams = {
            ...params,
            type: params.type || 'follow-up', // Explicit default handling
            priority: params.priority || 2    // Explicit default handling
          };
          
          console.log('🔄 Processed params:', JSON.stringify(processedParams, null, 2));
          console.log('🔍 Final activity type to database:', processedParams.type);
          
          const result = await createActivity(processedParams, user.id);
          console.log('✅ createActivity result:', result);
          return result;
        },
      }),
      
      getRecentActivities: tool({
        description: 'Get recent activities/tasks for the current user',
        parameters: z.object({
          limit: z.number().optional().describe('Number of activities to retrieve (default: 20)')
        }),
        // @ts-ignore - AI SDK v5 tool typing compatibility
        execute: async (params: { limit?: number }) => {
          console.log('📋 Executing getRecentActivities:', params);
          const result = await getRecentActivities(params.limit);
          console.log('✅ getRecentActivities result:', result);
          return result;
        },
      }),
      
      getContactById: tool({
        description: 'Get detailed information about a specific contact by ID',
        parameters: z.object({
          contactId: z.string().describe('The unique ID of the contact')
        }),
        // @ts-ignore - AI SDK v5 tool typing compatibility
        execute: async (params: { contactId: string }) => {
          console.log('👤 Executing getContactById:', params);
          const result = await getContactById(params.contactId);
          console.log('✅ getContactById result:', result);
          return result;
        },
      }),
      
      getContactActivities: tool({
        description: 'Get recent activities/tasks for a specific contact',
        parameters: z.object({
          contactId: z.string().describe('The ID of the contact'),
          limit: z.number().optional().describe('Number of activities to retrieve (default: 10)')
        }),
        // @ts-ignore - AI SDK v5 tool typing compatibility
        execute: async (params: { contactId: string; limit?: number }) => {
          console.log('📝 Executing getContactActivities:', params);
          const result = await getContactActivities(params.contactId, params.limit);
          console.log('✅ getContactActivities result:', result);
          return result;
        },
      }),
      
      getContactStats: tool({
        description: 'Get statistical insights about contacts (total count, engagement, top companies, etc.)',
        parameters: z.object({
          timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional().describe('Timeframe for statistics (default: month)')
        }),
        // @ts-ignore - AI SDK v5 tool typing compatibility
        execute: async (params: GetContactStatsParams) => {
          console.log('📊 Executing getContactStats:', params);
          const result = await getContactStats(params);
          console.log('✅ getContactStats result:', result);
          return result;
        },
      }),
      
      updateActivityStatus: tool({
        description: 'Update the status of an activity/task',
        parameters: z.object({
          activityId: z.string().describe('The ID of the activity to update'),
          status: z.enum(['todo', 'in-progress', 'done']).describe('New status for the activity')
        }),
        // @ts-ignore - AI SDK v5 tool typing compatibility
        execute: async (params: { activityId: string; status: 'todo' | 'in-progress' | 'done' }) => {
          console.log('🔄 Executing updateActivityStatus:', params);
          const result = await updateActivityStatus(params.activityId, params.status);
          console.log('✅ updateActivityStatus result:', result);
          return result;
        },
      }),
    };

    console.log('🚀 Starting streamText with tools for user:', user.id);
    console.log('📝 Messages count:', formattedMessages.length);
    console.log('🛠️ Tools available:', Object.keys(tools));

    // Create the chat completion with streaming and tools
    const result = await streamText({
      model: openrouter(selectedModel),
      system: systemPrompt,
      messages: formattedMessages,
      tools,
      temperature: CHAT_API_CONFIG.TEMPERATURE,
    });

    console.log('✅ streamText created successfully');

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