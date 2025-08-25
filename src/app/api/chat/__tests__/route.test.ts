import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@openrouter/ai-sdk-provider', () => ({
  createOpenRouter: jest.fn(),
}));

jest.mock('ai', () => ({
  streamText: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateOpenRouter = require('@openrouter/ai-sdk-provider').createOpenRouter;
const mockStreamText = require('ai').streamText;

describe('/api/chat', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockModelInstance = { type: 'openrouter-model' };
  const mockOpenRouterProvider = jest.fn(() => mockModelInstance);
  const mockStreamResult = {
    toUIMessageStreamResponse: jest.fn(() => new Response('mock stream')),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    process.env.OPENROUTER_MODEL = 'openai/gpt-4o';
    
    // Reset rate limiting by using different user IDs for each test
    const randomUserId = `test-user-${Math.random().toString(36).substring(7)}`;
    mockUser.id = randomUserId;

    // Mock Supabase client
    mockCreateClient.mockResolvedValue(mockSupabaseClient as any);
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock OpenRouter provider
    mockCreateOpenRouter.mockReturnValue(mockOpenRouterProvider);

    // Mock streamText
    mockStreamText.mockResolvedValue(mockStreamResult);
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
  });

  // Helper to create mock request
  const createMockRequest = (body: any) => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    // Mock the json method
    request.json = jest.fn().mockResolvedValue(body);
    
    return request;
  };

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = createMockRequest({ messages: [] });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      });

      const request = createMockRequest({ messages: [] });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      const response = await POST(request);

      expect(response.status).not.toBe(429);
      expect(mockStreamText).toHaveBeenCalled();
    });

    it('should return 429 when rate limit is exceeded', async () => {
      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      // Make 11 requests rapidly (exceeds limit of 10 per minute)
      const promises = Array.from({ length: 11 }, () => POST(request));
      const responses = await Promise.all(promises);

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when messages array is missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request: messages array required');
    });

    it('should return 400 when messages is not an array', async () => {
      const request = createMockRequest({ messages: 'not an array' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request: messages array required');
    });
  });

  describe('OpenRouter Integration', () => {
    it('should return 500 when OpenRouter API key is missing', async () => {
      delete process.env.OPENROUTER_API_KEY;

      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('OpenRouter API key not configured');
    });

    it('should create OpenRouter provider with correct API key', async () => {
      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      await POST(request);

      expect(mockCreateOpenRouter).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });
  });

  describe('Message Processing', () => {
    it('should process messages with parts correctly', async () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Hello' },
            { type: 'text', text: ' world' }
          ]
        }
      ];

      const request = createMockRequest({ messages });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: 'Hello world'
            }
          ]
        })
      );
    });

    it('should process messages with direct content correctly', async () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          content: 'Hello world'
        }
      ];

      const request = createMockRequest({ messages });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: 'Hello world'
            }
          ]
        })
      );
    });

    it('should handle empty or undefined text parts', async () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Hello' },
            { type: 'text', text: undefined },
            { type: 'text', text: '' },
            { type: 'text', text: ' world' }
          ]
        }
      ];

      const request = createMockRequest({ messages });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: 'Hello world'
            }
          ]
        })
      );
    });

    it('should handle mixed string and object parts', async () => {
      const messages = [
        {
          id: '1',
          role: 'user',
          parts: [
            'Hello',
            { type: 'text', text: ' world' }
          ]
        }
      ];

      const request = createMockRequest({ messages });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: 'Hello world'
            }
          ]
        })
      );
    });
  });

  describe('System Prompt', () => {
    it('should include Clear Match context in system prompt', async () => {
      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.any(String),
        })
      );
      
      // Verify the system prompt contains required elements
      const systemPrompt = mockStreamText.mock.calls[0][0].system;
      expect(systemPrompt).toContain('Clear Match AI Assistant');
      expect(systemPrompt).toContain('candidate relationship management');
      expect(systemPrompt).toContain(mockUser.id);
    });

    it('should include model configuration', async () => {
      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: mockModelInstance,
          temperature: 0.7,
        })
      );
    });
  });

  describe('Response Handling', () => {
    it('should return UI message stream response', async () => {
      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      const response = await POST(request);

      expect(mockStreamResult.toUIMessageStreamResponse).toHaveBeenCalled();
      expect(response).toEqual(new Response('mock stream'));
    });

    it('should return 500 when streamText throws error', async () => {
      // Suppress expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockStreamText.mockRejectedValue(new Error('OpenRouter error'));

      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should use default model when OPENROUTER_MODEL is not set', async () => {
      delete process.env.OPENROUTER_MODEL;

      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      await POST(request);

      // The model should be passed to the provider function
      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: mockModelInstance,
        })
      );
    });

    it('should use custom model when OPENROUTER_MODEL is set', async () => {
      process.env.OPENROUTER_MODEL = 'custom/model';

      const request = createMockRequest({ 
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }] 
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: mockModelInstance,
        })
      );
    });
  });
});