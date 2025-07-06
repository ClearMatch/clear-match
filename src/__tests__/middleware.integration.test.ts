/**
 * Integration and Security Tests for Authentication Middleware
 * Tests the complete authentication flow as specified in Issue #91
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../middleware';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

// Helper to create mock request with cookies
function createMockRequestWithCookies(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const mockCookies = new Map();
  Object.entries(cookies).forEach(([key, value]) => {
    mockCookies.set(key, { value, name: key });
  });

  return {
    nextUrl: {
      pathname,
      toString: () => `http://localhost:3000${pathname}`,
    },
    cookies: {
      get: jest.fn((name: string) => mockCookies.get(name)),
      set: jest.fn(),
      delete: jest.fn(),
    },
    headers: {
      get: jest.fn((name: string) => {
        const headers: Record<string, string> = {
          'user-agent': 'test-agent',
          'x-forwarded-for': '192.168.1.1',
        };
        return headers[name] || null;
      }),
    },
    url: `http://localhost:3000${pathname}`,
  } as unknown as NextRequest;
}

describe('Integration Tests - Full Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing cache/rate limit data
    jest.resetModules();
  });

  test('should complete full unauthorized flow for page routes', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should be a redirect response
    expect(result.status).toBe(302); // Redirect status
  });

  test('should complete full unauthorized flow for API routes', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/api/profile');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should be 404 for API routes
    expect(result.status).toBe(404);
  });

  test('should complete full authorized flow with session caching', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard', {
      'sb-access-token': 'valid-token'
    });
    
    // First request - should hit auth service
    const result1 = await middleware(mockRequest);
    expect(result1).toBeInstanceOf(NextResponse);
    expect(result1.status).toBe(200);
    
    // Second request with same session - should use cache
    const result2 = await middleware(mockRequest);
    expect(result2).toBeInstanceOf(NextResponse);
    expect(result2.status).toBe(200);
    
    // Verify cache headers
    expect(result2.headers.get('x-auth-cache')).toBe('hit');
  });
});

describe('Security Tests - Attack Prevention', () => {
  test('should prevent route enumeration through consistent 404s', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
    
    const protectedApiRoutes = [
      '/api/profile',
      '/api/admin', // Non-existent route
      '/api/secret', // Non-existent route
      '/api/internal', // Non-existent route
    ];
    
    for (const route of protectedApiRoutes) {
      const mockRequest = createMockRequestWithCookies(route);
      const result = await middleware(mockRequest);
      
      // All should return consistent 404
      expect(result.status).toBe(404);
    }
  });

  test('should handle malformed tokens gracefully', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    
    // Simulate JWT error
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: { message: 'JWT malformed' }
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard', {
      'sb-access-token': 'malformed.jwt.token'
    });
    
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should redirect to auth, not crash
    expect(result.status).toBe(302);
  });

  test('should implement rate limiting', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    
    // Make multiple requests rapidly (more than rate limit)
    const promises = [];
    for (let i = 0; i < 105; i++) { // Exceed the 100 per minute limit
      promises.push(middleware(mockRequest));
    }
    
    const results = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimitedResults = results.filter(result => result.status === 429);
    expect(rateLimitedResults.length).toBeGreaterThan(0);
  });

  test('should not expose sensitive information in errors', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    
    // Simulate database error
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Database connection failed'));
    
    const mockRequest = createMockRequestWithCookies('/api/profile');
    const result = await middleware(mockRequest);
    
    expect(result.status).toBe(404); // Should not expose the real error
  });
});

describe('Performance Tests', () => {
  test('should meet 50ms latency requirement for cached requests', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard', {
      'sb-access-token': 'valid-token'
    });
    
    // First request to populate cache
    await middleware(mockRequest);
    
    // Second request should be fast (cached)
    const startTime = Date.now();
    const result = await middleware(mockRequest);
    const duration = Date.now() - startTime;
    
    // Cached requests should be very fast
    expect(duration).toBeLessThan(10); // Even stricter than 50ms for cached
    expect(result.headers.get('x-auth-cache')).toBe('hit');
  });

  test('should add performance monitoring headers', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'user123' } }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result.headers.get('x-middleware-duration')).toBeDefined();
    expect(result.headers.get('x-session-user')).toBe('user123');
    expect(result.headers.get('x-rate-limit-remaining')).toBeDefined();
  });

  test('should handle timeout scenarios gracefully', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    
    // Simulate timeout
    mockSupabase.auth.getUser.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 6000)) // 6 seconds > 5 second timeout
    );
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    const result = await middleware(mockRequest);
    
    // Should handle timeout gracefully
    expect(result).toBeInstanceOf(NextResponse);
    expect(result.status).toBe(503); // Service unavailable
  });
});

describe('Session Management Tests', () => {
  test('should handle session extension logic', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    expect(result.headers.get('x-session-extended')).toBe('true');
  });

  test('should support multi-device sessions', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    });
    
    // Simulate different devices/IPs
    const request1 = createMockRequestWithCookies('/dashboard');
    const request2 = createMockRequestWithCookies('/dashboard');
    
    // Modify IP for second request
    request2.headers.get = jest.fn((name: string) => {
      if (name === 'x-forwarded-for') return '192.168.1.2';
      return request1.headers.get(name);
    });
    
    const result1 = await middleware(request1);
    const result2 = await middleware(request2);
    
    // Both should succeed
    expect(result1.status).toBe(200);
    expect(result2.status).toBe(200);
  });
});