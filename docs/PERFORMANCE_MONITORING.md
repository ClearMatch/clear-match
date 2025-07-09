# Performance Monitoring Documentation

## Overview

The Clear Match application includes a comprehensive performance monitoring system for TanStack Query operations. This system tracks query and mutation performance, identifies slow operations, and provides debugging insights for development.

## Performance Monitoring Components

### 1. Core Performance Monitor (`/src/lib/performance-monitoring.ts`)

The `PerformanceMonitor` class provides centralized performance tracking:

```typescript
import { performanceMonitor, logPerformanceSummary } from '@/lib/performance-monitoring';

// Get performance summary
const summary = performanceMonitor.getSummary();

// Log performance summary to console
logPerformanceSummary();

// Get slow operations (> 1000ms)
const slowOps = performanceMonitor.getSlowOperations(1000);

// Export metrics for analysis
const metrics = performanceMonitor.exportMetrics();
```

### 2. React Hook (`/src/hooks/usePerformanceMonitor.ts`)

The `usePerformanceMonitor` hook provides real-time performance monitoring for React components:

```typescript
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function MyComponent() {
  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: createContact,
  });

  // Monitor mutation performance
  usePerformanceMonitor({
    queryKey: 'contact_create',
    operation: 'mutation',
    isLoading: isPending,
    isSuccess,
    isError,
    error,
    threshold: 1500, // 1.5 seconds threshold
  });

  // Component implementation...
}
```

### 3. Infinite Query Monitoring

For infinite queries (pagination), use the specialized hook:

```typescript
import { useInfiniteQueryPerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function ContactList() {
  const { data, isLoading, isFetchingNextPage, isSuccess, isError, error } = useInfiniteQuery({
    queryKey: contactKeys.list({}),
    queryFn: fetchContacts,
  });

  // Monitor infinite query performance
  useInfiniteQueryPerformanceMonitor({
    queryKey: 'contacts_list',
    isLoading,
    isFetchingNextPage,
    isSuccess,
    isError,
    error,
    threshold: 1000,
  });

  // Component implementation...
}
```

## Performance Metrics

### Tracked Metrics

Each performance metric includes:

- **queryKey**: String identifier for the operation
- **operation**: Type of operation ('query', 'mutation', 'infinite-query')
- **duration**: Operation duration in milliseconds
- **success**: Boolean indicating if operation succeeded
- **error**: Error message if operation failed
- **timestamp**: Unix timestamp of the operation
- **userId**: Optional user ID for scoped metrics

### Performance Thresholds

Default thresholds for slow operation warnings:

- **Standard operations**: 1000ms (1 second)
- **Contact creation**: 1500ms (1.5 seconds)
- **Infinite query initial load**: 1000ms
- **Infinite query next page**: 500ms (faster expected)

## Development Features

### 1. Automatic Logging

In development mode, the system automatically logs:

- **Slow operations**: Operations exceeding threshold with warning
- **Performance summary**: Every 30 seconds if operations occurred
- **Debug logs**: All operation completions with duration

### 2. Console Output Examples

```bash
# Slow operation warning
⚠️ Slow mutation: {
  queryKey: 'contact_create',
  duration: '2150ms',
  success: true,
  error: undefined
}

# Performance summary
📊 Performance Summary
Total Operations: 45
Average Duration: 340ms
Slow Operations: 3
Error Rate: 0.02%
Operations by Type: { query: 32, mutation: 10, infinite-query: 3 }
```

### 3. Development Tools Integration

The performance monitor integrates with TanStack Query DevTools:

```typescript
// Query observer for DevTools integration
export function createQueryObserver() {
  return {
    onQueryStart: (query) => {
      console.debug(`🔍 Query started: ${query.queryKey}`);
    },
    onQueryEnd: (query, result) => {
      performanceMonitor.record({
        queryKey: query.queryKey.join('_'),
        operation: 'query',
        duration: result.duration,
        success: !result.error,
        error: result.error?.message,
        timestamp: Date.now(),
      });
    },
  };
}
```

## Production Considerations

### 1. Performance Impact

The performance monitoring system is designed to be lightweight:

- **Memory usage**: Limited to last 100 metrics
- **CPU impact**: Minimal overhead for metric collection
- **Network impact**: No network requests (metrics kept in memory)

### 2. Production Deployment

For production deployment:

```typescript
// Enable monitoring in production (optional)
if (process.env.NODE_ENV === 'production') {
  // Send metrics to your monitoring service
  const metrics = performanceMonitor.exportMetrics();
  analytics.track('performance_metrics', metrics);
}
```

