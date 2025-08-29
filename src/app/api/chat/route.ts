import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool, convertToModelMessages, UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel, getModelById } from '@/config/models';
import { 
  searchContacts, 
  getContactById, 
  createActivity, 
  getContactActivities, 
  getContactStats, 
  getRecentActivities, 
  updateActivityStatus 
} from '@/lib/chat-functions';
import { z } from 'zod';

interface ChatRequestBody {
  messages: UIMessage[];
  model?: string;
}

// Configuration constants
const CHAT_API_CONFIG = {
  RATE_LIMIT: 20, // Increased for function calling
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute in ms
  MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
  TEMPERATURE: 0.7,
} as const;

// Simple in-memory rate limiting (use Redis in production)
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * WORKAROUND for AI SDK v5 compatibility issue
 * 
 * Problem: AI_MessageConversionError: Unsupported tool part state
 * Root Cause: AI SDK v5's convertToModelMessages doesn't handle tool parts with certain states
 * Specifically, parts with state "input-available" cause conversion errors
 * 
 * This function filters out problematic tool parts before message conversion.
 * 
 * Tracking: This is a temporary workaround for AI SDK v5.0.x
 * TODO: Monitor https://github.com/vercel/ai/issues for resolution
 * TODO: Remove this workaround when AI SDK fixes the convertToModelMessages function
 * 
 * Created: 2024-08-29 - Part of PR #211 AI chatbot implementation
 * Status: Required for function calling to work with streaming responses
 * 
 * @param messages Array of UIMessage objects from @ai-sdk/react
 * @returns Cleaned messages compatible with convertToModelMessages
 */
