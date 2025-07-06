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
- [ ] Rate limiting storage (Redis recommended)
- [ ] Performance monitoring alerts
- [ ] Security event alerting

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Support

For issues or questions about the middleware:
1. Check the audit logs for authentication errors
2. Monitor performance headers for latency issues
3. Review rate limiting logs for blocked requests
4. Verify environment variable configuration