# TanStack Query Migration Guide

## Overview

This document outlines the complete migration from SWR to TanStack Query in the Clear Match application. The migration provides enhanced performance, better caching strategies, and improved developer experience.

## Migration Summary

### Files Migrated: 23 Total

**Core Query Hooks (5 files):**
- `src/components/Contact/ContactList/useContact.ts` - Infinite scroll with search/filtering
- `src/components/MyTask/Services/useTasks.ts` - Task management with real-time updates
- `src/components/dashboard/useDashboard.ts` - Dashboard statistics and analytics
- `src/components/Event/Services/useEventData.ts` - Event form data loading
- `src/components/MyTask/Services/useTaskData.ts` - Task form data loading

**CRUD Components (14 files):**
- Contact operations: Create, Update, Delete, Show, Tasks, Events
- Task operations: Create, Update, Delete, Status updates, Show  
- Event operations: Create

**Infrastructure (4 files):**
- `src/lib/query-client.ts` - QueryClient configuration
- `src/components/QueryProvider.tsx` - Provider setup with DevTools
- `src/lib/query-keys.ts` - Centralized query key management
- Package dependencies updated

## Query Key Hierarchy

### Standardized Structure

All query keys follow a consistent 3-level hierarchy:

```typescript
[entity, scope, parameters?]
```

**Level 1: Entity Type**
- `contacts` - Contact-related queries
- `tasks` - Task-related queries  
- `dashboard` - Dashboard and analytics
- `events` - Event-related queries
- `users` - User and profile queries
- `organizations` - Organization queries

**Level 2: Scope**
- `list` - Collection queries with filtering/sorting
- `detail` - Individual entity queries
- `form-data` - Data for form dropdowns/options
- `stats` - Statistics and analytics
- `activities` - Activity feeds

**Level 3: Parameters** (optional)
- Search terms, filters, sorting, pagination
- Entity IDs for specific resources
- User context for scoping

### Examples

```typescript
// Contact list with search and filters
['contacts', 'list', { 
  search: 'john', 
  filters: { status: 'active' }, 
  userId: 'user-123' 
}]

// Specific contact details
['contacts', 'detail', 'contact-456']

// Tasks for a specific contact
['contacts', 'tasks', 'contact-456']

// Dashboard stats for user
['dashboard', 'stats', 'user-123']

// Task form options
['tasks', 'form-data']
```

## Query Patterns

### 1. Infinite Queries (Pagination)

Used for large datasets with cursor-based pagination:

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: contactKeys.list({ search, filters, sort, userId }),
  queryFn: ({ pageParam }) => fetchContactsCursor(pageParam),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => getNextCursor(lastPage),
  placeholderData: (previousData) => previousData,
  staleTime: 60 * 1000, // 60 seconds
});
```

### 2. Standard Queries (Data Fetching)

For single resources or smaller datasets:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: dashboardKeys.stats(userId),
  queryFn: () => fetchDashboardStats(userId, organizationId),
  enabled: !!user && !loading,
  staleTime: 60 * 1000, // 60 seconds
  retry: 3,
});
```

### 3. Mutation Patterns (CRUD Operations)

#### Create Operations
```typescript
const createMutation = useMutation({
  mutationFn: createContact,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: contactKeys.all });
    toast.success('Contact created successfully');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

#### Update with Optimistic Updates
```typescript
const updateMutation = useMutation({
  mutationFn: updateTaskStatus,
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: taskKeys.all });
    
    // Snapshot previous value
    const previousTasks = queryClient.getQueryData(taskKeys.list({}));
    
    // Optimistically update
    queryClient.setQueryData(taskKeys.list({}), (old) =>
      old?.map(task => 
        task.id === variables.taskId 
          ? { ...task, status: variables.status }
          : task
      )
    );
    
    return { previousTasks };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(taskKeys.list({}), context?.previousTasks);
    toast.error('Failed to update task');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: taskKeys.all });
  },
});
```

## Cache Management

### 1. Cache Invalidation Strategy

**Hierarchical Invalidation:**
```typescript
// Invalidate all contact queries
queryClient.invalidateQueries({ queryKey: contactKeys.all });

// Invalidate specific contact list
queryClient.invalidateQueries({ queryKey: contactKeys.lists() });

// Invalidate specific contact
queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
```

**Related Data Invalidation:**
```typescript
// After contact update, invalidate related queries
queryClient.invalidateQueries({ queryKey: contactKeys.all });
queryClient.invalidateQueries({ queryKey: contactKeys.tasks(contactId) });
queryClient.invalidateQueries({ queryKey: taskKeys.all });
```

### 2. Stale Time Configuration

Different stale times based on data volatility:

```typescript
// Frequently updated data (2 seconds)
tasks: { staleTime: 2 * 1000 }

// Moderately updated data (60 seconds) - DEFAULT
contacts: { staleTime: 60 * 1000 }
dashboard: { staleTime: 60 * 1000 }

// Rarely updated data (5 minutes)
userOptions: { staleTime: 5 * 60 * 1000 }
```

### 3. Background Refetch Configuration

```typescript
// Disabled by default for better performance
refetchOnWindowFocus: false,
refetchOnReconnect: false,

// Manual refetch when needed
const { refetch } = useQuery({...});
```

## Error Handling

### 1. Query Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: contactKeys.list({}),
  queryFn: fetchContacts,
  throwOnError: false, // Handle errors in component
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

### 2. Mutation Error Handling

```typescript
const mutation = useMutation({
  mutationFn: createContact,
  onError: (error) => {
    // User-friendly error messages
    if (error.message.includes('duplicate')) {
      toast.error('Contact with this email already exists');
    } else {
      toast.error('Failed to create contact. Please try again.');
    }
    
    // Optional: Send to error tracking
    console.error('Contact creation failed:', error);
  },
});
```

### 3. Retry Configuration

```typescript
// Global retry configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

