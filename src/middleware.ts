import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
// Remove complex environment detection imports

/**
 * Enhanced Security Middleware for Clear Match
 * 
 * Features:
 * - Authentication with Supabase
 * - Basic security headers
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

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    console.log(`🔓 Public route: ${pathname}`)
    
    let response = NextResponse.next()
    
    // Add basic security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }

  // Get Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    return handleMissingConfig(request, pathname)
  }

  try {
    let response = NextResponse.next()
    
    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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
    
    // Add basic security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Add performance and monitoring headers
    const duration = Date.now() - startTime
    response.headers.set('x-middleware-cache', 'miss')
    response.headers.set('x-authenticated-user', user.id)
    response.headers.set('x-middleware-duration', duration.toString())
    
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