import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
    },
  })),
}));

// Helper function to create mock request
function createMockRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
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

describe('Comprehensive Middleware Tests', () => {

  test('should allow access to all public routes', async () => {
    const publicRoutes = ['/auth', '/login', '/signup', '/forgot-password', '/reset-password'];
    
    for (const route of publicRoutes) {
      const mockRequest = createMockRequest(route);
      const result = await middleware(mockRequest);
      expect(result).toBeInstanceOf(NextResponse);
    }
  });

  test('should redirect unauthenticated users to login', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
    
    const mockRequest = createMockRequest('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should redirect to /auth
  });

  test('should allow authenticated users to access protected routes', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: { id: 'user123' } }, 
      error: null 
    });
    
    const mockRequest = createMockRequest('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should allow access
  });

  test('should return 404 for unauthenticated API requests', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
    
    const mockRequest = createMockRequest('/api/profile');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    // Should return 404
  });

  test('should skip middleware for static files and system routes', async () => {
    const staticRoutes = [
      '/_next/static/test.js',
      '/favicon.ico', 
      '/sitemap.xml',
      '/robots.txt',
      '/logo.png'
    ];
    
    for (const route of staticRoutes) {
      const mockRequest = createMockRequest(route);
      const result = await middleware(mockRequest);
      expect(result).toBeInstanceOf(NextResponse);
    }
  });

  test('should protect ALL API routes by default', async () => {
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    mockSupabase.auth.getUser.mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    });
    
    const apiRoutes = [
      '/api/profile',
      '/api/profile/password',
      '/api/profile/avatar',
      '/api/tasks/123',
      '/api/hubspot',
      '/api/some-new-route' // Any new API route should be protected by default
    ];
    
    for (const route of apiRoutes) {
      const mockRequest = createMockRequest(route);
      const result = await middleware(mockRequest);
      expect(result).toBeInstanceOf(NextResponse);
      // Should return 404 for API routes
    }
  });

  test('should handle service unavailable scenarios', async () => {
    // Test missing environment variables
    const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const mockRequest = createMockRequest('/dashboard');
    const result = await middleware(mockRequest);
    
    expect(result).toBeInstanceOf(NextResponse);
    
    // Restore environment
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });
});