import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { generateNonce, addSecurityHeaders } from './lib/security'
import { checkRateLimit } from './lib/rate-limit'
import { checkCSRFToken, setCSRFToken } from './lib/csrf'

/**
 * Enhanced Security Middleware for Clear Match
 * 
 * Features:
 * - Authentication with Supabase
 * - Content Security Policy with nonce
 * - Rate limiting
 * - CSRF protection
 * - Security headers
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const startTime = Date.now()
  
  console.log(`🔒 Middleware: ${pathname}`)
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next()
  }

  // Generate nonce for CSP
  const nonce = generateNonce()
  
  // Create response for cookie and header management
  let response = NextResponse.next()
  
  // Apply security headers with nonce
  response = addSecurityHeaders(response, nonce)
  
  // Apply rate limiting based on route type
  let rateLimitType: 'auth' | 'api' | 'public' = 'public'
  if (pathname.startsWith('/auth')) {
    rateLimitType = 'auth'
  } else if (pathname.startsWith('/api/')) {
    rateLimitType = 'api'
  }
  
  const rateLimitResponse = await checkRateLimit(request, rateLimitType)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    console.log(`🔓 Public route: ${pathname}`)
    
    // Set CSRF token for public routes (needed for forms)
    if (pathname.startsWith('/auth')) {
      setCSRFToken(response)
    }
    
    return response
  }
  
  // Check CSRF token for API routes
  if (pathname.startsWith('/api/')) {
    const csrfResponse = checkCSRFToken(request)
    if (csrfResponse) {
      return csrfResponse
    }
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables')
    return handleMissingConfig(request, pathname)
  }

  try {
    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Validate user session
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.log(`🚫 Unauthenticated: ${pathname}`)
      return handleUnauthenticated(request, pathname)
    }

    console.log(`✅ Authenticated user: ${user.id}`)
    
    // Set CSRF token for authenticated users
    setCSRFToken(response)
    
    // Add performance and monitoring headers
    const duration = Date.now() - startTime
    response.headers.set('x-middleware-cache', 'miss')
    response.headers.set('x-authenticated-user', user.id)
    response.headers.set('x-middleware-duration', duration.toString())
    response.headers.set('x-nonce', nonce)
    
    // Log performance warning if over threshold
    if (duration > 100) {
      console.warn(`⚠️ Slow middleware: ${duration}ms for ${pathname}`)
    }
    
    return response

  } catch (error) {
    console.error('❌ Middleware error:', error)
    return handleAuthError(request, pathname)
  }
}

/**
 * Handle missing Supabase configuration
 */
function handleMissingConfig(request: NextRequest, pathname: string) {
  if (pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Service configuration error', 
        message: 'Authentication service unavailable' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }

  const errorUrl = new URL('/auth', request.url)
  errorUrl.searchParams.set('error', 'service_unavailable')
  errorUrl.searchParams.set('message', 'Service temporarily unavailable')
  return NextResponse.redirect(errorUrl)
}

/**
 * Handle unauthenticated requests
 */
function handleUnauthenticated(request: NextRequest, pathname: string) {
  // For API routes, return 401 Unauthorized
  if (pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }

  // For page routes, redirect to auth with return URL
  const authUrl = new URL('/auth', request.url)
  authUrl.searchParams.set('redirectTo', pathname)
  authUrl.searchParams.set('message', 'Please sign in to continue')
  
  return NextResponse.redirect(authUrl)
}

/**
 * Handle authentication errors
 */
function handleAuthError(request: NextRequest, pathname: string) {
  // For API routes, return 500
  if (pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Authentication error', 
        message: 'Unable to validate session' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }

  // For page routes, redirect to auth with error
  const authUrl = new URL('/auth', request.url)
  authUrl.searchParams.set('error', 'auth_error')
  authUrl.searchParams.set('message', 'Authentication error occurred')
  
  return NextResponse.redirect(authUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}