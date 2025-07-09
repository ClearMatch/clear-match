import { QueryClient } from '@tanstack/react-query';
import { shouldRetryError } from './error-handling';
import { performanceMonitor, startPerformanceMonitoring } from './performance-monitoring';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute - data is considered fresh for this duration
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: (failureCount, error) => {
        // Use smart retry logic based on error type
        return shouldRetryError(error, failureCount);
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with max 30s
    },
    mutations: {
      retry: (failureCount, error) => {
        // Use smart retry logic for mutations too
        return shouldRetryError(error, failureCount);
      },
    },
  },
});

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  startPerformanceMonitoring();
}