### 3. Monitoring Service Integration

Example integration with monitoring services:

```typescript
// Example: Send to DataDog, New Relic, or custom analytics
function sendToMonitoringService(metrics: PerformanceMetrics[]) {
  const slowOperations = metrics.filter(m => m.duration > 1000);
  const errorOperations = metrics.filter(m => !m.success);

  // Send to monitoring service
  if (slowOperations.length > 0) {
    analytics.track('slow_operations', { count: slowOperations.length });
  }

  if (errorOperations.length > 0) {
    analytics.track('operation_errors', { count: errorOperations.length });
  }
}
```

## Usage Examples

### 1. Basic Query Monitoring

```typescript
import { useQuery } from '@tanstack/react-query';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function ContactDetails({ contactId }: { contactId: string }) {
  const { data, isLoading, isSuccess, isError, error } = useQuery({
    queryKey: contactKeys.detail(contactId),
    queryFn: () => fetchContact(contactId),
  });

  usePerformanceMonitor({
    queryKey: `contact_detail_${contactId}`,
    operation: 'query',
    isLoading,
    isSuccess,
    isError,
    error,
    threshold: 800, // 800ms threshold for contact details
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;
  
  return <div>{data.name}</div>;
}
```

### 2. Mutation Performance Monitoring

```typescript
import { useMutation } from '@tanstack/react-query';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function CreateContactForm() {
  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    },
  });

  // Monitor contact creation performance
  usePerformanceMonitor({
    queryKey: 'contact_create',
    operation: 'mutation',
    isLoading: isPending,
    isSuccess,
    isError,
    error,
    threshold: 1500, // 1.5 seconds for contact creation
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutate(formData);
    }}>
      {/* Form content */}
    </form>
  );
}
```

### 3. Analyzing Performance Data

```typescript
import { performanceMonitor } from '@/lib/performance-monitoring';

// Get performance insights
function analyzePerformance() {
  const summary = performanceMonitor.getSummary();
  const slowOps = performanceMonitor.getSlowOperations(1000);
  const errorOps = performanceMonitor.getErrorOperations();

  console.log('Performance Analysis:', {
    summary,
    slowOperations: slowOps.length,
    errorOperations: errorOps.length,
    worstPerformers: slowOps.slice(0, 5), // Top 5 slowest
  });
}
```

## Best Practices

### 1. Threshold Configuration

Set appropriate thresholds based on operation type:

```typescript
const THRESHOLDS = {
  QUERY: 1000,           // 1 second for queries
  MUTATION: 1500,        // 1.5 seconds for mutations
  INFINITE_QUERY: 1000,  // 1 second for initial load
  NEXT_PAGE: 500,        // 500ms for pagination
};
```

### 2. Query Key Naming

Use descriptive query keys for better monitoring:

```typescript
// ✅ Good - descriptive and specific
usePerformanceMonitor({
  queryKey: 'contact_list_search_john',
  operation: 'query',
  // ...
});

// ❌ Bad - generic and unclear
usePerformanceMonitor({
  queryKey: 'data',
  operation: 'query',
  // ...
});
```

### 3. Monitoring Critical Operations

Focus monitoring on business-critical operations:

```typescript
// Monitor critical user actions
const CRITICAL_OPERATIONS = [
  'contact_create',
  'contact_update',
  'task_create',
  'dashboard_load',
];

CRITICAL_OPERATIONS.forEach(op => {
  usePerformanceMonitor({
    queryKey: op,
    operation: 'mutation',
    threshold: 1000, // Lower threshold for critical ops
    // ...
  });
});
```

## Troubleshooting

### Common Issues

1. **High memory usage**: Reduce MAX_METRICS limit in PerformanceMonitor
2. **Console spam**: Increase threshold values or disable debug logging
3. **Inaccurate timing**: Ensure proper isLoading state management

### Debug Tips

```typescript
// Temporarily enable detailed logging
usePerformanceMonitor({
  queryKey: 'debug_operation',
  operation: 'query',
  isLoading,
  isSuccess,
  isError,
  error,
  threshold: 0, // Log all operations
});
```

## Integration with Existing Code

The performance monitoring system is already integrated into several components:

- **AddContact**: Monitors contact creation performance
- **EditContact**: Monitors contact update performance
- **AddEventForm**: Monitors event creation performance
- **Task components**: Monitors task operations

This provides comprehensive coverage of user interactions and helps identify performance bottlenecks in the application.