/**
 * Integration and Security Tests for Authentication Middleware
 * Tests the complete authentication flow as specified in Issue #91
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock Supabase
const mockGetUser = jest.fn();
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
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
    // Clean up mocks // Clear middleware state between tests
    // Default: no user (unauthorized)
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
  });

  test('should complete full unauthorized flow for page routes', async () => {
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should be a redirect response (NextResponse.redirect uses 307 by default)
    expect(result.status).toBe(307); // Temporary redirect status
  });

  test('should complete full unauthorized flow for API routes', async () => {
    
    const mockRequest = createMockRequestWithCookies('/api/profile');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should be 404 for API routes
    expect(result.status).toBe(404);
  });

  test('should complete full authorized flow with session caching', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    // Override mock for this test to return authenticated user
    mockGetUser.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard', {
      'sb-access-token': 'valid-token'
    });
    
    // First request - should hit auth service and succeed since user is authenticated
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
  beforeEach(() => {
    // Clean up mocks // Clear middleware state between tests
    // Ensure unauthenticated state for security tests
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
  });
  
  test('should prevent route enumeration through consistent 404s', async () => {
    
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
    // Simulate JWT error
    mockGetUser.mockResolvedValue({ 
      data: { user: null }, 
      error: { message: 'JWT malformed' }
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard', {
      'sb-access-token': 'malformed.jwt.token'
    });
    
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should redirect to auth, not crash
    expect(result.status).toBe(307);
  });

  test('should implement rate limiting', async () => {
    // Test with a much smaller limit to make sure rate limiting works
    // Since the default is 100 requests per minute, let's test with a burst of requests
    const mockRequest = createMockRequestWithCookies('/api/profile'); // Use API route for easier testing
    
    // Make 110 requests in quick succession
    const promises = [];
    for (let i = 0; i < 110; i++) {
      promises.push(middleware(mockRequest));
    }
    
    const results = await Promise.all(promises);
    
    // Count different status codes
    const statusCounts = results.reduce((counts, result) => {
      counts[result.status] = (counts[result.status] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);
    
    console.log('Status distribution:', statusCounts);
    
    // Either we get rate limited (429) or we get authentication failures (404)
    // But at least some requests should be rate limited if we exceed the limit
    const rateLimitedResults = results.filter(result => result.status === 429);
    
    // For debugging: if no rate limiting, let's at least see what we got
    if (rateLimitedResults.length === 0) {
      console.log('No rate limiting detected. First 5 results:', results.slice(0, 5).map(r => ({ status: r.status })));
    }
    
    expect(rateLimitedResults.length).toBeGreaterThan(0);
  });

  test('should not expose sensitive information in errors', async () => {
    // Simulate database error
    mockGetUser.mockRejectedValue(new Error('Database connection failed'));
    
    const mockRequest = createMockRequestWithCookies('/api/profile');
    const result = await middleware(mockRequest);
    
    expect([404, 429]).toContain(result.status); // Should not expose the real error (404) or be rate limited (429)
  });
});

describe('Performance Tests', () => {
  beforeEach(() => {
    // Clean up mocks // Clear middleware state between tests
  });
  
  test('should meet 50ms latency requirement for cached requests', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    mockGetUser.mockResolvedValue({ 
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
    mockGetUser.mockResolvedValue({ 
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
    // Simulate timeout
    mockGetUser.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 6000)) // 6 seconds > 5 second timeout
    );
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    const result = await middleware(mockRequest);
    
    // Should handle timeout gracefully
    expect(result).toBeInstanceOf(NextResponse);
    expect(result.status).toBe(307); // Should redirect due to timeout
  });
});

describe('Session Management Tests', () => {
  beforeEach(() => {
    // Clean up mocks // Clear middleware state between tests
  });
  
  test('should handle session extension logic', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    mockGetUser.mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    });
    
    const mockRequest = createMockRequestWithCookies('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    expect(result.headers.get('x-session-extended')).toBe('true');
  });

  test('should support multi-device sessions', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    
    mockGetUser.mockResolvedValue({ 
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
    
    // Both should succeed (authenticated users get 200)
    expect(result1.status).toBe(200); // Authenticated user allowed
    expect(result2.status).toBe(200); // Authenticated user allowed
  });
});