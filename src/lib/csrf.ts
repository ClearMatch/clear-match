import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, validateCSRFToken } from './security'

/**
 * CSRF protection utilities
 */

const CSRF_COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-csrf-token' : 'csrf-token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

/**
 * Generate and set CSRF token in cookie
 */
export function setCSRFToken(response: NextResponse): string {
  const token = generateCSRFToken()
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
  
  return token
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFFromRequest(request: NextRequest): boolean {
  const cookieToken = getCSRFToken(request)
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  
  if (!cookieToken || !headerToken) {
    return false
  }
  
  return validateCSRFToken(headerToken, cookieToken)
}

/**
 * Middleware to check CSRF token for state-changing requests
 */
export function checkCSRFToken(request: NextRequest): NextResponse | null {
  const method = request.method
  const isStateMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  
  if (!isStateMutating) {
    return null
  }
  
  if (!validateCSRFFromRequest(request)) {
    console.warn(`CSRF validation failed for ${method} ${request.nextUrl.pathname}`)
    
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'Request could not be authenticated',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  return null
}

/**
 * API route helper to validate CSRF
 */
export function validateCSRFForAPI(request: NextRequest): void {
  const method = request.method
  const isStateMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  
  if (isStateMutating && !validateCSRFFromRequest(request)) {
    throw new Error('Invalid CSRF token')
  }
}

/**
 * Get CSRF token from browser cookies (client-side)
 */
export function getCSRFTokenFromBrowser(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${CSRF_COOKIE_NAME}=`)
  )
  
  if (!csrfCookie) {
    return null
  }
  
  return csrfCookie.split('=')[1] || null
}

/**
 * Add CSRF token to fetch headers
 */
export function addCSRFToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFTokenFromBrowser()
  
  if (!token) {
    return headers
  }
  
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  }
}