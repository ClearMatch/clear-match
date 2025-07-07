# Authentication Middleware Documentation

## Overview

This middleware provides comprehensive authentication protection for the Clear Match application as specified in GitHub Issue #91. It implements a secure, performant authentication layer that protects all application routes while providing excellent user experience.

## Features Implemented

### ✅ Core Authentication
- **Supabase Auth Integration**: Exclusive use of Supabase Auth with JWT tokens
- **Automatic Token Refresh**: Handled via Supabase SSR client
- **Session Management**: Full integration with Supabase session management and RLS

### ✅ Route Protection
- **Page Routes**: All pages protected except explicitly whitelisted routes
- **API Routes**: All API routes return 404 for unauthorized access (prevents enumeration)
- **Whitelist Security**: Explicit public route definition for maximum security

### ✅ Performance Optimizations
- **Request-Level Caching**: Session validation cached per request (5-second cache)
- **< 50ms Target**: Performance monitoring with warnings for slow requests
- **Edge Middleware**: Runs at edge for optimal performance
- **Static File Exclusion**: Fast bypassing of static assets

### ✅ Session Management
- **7-Day Initial Duration**: Configurable session length
- **Activity Extension**: Automatic 7-day extension on activity
- **30-Day Maximum**: Hard limit for security
- **Multi-Device Support**: Users can stay logged in across devices

### ✅ Security Features
- **Rate Limiting**: 100 requests per minute per IP
- **Route Enumeration Prevention**: Consistent 404s for unauthorized API access
- **Malformed Token Handling**: Graceful error handling with session cleanup
- **No Information Disclosure**: Secure error messages that don't expose sensitive data

### ✅ Error Handling
- **Service Unavailable**: Graceful handling of Supabase outages
- **Network Timeouts**: 5-second timeout with retry logic
- **JWT Errors**: Automatic session cleanup and redirect
- **Rate Limit Exceeded**: Clear user messaging with retry guidance

### ✅ Monitoring & Logging
- **Audit Logging**: Comprehensive authentication attempt logging
- **Performance Metrics**: Request duration tracking with headers
- **Security Analytics**: Success/failure rate monitoring
- **Error Tracking**: Detailed error logging for debugging

## Configuration

### Public Routes
```typescript
const PUBLIC_ROUTES = [
  '/auth',           // Main authentication page
  '/login',          // Alternative login route (if exists)
  '/signup',         // User registration
  '/forgot-password', // Password recovery
  '/reset-password', // Password reset
  '/api/auth',       // Authentication API endpoints
];
```

### Session Configuration
```typescript
const SESSION_CONFIG = {
  INITIAL_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  EXTENSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days extension
  MAX_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days maximum
};
```

### Rate Limiting
```typescript
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 100; // 100 requests per minute per IP
```

## Response Headers

The middleware adds several monitoring headers:

- `x-middleware-duration`: Request processing time in milliseconds
- `x-auth-cache`: "hit" or "miss" for cache status
- `x-session-user`: User ID for authenticated requests
- `x-rate-limit-remaining`: Remaining requests in current window

## Error Handling

### Page Routes
- **Unauthenticated**: Redirect to `/auth?redirectTo=/original-path`
- **Rate Limited**: Redirect to `/auth?error=rate_limit_exceeded`
- **Service Error**: Redirect to `/auth?error=service_unavailable`

### API Routes
- **Unauthenticated**: 404 response (prevents route enumeration)
- **Rate Limited**: 429 response with `Retry-After` header
- **Service Error**: 503 response with error message

## Performance Targets

- **< 50ms**: Target latency for authenticated requests
- **< 10ms**: Target for cached requests
- **< 5ms**: Target for static file requests
- **Cache Hit Rate**: Optimized for high cache hit rates on repeated requests

## Security Considerations

1. **Route Enumeration**: All unauthorized API requests return 404
2. **Information Disclosure**: No sensitive data in error responses
3. **Session Security**: Automatic cleanup of invalid sessions
4. **Rate Limiting**: Protection against brute force and DoS attacks
5. **Audit Trail**: Comprehensive logging for security monitoring
6. **Secure Cache Keys**: Session tokens are hashed before use in cache keys
7. **Sanitized Logging**: Sensitive data (IPs, user agents) are hashed in logs
8. **Input Validation**: IP addresses and session data are properly sanitized

## Monitoring

### Log Levels
- **SUCCESS**: Successful authentication
- **ERROR**: Authentication failures, timeouts, service errors
- **UNAUTHORIZED**: Missing or invalid sessions

### Performance Monitoring
- Automatic warnings for requests exceeding 50ms
- Request duration tracking
- Cache hit/miss ratio monitoring

### Security Analytics
- Failed authentication attempt tracking
- Rate limiting events
- Suspicious activity patterns

## Future Enhancements

