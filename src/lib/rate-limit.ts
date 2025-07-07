import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, RATE_LIMITS } from './security'

/**
 * Rate limiting utilities using Upstash Redis
 */

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined

// Production Redis validation
if (process.env.NODE_ENV === 'production' && !redis) {
  console.warn(
    '⚠️ PRODUCTION WARNING: Rate limiting using memory fallback. ' +
    'For production deployments, configure Redis with UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. ' +
    'Memory-based rate limiting will not work across multiple server instances.'
  )
}

// Development notification
if (process.env.NODE_ENV === 'development' && !redis) {
  console.info('📝 Development: Using memory-based rate limiting (Redis not configured)')
}

// Fallback in-memory rate limiting for development
const memoryLimiter = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiters for different endpoint types
 */
const rateLimiters = {
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.AUTH.requests, RATE_LIMITS.AUTH.window),
    analytics: true,
  }) : null,

  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.API.requests, RATE_LIMITS.API.window),
    analytics: true,
  }) : null,

  public: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.PUBLIC.requests, RATE_LIMITS.PUBLIC.window),
    analytics: true,
  }) : null,
}

/**
 * Fallback memory-based rate limiting for development
 */
function memoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: Date } {
  const now = Date.now()
  const windowKey = `${identifier}:${Math.floor(now / windowMs)}`
  
  const current = memoryLimiter.get(windowKey)
  
  if (!current) {
    memoryLimiter.set(windowKey, { count: 1, resetTime: now + windowMs })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(now + windowMs)
    }
  }
  
  if (current.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(current.resetTime)
    }
  }
  
  current.count++
  return {
    success: true,
    limit,
    remaining: limit - current.count,
    reset: new Date(current.resetTime)
  }
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  type: 'auth' | 'api' | 'public'
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: Date
}> {
  const clientIP = getClientIP(request)
  const identifier = `${type}:${clientIP}`
  
  const limiter = rateLimiters[type]
  
  if (!limiter) {
    // Fallback to memory-based rate limiting
    const limits = {
      auth: { requests: 5, windowMs: 60000 },
      api: { requests: 100, windowMs: 60000 },
      public: { requests: 50, windowMs: 60000 },
    }
    
    const config = limits[type]
    return memoryRateLimit(identifier, config.requests, config.windowMs)
  }
  
  const result = await limiter.limit(identifier)
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset),
  }
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: {
  limit: number
  remaining: number
  reset: Date
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.getTime().toString(),
  }
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(
  result: { limit: number; remaining: number; reset: Date },
  isAPI: boolean = false
): NextResponse {
  const headers = createRateLimitHeaders(result)
  
  if (isAPI) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.reset.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    )
  }
  
  // For page requests, could redirect to an error page
  return new NextResponse(
    `
    <html>
      <head><title>Rate Limit Exceeded</title></head>
      <body>
        <h1>Too Many Requests</h1>
        <p>Please wait before making another request.</p>
        <p>Try again after: ${result.reset.toLocaleString()}</p>
      </body>
    </html>
    `,
    {
      status: 429,
      headers: {
        'Content-Type': 'text/html',
        ...headers,
      },
    }
  )
}

/**
 * Middleware helper to check rate limits
 */
export async function checkRateLimit(
  request: NextRequest,
  type: 'auth' | 'api' | 'public'
): Promise<NextResponse | null> {
  const result = await applyRateLimit(request, type)
  
  if (!result.success) {
    console.warn(`Rate limit exceeded for ${getClientIP(request)} on ${type} endpoint`)
    return createRateLimitResponse(result, request.nextUrl.pathname.startsWith('/api/'))
  }
  
  return null
}