function cleanUIMessage(messages: UIMessage[]) {
  return messages.map((message) => {
    if (message.parts && Array.isArray(message.parts)) {
      return {
        ...message,
        parts: message.parts.filter((part) => {
          // Filter out tool parts with problematic states
          if (typeof part === "object" && part !== null && "state" in part) {
            return (part as any).state !== "input-available"
          }
          return true
        }),
      }
    }
    return message
  })
}

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

    // Convert UI messages to model format - essential for function calling in AI SDK v5
    // Apply workaround for tool part state issues
    const cleanedMessages = cleanUIMessage(messages);
    const modelMessages = convertToModelMessages(cleanedMessages);

    // Enhanced system prompt with function calling capabilities
    const systemPrompt = `You are the Clear Match AI Assistant, a powerful AI that helps with candidate relationship management and recruiting tasks. You have access to real database functions to query contacts, create tasks, and analyze recruitment data.

**Your Core Capabilities:**
- Search and analyze candidate data in real-time
- Create activities, tasks, and follow-ups
- Provide recruitment insights and statistics
- Help with workflow optimization
- Answer questions using actual user data

**Available Functions:**
- searchContacts: Find candidates by name, company, skills, engagement score, etc.
- getContactById: Get detailed information about a specific contact
- createActivity: Create tasks, follow-ups, interviews, meetings for contacts
- getContactActivities: View activity history for contacts
- getContactStats: Get recruitment metrics and insights
- getRecentActivities: View recent tasks and activities
- updateActivityStatus: Mark tasks as complete or update their status

**CRITICAL Response Guidelines - MUST FOLLOW EXACTLY:**
1. **Always use functions when users ask for data**: Don't guess or make up information
2. **NEVER SHOW RAW JSON**: This is CRITICAL - you must interpret function results and respond naturally
3. **Extract specific information requested**: If user asks for "description", only provide the description value
4. **Be conversational and helpful**: Respond as if talking to a person, not showing technical data
5. **Include actionable links**: When creating tasks or activities, provide links to view them (use /task/show/[id] format)

**MANDATORY Response Format Examples:**
- User asks "What is the description of the last task?" → Function returns {data: {mostRecent: {description: "Scheduled call with John Doe"}}} → You respond: "Scheduled call with John Doe" (NEVER show the JSON)
- User asks "Create a task" → Function returns {success: true, link: "/task/show/abc"} → You respond: "✅ Task created successfully! You can view it [here](/task/show/abc)"
- User asks "Search for developers" → Function returns {message: "Found 3 contacts"} → You respond: "I found 3 developers in your database..."

**CRITICAL: How to handle FormattedResult objects:**
When functions return {success: true, message: "...", data: {...}, link: "..."}:
- Extract the specific information the user requested from the data object
- Use the message as context but don't repeat it verbatim
- Include links when provided
- Give direct answers, not technical summaries

**ABSOLUTELY FORBIDDEN:**
❌ Showing function results like: "Function getRecentActivities completed Result: {\"success\": true, \"data\": {...}}"
❌ Displaying raw JSON objects or formatted JSON to users
❌ Saying "Function X completed Result:" followed by technical data
❌ Showing internal data structures or API responses

**CORRECT Behavior:**
✅ When function returns data, extract what the user asked for and respond naturally
✅ If user asks for "description of last task" and function returns {description: "Call John"}, you say: "Call John"
✅ Be helpful and conversational, never technical

**You are talking to end users, not developers. They should never see technical data.**

**SPECIAL INSTRUCTION FOR TASK DESCRIPTIONS:**
When user asks "What is the description of the last task?" you MUST:
1. Call getRecentActivities function
2. After the function returns, you MUST respond with text
3. Extract the description from data.mostRecent.description
4. Respond ONLY with that description text (no JSON, no explanation)
5. Example: If description is "Scheduled call with John Doe", respond exactly: "Scheduled call with John Doe"
6. CRITICAL: Always provide a final text response after calling any function

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

    // Create the chat completion with streaming and function calling
    const result = await streamText({
      model: openrouter(selectedModel),
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        searchContacts: tool({
          description: 'Search for contacts based on various criteria like name, company, tech stack, engagement score, etc.',
          inputSchema: z.object({
            searchTerm: z.string().optional().describe('Search term to match against names, companies, or job titles'),
            techStack: z.array(z.string()).optional().describe('Array of technologies/skills to search for (e.g., ["Python", "React"])'),
            company: z.string().optional().describe('Company name to search for'),
            engagementScoreMin: z.number().optional().describe('Minimum engagement score (1-10)'),
            yearsExperienceMin: z.number().optional().describe('Minimum years of experience'),
            isActiveLooking: z.boolean().optional().describe('Whether to filter for actively looking candidates'),
            limit: z.number().optional().describe('Maximum number of results to return (default: 20)')
          }),
          execute: async (params) => {
            console.log('🔍 searchContacts tool called with params:', params);
            const result = await searchContacts(params);
            console.log('🔍 searchContacts tool result:', result);
            return result;
          }
        }),
        getContactById: tool({
          description: 'Get detailed information about a specific contact by ID',
          inputSchema: z.object({
            contactId: z.string().describe('The unique ID of the contact')
          }),
          execute: async ({ contactId }) => {
            return await getContactById(contactId);
          }
        }),
        createActivity: tool({
          description: 'Create a new activity or task, optionally associated with a contact',
          inputSchema: z.object({
            contactId: z.string().optional().describe('ID of the contact this activity is for (optional)'),
            type: z.enum(['follow-up', 'interview', 'call', 'email', 'meeting', 'text', 'video']).describe('Type of activity'),
            subject: z.string().describe('Brief subject/title of the activity'),
            description: z.string().describe('Detailed description of the activity'),
            dueDate: z.string().optional().describe('Due date in ISO format (optional, defaults to 1 week from now)'),
            priority: z.number().min(1).max(4).optional().describe('Priority level: 1=Low, 2=Medium, 3=High, 4=Critical')
          }),
          execute: async (params) => {
            console.log('📝 createActivity tool called with params:', params);
            try {
              const result = await createActivity(params, user.id);
              console.log('📝 createActivity tool result:', result);
              return result;
            } catch (error) {
              console.error('❌ createActivity tool ERROR:', error);
              throw error;
            }
          }
        }),
        getContactActivities: tool({
          description: 'Get recent activities/tasks for a specific contact',
          inputSchema: z.object({
            contactId: z.string().describe('The ID of the contact'),
            limit: z.number().optional().describe('Number of activities to retrieve (default: 10)')
          }),
          execute: async ({ contactId, limit }) => {
            return await getContactActivities(contactId, limit);
          }
        }),
        getContactStats: tool({
          description: 'Get statistical insights about contacts (total count, engagement, top companies, etc.)',
          inputSchema: z.object({
            timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional().describe('Timeframe for statistics (default: month)')
          }),
          execute: async (params) => {
            console.log('📊 getContactStats tool called with params:', params);
            const result = await getContactStats(params);
            console.log('📊 getContactStats tool result:', result);
            return result;
          }
        }),
        getRecentActivities: tool({
          description: 'Get recent activities/tasks for the current user',
          inputSchema: z.object({
            limit: z.number().optional().describe('Number of activities to retrieve (default: 20)')
          }),
          execute: async ({ limit }) => {
            console.log('📝 getRecentActivities tool called with params:', { limit });
            try {
              const result = await getRecentActivities(limit);
              console.log('📝 getRecentActivities tool result:', result);
              return result;
            } catch (error) {
              console.error('❌ getRecentActivities tool ERROR:', error);
              throw error;
            }
          }
        }),
        updateActivityStatus: tool({
          description: 'Update the status of an activity/task',
          inputSchema: z.object({
            activityId: z.string().describe('The ID of the activity to update'),
            status: z.enum(['todo', 'in-progress', 'done']).describe('New status for the activity')
          }),
          execute: async ({ activityId, status }) => {
            return await updateActivityStatus(activityId, status);
          }
        })
      },
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