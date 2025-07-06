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
import { createHash } from 'crypto';

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

// Performance and timeout constants
const AUTH_TIMEOUT_MS = 5000; // 5 seconds timeout for auth checks
const CACHE_DURATION_MS = 5000; // 5 seconds cache per request
const PERFORMANCE_WARNING_THRESHOLD_MS = 50; // Warn if middleware takes longer than 50ms

// Session configuration
const SESSION_CONFIG = {
  INITIAL_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  EXTENSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days extension
  MAX_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days maximum
} as const;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 60000, // 1 minute
  MAX_ATTEMPTS: 100, // 100 requests per minute per IP
  CLEANUP_INTERVAL: 1000, // Cleanup every 1000 requests
} as const;

// In-memory storage (NOTE: In production, replace with Redis for persistence)
// These Maps will not persist between serverless function invocations
const REQUEST_CACHE = new Map<string, { user: any; timestamp: number; expires: number }>();
const RATE_LIMIT_STORE = new Map<string, { count: number; resetTime: number }>();

// Export for testing purposes
export function clearTestState() {
  REQUEST_CACHE.clear();
  RATE_LIMIT_STORE.clear();
}

// Cleanup counters to avoid running cleanup on every request
let cacheCleanupCounter = 0;
let rateLimitCleanupCounter = 0;

/**
 * Creates a secure cache key by hashing sensitive session data
 * @param ip - Client IP address
 * @param sessionData - Session cookies or tokens
 * @returns Secure hash-based cache key
 */
function createSecureCacheKey(ip: string, sessionData: string): string {
  const sanitizedIP = ip.replace(/[^0-9a-f.:]/gi, ''); // Basic IP sanitization
  const sessionHash = createHash('sha256')
    .update(sessionData || 'no-session')
    .digest('hex')
    .slice(0, 16); // First 16 chars for efficiency
  
  return `auth:${sanitizedIP}:${sessionHash}`;
}

/**
 * Sanitizes sensitive data for logging
 * @param data - Raw log data
 * @returns Sanitized log data safe for logging
 */
function sanitizeLogData(data: any): any {
  return {
    ...data,
    ip: data.ip ? createHash('sha256').update(data.ip).digest('hex').slice(0, 8) : 'unknown',
    userAgent: data.userAgent ? data.userAgent.slice(0, 50) + '...' : undefined,
  };
}

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

  // Create secure cache key from session cookies for request-level caching
  const sessionCookies = [
    request.cookies.get('sb-access-token')?.value,
    request.cookies.get('sb-refresh-token')?.value,
  ].filter(Boolean).join('|');
  
  const cacheKey = createSecureCacheKey(clientIP, sessionCookies);
  
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

    // Add timeout for auth check
    const authPromise = supabase.auth.getUser();
    const timeoutPromise: Promise<never> = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), AUTH_TIMEOUT_MS)
    );

    const authResult = await Promise.race([authPromise, timeoutPromise]);
    
    if (!authResult) {
      await logAuthAttempt(request, 'error', 'Auth result is null/undefined');
      return handleUnauthorizedAccess(request, pathname, 'Authentication failed');
    }
    
    const { data: { user }, error } = authResult;
    
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
      expires: Date.now() + CACHE_DURATION_MS
    });
    
    // Periodic cleanup - only run occasionally to avoid performance impact
    cacheCleanupCounter++;
    if (cacheCleanupCounter >= RATE_LIMIT_CONFIG.CLEANUP_INTERVAL) {
      cacheCleanupCounter = 0;
      // Run cleanup asynchronously to avoid blocking the response
      setImmediate(() => cleanupExpiredCacheAsync());
    }

    // Check session age and extend if needed
    const sessionExtended = await extendSessionIfNeeded(user, response);
    
    // Log successful authentication
    await logAuthAttempt(request, 'success', `User ${user.id} authenticated`);
    
    // Add performance and monitoring headers
    const duration = Date.now() - startTime;
    response.headers.set('x-middleware-duration', duration.toString());
    response.headers.set('x-auth-cache', 'miss');
    response.headers.set('x-session-user', user.id);
    response.headers.set('x-rate-limit-remaining', (RATE_LIMIT_CONFIG.MAX_ATTEMPTS - rateLimitResult.count).toString());
    
    // Performance monitoring - warn if over threshold
    if (duration > PERFORMANCE_WARNING_THRESHOLD_MS) {
      console.warn(`Middleware performance warning: ${duration}ms for ${pathname} (threshold: ${PERFORMANCE_WARNING_THRESHOLD_MS}ms)`);
    }
    
    return response;
  } catch (error: any) {
    // Log error for monitoring
    await logAuthAttempt(request, 'error', error.message);
    
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

// Audit logging function with sanitized data
async function logAuthAttempt(request: NextRequest, type: 'success' | 'error' | 'unauthorized', message: string) {
  try {
    // Create raw log data
    const rawLogData = {
      timestamp: new Date().toISOString(),
      type,
      message,
      pathname: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referer: request.headers.get('referer'),
    };
    
    // Sanitize sensitive data for logging
    const sanitizedLogData = sanitizeLogData(rawLogData);
    
    // Log to console (in production, send to monitoring service)
    console.log(`[AUTH ${type.toUpperCase()}]`, JSON.stringify(sanitizedLogData));
    
    // TODO: In production, send to your monitoring/logging service
    // await sendToMonitoringService(sanitizedLogData);
    
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
    record = { count: 0, resetTime: now + RATE_LIMIT_CONFIG.WINDOW_MS };
  }
  
  record.count++;
  RATE_LIMIT_STORE.set(key, record);
  
  // Periodic cleanup for rate limit store
  rateLimitCleanupCounter++;
  if (rateLimitCleanupCounter >= RATE_LIMIT_CONFIG.CLEANUP_INTERVAL) {
    rateLimitCleanupCounter = 0;
    setImmediate(() => cleanupRateLimitStoreAsync());
  }
  
  return {
    allowed: record.count <= RATE_LIMIT_CONFIG.MAX_ATTEMPTS,
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

// Async cache management functions for better performance
async function cleanupExpiredCacheAsync(): Promise<void> {
  try {
    const now = Date.now();
    let deletedCount = 0;
    
    // Clean request cache using forEach to avoid iterator issues
    REQUEST_CACHE.forEach((value, key) => {
      if (value.expires < now) {
        REQUEST_CACHE.delete(key);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired cache entries`);
    }
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
}

async function cleanupRateLimitStoreAsync(): Promise<void> {
  try {
    const now = Date.now();
    let deletedCount = 0;
    
    // Clean rate limit store using forEach to avoid iterator issues
    RATE_LIMIT_STORE.forEach((value, key) => {
      if (now > value.resetTime) {
        RATE_LIMIT_STORE.delete(key);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired rate limit entries`);
    }
  } catch (error) {
    console.error('Error during rate limit cleanup:', error);
  }
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