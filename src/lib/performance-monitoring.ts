// Performance monitoring utilities for Clear Match application

export interface PerformanceMetrics {
  queryKey: string;
  operation: 'query' | 'mutation' | 'infinite-query';
  duration: number;
  success: boolean;
  error?: string;
  timestamp: number;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 metrics in memory

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`🐌 Slow ${metric.operation}:`, {
        queryKey: metric.queryKey,
        duration: `${metric.duration}ms`,
        success: metric.success,
        error: metric.error,
        timestamp: new Date(metric.timestamp).toISOString(),
      });
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    errorRate: number;
    operationsByType: Record<string, number>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: 0,
        errorRate: 0,
        operationsByType: {},
      };
    }

    const totalOperations = this.metrics.length;
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
    const slowOperations = this.metrics.filter(m => m.duration > 1000).length;
    const errorOperations = this.metrics.filter(m => !m.success).length;
    const errorRate = errorOperations / totalOperations;

    const operationsByType = this.metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOperations,
      averageDuration: Math.round(averageDuration),
      slowOperations,
      errorRate: Math.round(errorRate * 100) / 100,
      operationsByType,
    };
  }

  /**
   * Get slow operations
   */
  getSlowOperations(threshold = 1000): PerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  /**
   * Get error operations
   */
  getErrorOperations(): PerformanceMetrics[] {
    return this.metrics.filter(m => !m.success);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function to log performance summary (useful for debugging)
export function logPerformanceSummary(): void {
  const summary = performanceMonitor.getSummary();
  console.group('📊 Performance Summary');
  console.log('Total Operations:', summary.totalOperations);
  console.log('Average Duration:', `${summary.averageDuration}ms`);
  console.log('Slow Operations:', summary.slowOperations);
  console.log('Error Rate:', `${summary.errorRate}%`);
  console.log('Operations by Type:', summary.operationsByType);
  console.groupEnd();
}

// Helper function to monitor query performance in development
export function startPerformanceMonitoring(): void {
  if (process.env.NODE_ENV === 'development') {
    // Log performance summary every 30 seconds in development
    setInterval(() => {
      const summary = performanceMonitor.getSummary();
      if (summary.totalOperations > 0) {
        logPerformanceSummary();
      }
    }, 30000);
  }
}

// TanStack Query performance observer
export function createQueryObserver() {
  return {
    onQueryStart: (query: any) => {
      const queryKey = Array.isArray(query.queryKey) ? query.queryKey.join('_') : query.queryKey;
      console.debug(`🔍 Query started: ${queryKey}`);
    },
    onQueryEnd: (query: any, result: any) => {
      const queryKey = Array.isArray(query.queryKey) ? query.queryKey.join('_') : query.queryKey;
      const duration = result.duration || 0;
      const success = !result.error;
      
      performanceMonitor.record({
        queryKey,
        operation: 'query',
        duration,
        success,
        error: result.error?.message,
        timestamp: Date.now(),
      });
    },
  };
}