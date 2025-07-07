import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log(`🔒 Middleware executing for: ${request.nextUrl.pathname}`);
  
  // Skip static files
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/favicon') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  // Public routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // For now, redirect all other routes to auth
  const authUrl = new URL('/auth', request.url)
  authUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
  return NextResponse.redirect(authUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}