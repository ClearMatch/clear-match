/**
 * Authentication Middleware for Clear Match
 * 
 * This middleware provides secure authentication for all pages and API routes.
 * It uses Supabase Auth to validate user sessions and implements the following security measures:
 * 
 * - Protects all pages except public routes (auth page)
 * - Redirects unauthenticated users to login page with redirect parameter
 * - Returns 404 for unauthenticated API requests (security through obscurity)
 * - Handles token refresh automatically through Supabase SSR client
 * - Skips static files and Next.js internal routes for performance
 * 
 * Public Routes:
 * - /auth - Authentication page
 * - /api/auth - Authentication API endpoints
 * 
 * Protected Routes:
 * - All dashboard routes (/dashboard, /contacts, /tasks, etc.)
 * - All API routes (/api/profile, /api/tasks, /api/hubspot, etc.)
 * 
 * Implementation follows Next.js 13+ middleware patterns and Supabase SSR best practices.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public routes that don't require authentication (whitelist approach for security)
const PUBLIC_ROUTES = [
  '/auth',           // Main authentication page
  '/login',          // Alternative login route (if exists)
  '/signup',         // User registration
  '/forgot-password', // Password recovery
  '/reset-password', // Password reset
  '/api/auth',       // Authentication API endpoints
  // Static files and Next.js internals are handled separately
];

// ALL API routes that should return 404 for unauthorized access
const PROTECTED_API_ROUTES = [
  '/api/profile',
  '/api/profile/password',
  '/api/profile/avatar', 
  '/api/tasks',
  '/api/hubspot',
  // Catch-all: any other API route not explicitly public
];

// Session configuration
const SESSION_CONFIG = {
  INITIAL_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  EXTENSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days extension
  MAX_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days maximum
};

// Request-level session cache to avoid multiple auth checks per request
const REQUEST_CACHE = new Map<string, { user: any; timestamp: number; expires: number }>();
const CACHE_DURATION = 5000; // 5 seconds cache per request

// Rate limiting storage (in production, use Redis or similar)
const RATE_LIMIT_STORE = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 100; // 100 requests per minute per IP

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  
  // Skip middleware for static files, _next, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // Check if the current path is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Rate limiting check
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(clientIP);
  if (!rateLimitResult.allowed) {
    await logAuthAttempt(request, 'error', `Rate limit exceeded for IP ${clientIP}`);
    return handleRateLimitExceeded(request, pathname);
  }

  // Create cache key from session cookies for request-level caching
  const sessionCookies = [
    request.cookies.get('sb-access-token')?.value,
    request.cookies.get('sb-refresh-token')?.value,
  ].filter(Boolean).join('|');
  
  const cacheKey = `${clientIP}:${sessionCookies}`;
  
  // Check request-level cache first (validate once per request)
  const cached = REQUEST_CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    const duration = Date.now() - startTime;
    const response = NextResponse.next();
    response.headers.set('x-middleware-duration', duration.toString());
    response.headers.set('x-auth-cache', 'hit');
    response.headers.set('x-session-user', cached.user.id);
    await logAuthAttempt(request, 'success', `User ${cached.user.id} authenticated (cached)`);
    return response;
  }
  
  // Create a Supabase client to validate the session
  let response = NextResponse.next();
  
  try {
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing required Supabase environment variables');
      return handleServiceUnavailable(request, pathname);
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Add timeout for auth check (5 seconds)
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );

    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any;
    
    if (error) {
      // Log the error for monitoring
      await logAuthAttempt(request, 'error', error.message);
      
      // Handle specific error types
      if (error.message?.includes('JWT')) {
        // Invalid token - clear session and redirect
        return handleInvalidSession(request, pathname);
      }
      
      return handleUnauthorizedAccess(request, pathname, 'Session validation failed');
    }

    if (!user) {
      await logAuthAttempt(request, 'unauthorized', 'No user session');
      return handleUnauthorizedAccess(request, pathname, 'No active session');
    }

    // Cache the successful authentication result
    REQUEST_CACHE.set(cacheKey, {
      user,
      timestamp: Date.now(),
      expires: Date.now() + CACHE_DURATION
    });
    
    // Clean up expired cache entries periodically
    cleanupExpiredCache();

    // Check session age and extend if needed
    const sessionExtended = await extendSessionIfNeeded(user, response);
    
    // Log successful authentication
    await logAuthAttempt(request, 'success', `User ${user.id} authenticated`);
    
    // Add performance and monitoring headers
    const duration = Date.now() - startTime;
    response.headers.set('x-middleware-duration', duration.toString());
    response.headers.set('x-auth-cache', 'miss');
    response.headers.set('x-session-user', user.id);
    response.headers.set('x-rate-limit-remaining', (RATE_LIMIT_MAX_ATTEMPTS - rateLimitResult.count).toString());
    
    // Performance monitoring - warn if over 50ms
    if (duration > 50) {
      console.warn(`Middleware performance warning: ${duration}ms for ${pathname}`);
    }
    
    return response;
  } catch (error: any) {
    // Log error for monitoring
    await logAuthAttempt(request, 'error', error.message);
    
    if (error.message === 'Auth timeout') {
      return handleServiceUnavailable(request, pathname);
    }
    
    console.error('Middleware auth error:', error);
    return handleUnauthorizedAccess(request, pathname, 'Authentication service error');
  }
}

// Enhanced error handling functions
function handleUnauthorizedAccess(request: NextRequest, pathname: string, reason?: string) {
  // For ALL API routes (unless explicitly public), return 404
  if (pathname.startsWith('/api/') && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return new NextResponse(null, { status: 404 });
  }

  // Handle page routes - redirect to login (/auth in this app)
  const loginUrl = new URL('/auth', request.url);
  loginUrl.searchParams.set('redirectTo', pathname);
  if (reason) {
    loginUrl.searchParams.set('message', 'Session expired. Please sign in again.');
  }
  return NextResponse.redirect(loginUrl);
}

function handleInvalidSession(request: NextRequest, pathname: string) {
  const response = handleUnauthorizedAccess(request, pathname, 'Invalid session');
  
  // Clear all auth-related cookies
  const cookiesToClear = [
    'sb-access-token',
    'sb-refresh-token', 
    'supabase-auth-token',
    'supabase.auth.token'
  ];
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', { 
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
  });
  
  return response;
}

function handleServiceUnavailable(request: NextRequest, pathname: string) {
  // For API routes, return 503
  if (pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ error: 'Service temporarily unavailable' }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // For page routes, could redirect to maintenance page or show error
  // For now, redirect to auth with message
  const errorUrl = new URL('/auth', request.url);
  errorUrl.searchParams.set('error', 'service_unavailable');
  return NextResponse.redirect(errorUrl);
}

// Session management functions
async function extendSessionIfNeeded(user: any, response: NextResponse): Promise<boolean> {
  try {
    // In a real implementation, you'd check the session creation time
    // and extend it if it's close to expiry
    // For now, we'll assume Supabase handles this automatically
    
    // Add headers to indicate session is active
    response.headers.set('x-session-user', user.id);
    response.headers.set('x-session-extended', 'true');
    
    return true;
  } catch (error) {
    console.error('Error extending session:', error);
    return false;
  }
}

// Audit logging function
async function logAuthAttempt(request: NextRequest, type: 'success' | 'error' | 'unauthorized', message: string) {
  try {
    // In production, this would log to a monitoring service
    // For development, we'll use console logging
    const logData = {
      timestamp: new Date().toISOString(),
      type,
      message,
      pathname: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referer: request.headers.get('referer'),
    };
    
    // Log to console (in production, send to monitoring service)
    console.log(`[AUTH ${type.toUpperCase()}]`, JSON.stringify(logData));
    
    // TODO: In production, send to your monitoring/logging service
    // await sendToMonitoringService(logData);
    
  } catch (error) {
    // Don't let logging errors break the middleware
    console.error('Error logging auth attempt:', error);
  }
}

// Rate limiting functions
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         request.headers.get('cf-connecting-ip') || 
         'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; count: number } {
  const now = Date.now();
  const key = `rate_limit:${ip}`;
  
  let record = RATE_LIMIT_STORE.get(key);
  
  // Reset if window expired
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  record.count++;
  RATE_LIMIT_STORE.set(key, record);
  
  return {
    allowed: record.count <= RATE_LIMIT_MAX_ATTEMPTS,
    count: record.count
  };
}

function handleRateLimitExceeded(request: NextRequest, pathname: string) {
  // For API routes, return 429
  if (pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests', 
        message: 'Please try again later' 
      }), 
      { 
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    );
  }
  
  // For page routes, redirect to auth with rate limit message
  const errorUrl = new URL('/auth', request.url);
  errorUrl.searchParams.set('error', 'rate_limit_exceeded');
  return NextResponse.redirect(errorUrl);
}

// Cache management
function cleanupExpiredCache() {
  const now = Date.now();
  
  // Clean request cache
  REQUEST_CACHE.forEach((value, key) => {
    if (value.expires < now) {
      REQUEST_CACHE.delete(key);
    }
  });
  
  // Clean rate limit store
  RATE_LIMIT_STORE.forEach((value, key) => {
    if (now > value.resetTime) {
      RATE_LIMIT_STORE.delete(key);
    }
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};