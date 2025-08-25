# Chat Feature Fix Plan

## Current Issues Identified

### 1. 🔴 Critical: AI Responses Not Streaming
**Problem**: Chat messages are sent but no AI responses are returned
**Root Cause**: Multiple issues in API implementation
- Incorrect model name format (should be `openai/gpt-4o` not `gpt-4o`)
- Message format conversion issues with AI SDK v5
- Missing proper error handling and logging

### 2. 🔴 Critical: TypeScript `any` Types
**Problem**: Using `any` types violates our code quality standards
**Locations**:
- `/src/app/api/chat/route.ts` - Message type definitions need proper interfaces

### 3. ⚠️ Important: Debug Logging in Production
**Problem**: Console.log statements left in API route
**Impact**: Performance and security concerns

### 4. ⚠️ Important: Error Handling
**Problem**: Generic error messages don't help debugging
**Impact**: Hard to diagnose production issues

## Implementation Plan

### Phase 1: Fix Model Configuration (Immediate)
**Files to Update**: `/src/app/api/chat/route.ts`

```typescript
// Current (incorrect)
const CHAT_API_CONFIG = {
  MODEL: process.env.OPENROUTER_MODEL || 'gpt-4o',
}

// Fixed (correct)
const CHAT_API_CONFIG = {
  MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
}
```

### Phase 2: Fix TypeScript Types
**Files to Update**: `/src/app/api/chat/route.ts`

```typescript
// Proper type definitions from Vercel AI SDK
import { Message as VercelMessage } from 'ai';

interface ChatRequest {
  messages: VercelMessage[];
  // Additional fields if needed
}
```

### Phase 3: Fix Streaming Implementation
Based on OpenRouter documentation, use proper Vercel AI SDK integration:

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const result = await streamText({
  model: openrouter('openai/gpt-4o'),
  system: systemPrompt,
  messages: messages,
  temperature: 0.7,
});

return result.toTextStreamResponse();
```

### Phase 4: Remove Debug Logging
- Remove console.log statements
- Add proper error logging using a logging service
- Add request ID tracking for debugging

### Phase 5: Improve Error Handling
```typescript
try {
  // ... main logic
} catch (error) {
  // Log to server (not console)
  logger.error('Chat API error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    userId: user?.id,
    requestId: generateRequestId(),
  });
  
  // Return user-friendly error
  return NextResponse.json(
    { 
      error: 'Failed to process chat request',
      requestId: generateRequestId(),
    },
    { status: 500 }
  );
}
```

## Testing Plan

### 1. Unit Tests
- [ ] Test message format conversion
- [ ] Test rate limiting logic
- [ ] Test error scenarios

### 2. Integration Tests
- [ ] Test with real OpenRouter API
- [ ] Test streaming responses
- [ ] Test authentication flow

### 3. Manual Testing
- [ ] Send simple message
- [ ] Send complex message with markdown
- [ ] Test error scenarios (invalid API key, rate limit)
- [ ] Test on mobile devices

## Code Quality Checklist

### TypeScript
- [ ] No `any` types
- [ ] Proper interfaces for all data structures
- [ ] Strict mode enabled
- [ ] No type assertions without validation

### Security
- [ ] No console.log in production code
- [ ] API keys not exposed in errors
- [ ] Input validation on all user data
- [ ] Rate limiting properly enforced

### Performance
- [ ] Streaming responses working
- [ ] No blocking operations
- [ ] Proper cleanup of resources
- [ ] Memory usage monitored

## Files to Update

1. `/src/app/api/chat/route.ts` - Main API route
2. `/src/components/ChatInterface.tsx` - UI component (if needed)
3. `/src/lib/types/chat.ts` - Create proper type definitions (new file)
4. `/src/lib/logger.ts` - Create proper logging utility (new file)

## Environment Variables

Ensure these are properly set:
```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o  # Full model name with provider
```

## Success Criteria

1. ✅ User sends message → AI responds with streaming text
2. ✅ No TypeScript errors or warnings
3. ✅ No `any` types in codebase
4. ✅ Proper error messages for debugging
5. ✅ Works on desktop and mobile
6. ✅ Response time < 3 seconds for first token

## Timeline

- **Immediate** (5 min): Fix model name configuration
- **Quick** (15 min): Fix TypeScript types
- **Short** (30 min): Fix streaming implementation
- **Medium** (1 hour): Complete testing and cleanup

## Notes

- OpenRouter requires full model names like `openai/gpt-4o`, not just `gpt-4o`
- Vercel AI SDK v5 has breaking changes from v4
- OpenRouter supports same API as OpenAI but with enhanced features
- Always test with real API calls, not just mocks