The architecture is prepared for:

1. **Role-Based Access Control (RBAC)**: User permission checking
2. **Advanced Rate Limiting**: Per-user and per-endpoint limits
3. **Geolocation Security**: Location-based access controls
4. **Advanced Session Management**: Custom session policies
5. **Real-time Monitoring**: Integration with monitoring services

## Testing

The middleware includes comprehensive test coverage:

- **Unit Tests**: Core logic and edge cases
- **Integration Tests**: Full authentication flows
- **Security Tests**: Attack prevention and malformed input handling
- **Performance Tests**: Latency and throughput validation

## Deployment Considerations

### Production Checklist
- [ ] Environment variables configured
- [ ] Monitoring service integration
- [ ] **CRITICAL**: Replace in-memory storage with Redis for persistence
- [ ] Performance monitoring alerts
- [ ] Security event alerting
- [ ] Review and configure log sanitization for your monitoring service
- [ ] Set up alerts for rate limiting events
- [ ] Test session cache performance under load

### Redis Migration (CRITICAL for Production)

**Current Implementation Issue**: The middleware currently uses in-memory Maps for session caching and rate limiting, which will **NOT persist between serverless function invocations**.

#### Why Redis is Required
1. **Serverless Cold Starts**: In-memory data is lost when functions shut down
2. **Multi-Instance Deployments**: Each instance has its own memory space
3. **Rate Limiting Effectiveness**: Without persistence, rate limiting resets on every cold start
4. **Session Cache Efficiency**: Cache hits become misses after function restarts

#### Implementation Steps

1. **Install Redis Client**
```bash
npm install redis @types/redis
```

2. **Create Redis Connection**
```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
  // Add additional Redis configuration as needed
});

redis.on('error', (err) => logger.error('Redis Client Error', err));
```

3. **Replace Cache Implementation**
```typescript
// Replace REQUEST_CACHE Map operations with Redis
async function getCachedAuth(key: string): Promise<CacheEntry | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedAuth(key: string, value: CacheEntry): Promise<void> {
  await redis.setex(key, Math.ceil(CONFIG.CACHE_DURATION_MS / 1000), JSON.stringify(value));
}
```

4. **Replace Rate Limiting Implementation**
```typescript
// Replace RATE_LIMIT_STORE Map operations with Redis
async function getRateLimit(key: string): Promise<RateLimitEntry | null> {
  const record = await redis.get(key);
  return record ? JSON.parse(record) : null;
}

async function setRateLimit(key: string, value: RateLimitEntry): Promise<void> {
  const ttl = Math.ceil((value.resetTime - Date.now()) / 1000);
  await redis.setex(key, ttl, JSON.stringify(value));
}
```

5. **Environment Variables for Redis**
```bash
REDIS_URL=redis://localhost:6379  # or your Redis instance URL
REDIS_PASSWORD=your_redis_password # if required
```

#### Performance Considerations
- Use Redis connection pooling for high traffic
- Consider Redis Cluster for high availability
- Monitor Redis memory usage and set appropriate TTLs
- Use Redis pipelining for batch operations if needed

#### Alternative Storage Options
If Redis is not available, consider:
- **Database storage**: Store cache/rate limit data in your main database
- **External services**: Use managed caching services (AWS ElastiCache, Google Memorystore)
- **File-based storage**: For development/testing only (not recommended for production)

### Environment Variables

#### Required Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Optional Configuration Variables
```bash
# Performance & Timeout Configuration
AUTH_TIMEOUT_MS=5000                        # Auth timeout in milliseconds (default: 5000)
CACHE_DURATION_MS=5000                       # Cache duration in milliseconds (default: 5000)
PERFORMANCE_WARNING_THRESHOLD_MS=50          # Performance warning threshold (default: 50)

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000                   # Rate limit window in milliseconds (default: 60000 = 1 minute)
RATE_LIMIT_MAX_ATTEMPTS=100                  # Max attempts per window per IP (default: 100)
RATE_LIMIT_CLEANUP_INTERVAL=1000             # Cleanup interval for rate limiting (default: 1000 requests)

# Session Management
SESSION_INITIAL_DURATION_MS=604800000        # Initial session duration (default: 7 days)
SESSION_EXTENSION_DURATION_MS=604800000      # Session extension duration (default: 7 days)
SESSION_MAX_DURATION_MS=2592000000           # Maximum session duration (default: 30 days)

# Logging Configuration
LOG_LEVEL=info                               # Logging level: debug, info, warn, error (default: info)
ENABLE_PERFORMANCE_LOGGING=true              # Enable performance logging (default: true)
```

## Support

For issues or questions about the middleware:
1. Check the audit logs for authentication errors
2. Monitor performance headers for latency issues
3. Review rate limiting logs for blocked requests
4. Verify environment variable configuration