## Performance Optimizations

### 1. Request Deduplication

TanStack Query automatically deduplicates identical requests:

```typescript
// Multiple components using the same query
// Only one network request will be made
const ContactList1 = () => useQuery({ queryKey: contactKeys.list({}) });
const ContactList2 = () => useQuery({ queryKey: contactKeys.list({}) });
```

### 2. Placeholder Data

Maintain previous data during refetch for better UX:

```typescript
const { data } = useQuery({
  queryKey: contactKeys.list({ search }),
  queryFn: fetchContacts,
  placeholderData: (previousData) => previousData,
});
```

### 3. Prefetching Related Data

```typescript
// Prefetch related data on hover or interaction
const prefetchContactTasks = (contactId: string) => {
  queryClient.prefetchQuery({
    queryKey: contactKeys.tasks(contactId),
    queryFn: () => fetchContactTasks(contactId),
  });
};
```

## Development Tools

### DevTools Configuration

DevTools are automatically excluded from production builds:

```typescript
// Only loads in development
{process.env.NODE_ENV === 'development' && <DevToolsComponent />}

function DevToolsComponent() {
  const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
  return <ReactQueryDevtools initialIsOpen={false} />;
}
```

### Query Key Utilities

Use the provided utilities for consistent cache management:

```typescript
import { queryKeyUtils, contactKeys } from '@/lib/query-keys';

// Invalidate all contact queries
queryKeyUtils.invalidateEntity(queryClient, contactKeys.all);

// Remove stale data
queryKeyUtils.removeEntity(queryClient, contactKeys.all);

// Get all cached contact data
const contactData = queryKeyUtils.getEntityData(queryClient, contactKeys.all);
```

## Testing Strategy

### 1. Unit Tests for Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('should fetch contacts', async () => {
  const { result } = renderHook(() => useContacts({}), { wrapper: createWrapper() });
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

### 2. Integration Tests

Test complete user workflows including cache invalidation:

```typescript
test('should create contact and update cache', async () => {
  // Render component with query and mutation
  // Trigger mutation
  // Verify cache invalidation
  // Verify UI updates
});
```

### 3. Cache Invalidation Tests

```typescript
test('should invalidate related queries', async () => {
  // Set up cache with related data
  // Trigger mutation
  // Verify correct queries are invalidated
});
```

## Migration Benefits

### Performance Improvements

1. **Enhanced Caching**: More sophisticated cache management with background updates
2. **Request Deduplication**: Automatic elimination of duplicate API calls
3. **Optimistic Updates**: Immediate UI feedback with automatic rollback
4. **Background Refetching**: Smart data updates without blocking UI

### Developer Experience

1. **Better TypeScript Support**: Improved type safety and IntelliSense
2. **DevTools Integration**: Powerful debugging and inspection tools
3. **Consistent Patterns**: Standardized query keys and error handling
4. **Better Testing**: Easier to mock and test query behavior

### Bundle Analysis

**Before (SWR)**: ~20KB
**After (TanStack Query)**: ~50KB
**Net Increase**: +30KB for significantly enhanced functionality

The bundle size increase is justified by:
- Advanced caching capabilities
- Built-in optimistic updates
- Request deduplication
- Background synchronization
- Comprehensive DevTools

## Best Practices

### 1. Query Key Management

```typescript
// ✅ Use centralized query key factories
const queryKey = contactKeys.list({ search, filters });

// ❌ Don't use inline query keys
const queryKey = ['contacts', 'list', search, filters];
```

### 2. Error Handling

```typescript
// ✅ Provide user-friendly error messages
onError: (error) => {
  toast.error('Failed to save changes. Please try again.');
}

// ❌ Don't expose technical errors to users
onError: (error) => {
  toast.error(error.message); // Might be technical
}
```

### 3. Cache Invalidation

```typescript
// ✅ Invalidate hierarchically
queryClient.invalidateQueries({ queryKey: contactKeys.all });

// ❌ Don't invalidate too specifically
queryClient.invalidateQueries({ queryKey: contactKeys.list({ search: 'john' }) });
```

### 4. Loading States

```typescript
// ✅ Use appropriate loading indicators
if (isLoading) return <Spinner />;
if (isFetching && !isLoading) return <BackgroundLoader />;

// ❌ Don't block UI for background refetch
if (isLoading || isFetching) return <FullPageSpinner />;
```

## Troubleshooting

### Common Issues

1. **Stale Data**: Check stale time configuration and invalidation patterns
2. **Infinite Refetch Loops**: Verify query key stability and dependencies
3. **Cache Not Updating**: Ensure proper invalidation after mutations
4. **DevTools Not Loading**: Check NODE_ENV and lazy loading implementation

### Debug Tools

1. **React Query DevTools**: Inspect query state and cache
2. **Network Tab**: Monitor API requests and deduplication
3. **Console Logging**: Add temporary logs for query key debugging

## Future Enhancements

### Planned Improvements

1. **Offline Support**: Implement offline-first patterns with background sync
2. **Streaming Updates**: Real-time data synchronization via WebSockets
3. **Advanced Prefetching**: Predictive data loading based on user behavior
4. **Cache Persistence**: Persist critical data across sessions
5. **Query Batching**: Combine multiple requests for better performance

### Performance Monitoring

Monitor these metrics in production:
- Cache hit rates
- Request deduplication effectiveness
- Average query response times
- Bundle size impact on load times
- User-perceived performance improvements