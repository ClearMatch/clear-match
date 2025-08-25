# Clear Match AI Chat Feature

## Overview

The Clear Match AI Chat feature provides an intelligent assistant that helps users interact with their recruitment data using natural language. The assistant can query candidate information, analyze activities, and provide insights to streamline recruitment workflows.

## Features

### Core Capabilities
- **Natural Language Queries**: Ask questions in plain English about your data
- **Candidate Data Access**: Query and analyze candidate information
- **Activity Insights**: Get summaries and analytics about recruitment activities
- **Smart Recommendations**: Receive AI-powered suggestions for next actions
- **Real-time Streaming**: See responses as they're generated for better interactivity

### Advanced Features
- **Chat Sessions**: Persistent conversation history with session management
- **Suggested Prompts**: Categorized prompt suggestions to help users get started
- **Global Chat Widget**: Floating chat interface accessible from anywhere
- **Session Management**: Create, switch between, and delete chat sessions
- **Smart Suggestions**: Context-aware prompt recommendations

### Technical Features
- **Authentication Integration**: Secure access with Supabase Auth
- **Database Persistence**: Chat history stored in Supabase with RLS
- **Markdown Support**: Rich text formatting in AI responses
- **Error Handling**: Graceful error recovery and user-friendly messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Auto-scrolling**: Automatically scrolls to show latest messages
- **Context Management**: Global state management with React Context

## Setup

### Prerequisites
1. **OpenRouter API Key**: Required for LLM access
2. **Supabase Configuration**: Must have Supabase auth configured
3. **Environment Variables**: Properly configured `.env.local` file

### Environment Variables
Add the following to your `.env.local` file:
```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o  # Optional, defaults to gpt-4o

# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Current Implementation Status
✅ **COMPLETED**: Basic chat functionality is fully implemented and working:
- Chat API route with OpenRouter integration
- ChatInterface React component with streaming responses
- Authentication integration with Supabase
- Rate limiting and security measures
- Markdown support for AI responses
- Real-time message streaming
- Error handling and loading states

### Installation
The required dependencies are installed and configured:
```bash
# Vercel AI SDK v5
ai: ^5.0.22
@ai-sdk/react: ^2.0.22
@openrouter/ai-sdk-provider: ^1.1.2

# Markdown rendering
react-markdown: ^10.1.0
```

## Usage

### Basic Chat Integration (Current Implementation)
The chat system is currently implemented as a standalone component:

```tsx
// In any page or component
import { ChatInterface } from '@/components/ChatInterface';

export default function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <h1>My Page</h1>
      
      {/* Add chat interface */}
      <ChatInterface className="h-[600px] mt-6" />
    </div>
  );
}
```

### Future: Global Chat Widget Integration
For enhanced user experience, a global chat widget could be added:

```tsx
// Future enhancement - not yet implemented
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatWidget } from '@/components/ChatWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ChatProvider>
          {children}
          
          {/* Global floating chat widget */}
          <ChatWidget 
            position="bottom-right" 
            showSessionManagement={true}
          />
        </ChatProvider>
      </body>
    </html>
  );
}
```

### Direct Component Usage
The ChatInterface component can be used directly in any page:

```tsx
import { ChatInterface } from '@/components/ChatInterface';

function MyComponent() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>Your content here</div>
      <ChatInterface className="h-[600px]" />
    </div>
  );
}
```

### Future: Chat Context Integration
For advanced session management (not yet implemented):

```tsx
// Future enhancement
import { useChat } from '@/contexts/ChatContext';

function MyComponent() {
  const { openChat, currentSession, sessions } = useChat();

  return (
    <div>
      <Button onClick={openChat}>
        Ask AI Assistant ({sessions.length} sessions)
      </Button>
    </div>
  );
}
```

### Page Integration Example
To add chat directly to a specific page:

```tsx
import { ChatInterface } from '@/components/ChatInterface';

export default function AnalysisPage() {
  return (
    <div className="container mx-auto p-4">
      <h1>Data Analysis</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <div>Your analysis content here</div>
        <ChatInterface className="h-[600px]" />
      </div>
    </div>
  );
}
```

### Custom Styling
The ChatInterface accepts a className prop for custom styling:

```tsx
// Full-height chat interface
<ChatInterface className="h-[600px]" />

// With shadow and rounded corners
<ChatInterface className="shadow-lg rounded-xl" />

