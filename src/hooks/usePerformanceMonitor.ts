import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  queryKey: string;
  operation: 'query' | 'mutation' | 'infinite-query';
  duration: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

interface PerformanceMonitorOptions {
  queryKey: string;
  operation: 'query' | 'mutation' | 'infinite-query';
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: Error | null;
  threshold?: number; // ms threshold for slow operations
}

export function usePerformanceMonitor({
  queryKey,
  operation,
  isLoading,
  isSuccess,
  isError,
  error,
  threshold = 1000, // 1 second default threshold
}: PerformanceMonitorOptions) {
  const startTimeRef = useRef<number | null>(null);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (isLoading && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      hasLoggedRef.current = false;
    }

    if (!isLoading && startTimeRef.current && !hasLoggedRef.current) {
      const duration = Date.now() - startTimeRef.current;
      const success = isSuccess || false;
      const errorMessage = isError && error ? error.message : undefined;

      const metrics: PerformanceMetrics = {
        queryKey,
        operation,
        duration,
        success,
        error: errorMessage,
        timestamp: Date.now(),
      };

      // Log performance metrics
      if (duration > threshold) {
        console.warn(`⚠️ Slow ${operation}:`, {
          queryKey,
          duration: `${duration}ms`,
          success,
          error: errorMessage,
        });
      } else {
        console.debug(`✅ ${operation} completed:`, {
          queryKey,
          duration: `${duration}ms`,
          success,
        });
      }

      // In a real application, you would send this to your monitoring service
      // Example: analytics.track('query_performance', metrics);
      
      // Reset for next operation
      startTimeRef.current = null;
      hasLoggedRef.current = true;
    }
  }, [isLoading, isSuccess, isError, error, queryKey, operation, threshold]);

  return {
    startTime: startTimeRef.current,
    isMonitoring: !!startTimeRef.current,
  };
}

// Hook for monitoring infinite queries specifically
export function useInfiniteQueryPerformanceMonitor({
  queryKey,
  isLoading,
  isFetchingNextPage,
  isSuccess,
  isError,
  error,
  threshold = 1000,
}: {
  queryKey: string;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  error?: Error | null;
  threshold?: number;
}) {
  const initialLoadMonitor = usePerformanceMonitor({
    queryKey: `${queryKey}_initial`,
    operation: 'infinite-query',
    isLoading: isLoading && !isFetchingNextPage,
    isSuccess,
    isError,
    error,
    threshold,
  });

  const nextPageMonitor = usePerformanceMonitor({
    queryKey: `${queryKey}_next_page`,
    operation: 'infinite-query',
    isLoading: isFetchingNextPage,
    isSuccess,
    isError,
    error,
    threshold: threshold / 2, // Next page loads should be faster
  });

  return {
    initialLoad: initialLoadMonitor,
    nextPage: nextPageMonitor,
  };
}