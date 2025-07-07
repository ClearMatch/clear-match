import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚨🚨🚨 MIDDLEWARE IS RUNNING 🚨🚨🚨')
  console.log(`PATH: ${request.nextUrl.pathname}`)
  
  // Just redirect everything to auth for now to test
  if (!request.nextUrl.pathname.startsWith('/auth')) {
    console.log('🚨 REDIRECTING TO AUTH')
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}