// Fixed position sidebar
<ChatInterface className="fixed right-4 bottom-4 w-96 h-[500px]" />
```

## User Guide

### Getting Started
1. **Sign In**: Ensure you're logged into Clear Match
2. **Open Chat**: Navigate to any page with the chat interface
3. **Start Chatting**: Type your question and press Enter or click Send

### Example Queries
Here are some example questions you can ask:

#### Candidate Queries
- "Show me all active candidates"
- "Find candidates with Python experience"
- "List candidates in the interview stage"
- "Who are the top-rated candidates?"

#### Activity Insights
- "What are my recent activities?"
- "Show me tasks due this week"
- "How many interviews did we conduct last month?"
- "What's the status of ongoing recruitment processes?"

#### Analytics & Reports
- "Give me a summary of recruitment metrics"
- "What's our candidate pipeline looking like?"
- "Show conversion rates by stage"
- "Which sources bring the best candidates?"

### Tips for Better Results
1. **Be Specific**: More detailed questions get better answers
2. **Use Natural Language**: Write as you would speak
3. **Follow Up**: Ask follow-up questions for clarification
4. **Provide Context**: Mention specific candidates or timeframes when relevant

## Architecture

### Component Structure
```
src/components/
├── ChatInterface.tsx        # Main chat component
├── __tests__/
│   └── ChatInterface.test.tsx  # Component tests
└── ui/                      # Reusable UI components
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    └── ...
```

### Data Flow
1. **User Input** → ChatInterface component
2. **Authentication Check** → Supabase Auth validation
3. **API Request** → `/api/chat` route with streaming
4. **LLM Processing** → OpenRouter handles the request
5. **Database Query** → Supabase data access (when needed)
6. **Response Streaming** → Real-time updates to UI
7. **Markdown Rendering** → Formatted display of response

### Security
- **Authentication Required**: Users must be logged in to use chat
- **Row Level Security**: Database queries respect RLS policies
- **API Protection**: Chat endpoint validates authentication
- **Input Sanitization**: User inputs are sanitized before processing
- **Rate Limiting**: Prevents abuse through request throttling

## Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test ChatInterface.test.tsx
```

### Test Coverage
The ChatInterface component has comprehensive test coverage including:
- Authentication states (loading, error, success)
- User interactions (typing, sending messages)
- Error handling and recovery
- Accessibility features
- Auth state changes

## Troubleshooting

### Common Issues

#### "Authentication Required" Error
- **Cause**: User session expired or not logged in
- **Solution**: Click "Sign In" and re-authenticate

#### Messages Not Sending
- **Cause**: API key not configured or network issues
- **Solution**: 
  1. Check OpenRouter API key in `.env.local`
  2. Restart the development server
  3. Check browser console for errors

#### Slow Response Times
- **Cause**: Large data queries or API latency
- **Solution**: 
  1. Be more specific in queries
  2. Check OpenRouter service status
  3. Optimize database queries if needed

#### Markdown Not Rendering
- **Cause**: Malformed markdown in AI response
- **Solution**: Report the issue with the specific query that caused it

### Debug Mode
To enable debug logging:

```tsx
// In ChatInterface.tsx
const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('Chat error:', error);
    // Add more detailed logging
    console.debug('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  },
  // Enable verbose mode
  experimental_debug: true,
});
```

## Future Enhancements

### Planned Features
- **File Uploads**: Attach documents for analysis
- **Voice Input**: Speech-to-text for queries
- **Export Chat**: Save conversation history
- **Custom Commands**: Shortcuts for common queries
- **Multi-language Support**: Interface localization

### Integration Opportunities
- **HubSpot Sync**: Query HubSpot data through chat
- **Email Integration**: Draft emails from chat
- **Calendar Sync**: Schedule interviews via chat
- **Notification System**: Get alerts for important updates

## API Reference

### ChatInterface Component

#### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `className` | `string` | No | CSS class for custom styling |

#### Example
```tsx
<ChatInterface className="custom-styles" />
```

### Chat API Route

#### Endpoint
`POST /api/chat`

#### Headers
- `Content-Type: application/json`
- `Authorization: Bearer <supabase-token>`

#### Request Body
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your question here"
    }
  ]
}
```

#### Response
Streaming response with AI-generated content in markdown format.

## Contributing

### Development Guidelines
1. Follow existing code patterns and styles
2. Write tests for new features
3. Update documentation for API changes
4. Use TypeScript strict mode
5. Implement proper error handling

### Code Quality
- Run linting: `pnpm lint`
- Type checking: `pnpm exec tsc --noEmit`
- Format code: Follow project Prettier config
- Test coverage: Maintain >80% coverage

### Submitting Changes
1. Create feature branch from `main`
2. Implement changes with tests
3. Update relevant documentation
4. Create pull request with clear description
5. Address review feedback

## Support

For issues or questions:
1. Check this documentation first
2. Review existing GitHub issues
3. Create a new issue with:
   - Clear problem description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details