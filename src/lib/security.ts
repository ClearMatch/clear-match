import { NextRequest, NextResponse } from 'next/server'

/**
 * Security utilities for Clear Match application
 */

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  // Use Web Crypto API for edge runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
  }
  
  // No insecure fallback - fail securely
  throw new Error(
    'Secure random number generation not available. ' +
    'This indicates a critical security issue with the runtime environment. ' +
    'Web Crypto API must be available for secure nonce generation.'
  )
}

/**
 * Generate Content Security Policy header with dynamic nonce
 */
export function generateCSPHeader(nonce: string): string {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // In production, we're more restrictive but still need to allow Monaco Editor
  const scriptSrc = isProduction 
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://cdn.jsdelivr.net`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net`
    
  return `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: *.supabase.co *.githubusercontent.com *.googleusercontent.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co https://api.hubspot.com wss://*.supabase.co;
    media-src 'self' *.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim()
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const

/**
 * Apply security headers to a NextResponse
 */
export function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Add standard security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add CSP header if nonce is provided
  if (nonce) {
    response.headers.set('Content-Security-Policy', generateCSPHeader(nonce))
  }

  return response
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  // Use Web Crypto API for edge runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for environments without crypto
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false
  }
  
  if (token.length !== sessionToken.length) {
    return false
  }
  
  // Simple constant-time comparison
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Rate limiting configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - very restrictive
  AUTH: {
    requests: 5,
    window: '1 m', // 1 minute
  },
  // API endpoints - moderate
  API: {
    requests: 100,
    window: '1 m', // 1 minute
  },
  // Public endpoints - less restrictive
  PUBLIC: {
    requests: 50,
    window: '1 m', // 1 minute
  },
} as const

/**
 * Extract client IP from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfIP) {
    return cfIP
  }
  
  return 'unknown'
}

/**
 * Input sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize string input to prevent XSS
   */
  string: (input: string): string => {
    if (typeof input !== 'string') {
      return ''
    }
    
    return input
      .replace(/[<>]/g, '') // Remove potential script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  },

  /**
   * Sanitize email input
   */
  email: (input: string): string => {
    if (typeof input !== 'string') {
      return ''
    }
    
    return input
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '')
      .trim()
  },

  /**
   * Sanitize filename for uploads
   */
  filename: (input: string): string => {
    if (typeof input !== 'string') {
      return ''
    }
    
    return input
      .replace(/[^a-zA-Z0-9.-_]/g, '')
      .replace(/\.{2,}/g, '.') // Prevent directory traversal
      .trim()
  },
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds maximum allowed size (10MB)',
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    }
  }

  // Check for potentially malicious filenames
  const filename = sanitize.filename(file.name)
  if (filename.length === 0) {
    return {
      valid: false,
      error: 'Invalid filename',
    }
  }

  return { valid: true }
}