/**
 * Performance Testing for Authentication Middleware
 * Validates the < 50ms latency requirement from Issue #91
 */

import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';

// Mock Supabase for performance testing
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

function createMockRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const mockCookies = new Map();
  // Add default cookie if none provided
  if (Object.keys(cookies).length === 0) {
    mockCookies.set('sb-access-token', { value: 'mock-token', name: 'sb-access-token' });
  } else {
    Object.entries(cookies).forEach(([key, value]) => {
      mockCookies.set(key, { value, name: key });
    });
  }
  
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
          'x-forwarded-for': '192.168.1.100',
        };
        return headers[name] || null;
      }),
    },
    url: `http://localhost:3000${pathname}`,
  } as unknown as NextRequest;
}

describe('Middleware Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should meet 50ms requirement for authenticated requests', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'user123' } }, 
      error: null 
    });

    const mockRequest = createMockRequest('/dashboard');
    
    const startTime = process.hrtime.bigint();
    const result = await middleware(mockRequest);
    const endTime = process.hrtime.bigint();
    
    const durationMs = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    console.log(`Authenticated request duration: ${durationMs.toFixed(2)}ms`);
    
    // Should meet the 50ms requirement
    expect(durationMs).toBeLessThan(50);
    
    // Check middleware reported duration
    const reportedDuration = result.headers.get('x-middleware-duration');
    expect(parseInt(reportedDuration || '0')).toBeLessThan(50);
  });

  test('should be even faster for cached requests', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'user123' } }, 
      error: null 
    });

    const mockRequest = createMockRequest('/dashboard');
    
    // First request to populate cache
    await middleware(mockRequest);
    
    // Second request should be cached and faster
    const startTime = process.hrtime.bigint();
    const result = await middleware(mockRequest);
    const endTime = process.hrtime.bigint();
    
    const durationMs = Number(endTime - startTime) / 1_000_000;
    
    console.log(`Cached request duration: ${durationMs.toFixed(2)}ms`);
    
    // Cached requests should be very fast
    expect(durationMs).toBeLessThan(10);
    expect(result.headers.get('x-auth-cache')).toBe('hit');
  });

  test('should handle static files instantly', async () => {
    const staticRoutes = [
      '/_next/static/test.js',
      '/favicon.ico',
      '/logo.png'
    ];

    for (const route of staticRoutes) {
      const mockRequest = createMockRequest(route);
      
      const startTime = process.hrtime.bigint();
      const result = await middleware(mockRequest);
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1_000_000;
      
      console.log(`Static file ${route} duration: ${durationMs.toFixed(2)}ms`);
      
      // Static files should be nearly instant
      expect(durationMs).toBeLessThan(5);
    }
  });

  test('should handle public routes quickly', async () => {
    const publicRoutes = ['/auth', '/signup', '/forgot-password'];

    for (const route of publicRoutes) {
      const mockRequest = createMockRequest(route);
      
      const startTime = process.hrtime.bigint();
      const result = await middleware(mockRequest);
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1_000_000;
      
      console.log(`Public route ${route} duration: ${durationMs.toFixed(2)}ms`);
      
      // Public routes should be very fast
      expect(durationMs).toBeLessThan(10);
    }
  });

  test('should handle unauthorized requests within limit', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });

    const mockRequest = createMockRequest('/dashboard');
    
    const startTime = process.hrtime.bigint();
    const result = await middleware(mockRequest);
    const endTime = process.hrtime.bigint();
    
    const durationMs = Number(endTime - startTime) / 1_000_000;
    
    console.log(`Unauthorized request duration: ${durationMs.toFixed(2)}ms`);
    
    // Even unauthorized requests should be fast
    expect(durationMs).toBeLessThan(50);
  });

  test('should maintain performance under load', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'user123' } }, 
      error: null 
    });

    const concurrentRequests = 10;
    const requests = Array(concurrentRequests).fill(null).map(() => 
      createMockRequest('/dashboard')
    );

    const startTime = process.hrtime.bigint();
    
    const results = await Promise.all(
      requests.map(req => middleware(req))
    );
    
    const endTime = process.hrtime.bigint();
    const totalDurationMs = Number(endTime - startTime) / 1_000_000;
    const avgDurationMs = totalDurationMs / concurrentRequests;
    
    console.log(`${concurrentRequests} concurrent requests:`);
    console.log(`Total time: ${totalDurationMs.toFixed(2)}ms`);
    console.log(`Average per request: ${avgDurationMs.toFixed(2)}ms`);
    
    // All requests should succeed
    expect(results).toHaveLength(concurrentRequests);
    
    // Average should still be reasonable
    expect(avgDurationMs).toBeLessThan(100);
  });

  test('should report performance warnings for slow requests', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    
    // Simulate slow auth service
    mockSupabase.auth.getUser.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ 
          data: { user: { id: 'user123' } }, 
          error: null 
        }), 60) // 60ms delay
      )
    );

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const mockRequest = createMockRequest('/dashboard');
    const result = await middleware(mockRequest);
    
    // Should have logged a performance warning
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Middleware performance warning')
    );
    
    consoleSpy.mockRestore();
  });
});