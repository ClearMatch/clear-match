import { QueryClient } from '@tanstack/react-query';
import { queryClient } from '../query-client';

describe('QueryClient Configuration', () => {
  describe('Default Options', () => {
    it('should have correct stale time configuration', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.staleTime).toBe(60 * 1000); // 60 seconds
    });

    it('should have correct retry configuration', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.retry).toBe(3);
    });

    it('should have exponential backoff retry delay', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryDelay = defaultOptions.queries?.retryDelay;
      
      expect(typeof retryDelay).toBe('function');
      
      if (typeof retryDelay === 'function') {
        // Test exponential backoff: 1s, 2s, 4s, 8s for attempts 0, 1, 2, 3
        expect(retryDelay(0, new Error('test'))).toBe(1000);
        expect(retryDelay(1, new Error('test'))).toBe(2000);
        expect(retryDelay(2, new Error('test'))).toBe(4000);
        expect(retryDelay(3, new Error('test'))).toBe(8000);
      }
    });

    it('should disable refetch on window focus', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it('should disable refetch on reconnect', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(false);
    });
  });

  describe('QueryClient Instance', () => {
    it('should be a valid QueryClient instance', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('should have correct query cache configuration', () => {
      const queryCache = queryClient.getQueryCache();
      
      expect(queryCache).toBeDefined();
      expect(typeof queryCache.subscribe).toBe('function');
    });

    it('should have correct mutation cache configuration', () => {
      const mutationCache = queryClient.getMutationCache();
      
      expect(mutationCache).toBeDefined();
      expect(typeof mutationCache.subscribe).toBe('function');
    });
  });

  describe('Performance Configuration', () => {
    it('should handle concurrent queries efficiently', async () => {
      const testQueries = Array.from({ length: 10 }, (_, i) => ({
        queryKey: ['test', i],
        queryFn: () => Promise.resolve(`data-${i}`),
      }));

      const results = await Promise.all(
        testQueries.map(query => queryClient.fetchQuery(query))
      );

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result).toBe(`data-${i}`);
      });
    });

    it('should deduplicate identical queries', async () => {
      let callCount = 0;
      const queryFn = () => {
        callCount++;
        return Promise.resolve('test-data');
      };

      const query = {
        queryKey: ['dedup-test'],
        queryFn,
      };

      // Make multiple concurrent requests with same query key
      const results = await Promise.all([
        queryClient.fetchQuery(query),
        queryClient.fetchQuery(query),
        queryClient.fetchQuery(query),
      ]);

      // Should only call queryFn once due to deduplication
      expect(callCount).toBe(1);
      expect(results).toEqual(['test-data', 'test-data', 'test-data']);
    });
  });

  describe('Error Handling', () => {
    it('should retry failed queries according to configuration', async () => {
      let attemptCount = 0;
      const failingQueryFn = () => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error(`Attempt ${attemptCount} failed`));
        }
        return Promise.resolve('success');
      };

      const result = await queryClient.fetchQuery({
        queryKey: ['retry-test'],
        queryFn: failingQueryFn,
      });

      expect(attemptCount).toBe(3);
      expect(result).toBe('success');
    });

    it('should respect retry limit', async () => {
      let attemptCount = 0;
      const alwaysFailingQueryFn = () => {
        attemptCount++;
        return Promise.reject(new Error(`Attempt ${attemptCount} failed`));
      };

      try {
        await queryClient.fetchQuery({
          queryKey: ['always-fail-test'],
          queryFn: alwaysFailingQueryFn,
        });
        fail('Query should have failed');
      } catch (error) {
        expect(attemptCount).toBe(4); // Initial attempt + 3 retries
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      queryClient.clear();
    });

    it('should cache successful query results', async () => {
      let callCount = 0;
      const queryFn = () => {
        callCount++;
        return Promise.resolve('cached-data');
      };

      // First call should execute queryFn
      const result1 = await queryClient.fetchQuery({
        queryKey: ['cache-test'],
        queryFn,
      });

      // Second call should use cache (within stale time)
      const result2 = await queryClient.fetchQuery({
        queryKey: ['cache-test'],
        queryFn,
      });

      expect(callCount).toBe(1);
      expect(result1).toBe('cached-data');
      expect(result2).toBe('cached-data');
    });

    it('should invalidate queries correctly', async () => {
      await queryClient.setQueryData(['invalidate-test'], 'initial-data');
      
      expect(queryClient.getQueryData(['invalidate-test'])).toBe('initial-data');

      await queryClient.invalidateQueries({
        queryKey: ['invalidate-test'],
      });

      // After invalidation, the query should be marked as stale
      const queryState = queryClient.getQueryState(['invalidate-test']);
      expect(queryState?.isInvalidated).toBe(true);
    });

    it('should support partial query key matching for invalidation', async () => {
      // Set up multiple queries with related keys
      await queryClient.setQueryData(['contacts', { status: 'active' }], 'active-contacts');
      await queryClient.setQueryData(['contacts', { status: 'inactive' }], 'inactive-contacts');
      await queryClient.setQueryData(['tasks', { assignee: 'user-1' }], 'user-tasks');

      // Invalidate all contact queries
      await queryClient.invalidateQueries({
        queryKey: ['contacts'],
      });

      // Contact queries should be invalidated
      expect(queryClient.getQueryState(['contacts', { status: 'active' }])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['contacts', { status: 'inactive' }])?.isInvalidated).toBe(true);
      
      // Task queries should not be affected
      expect(queryClient.getQueryState(['tasks', { assignee: 'user-1' }])?.isInvalidated).toBe(false);
    });
  });

  describe('Stale Time Behavior', () => {
    beforeEach(() => {
      queryClient.clear();
    });

    it('should respect stale time configuration', async () => {
      let callCount = 0;
      const queryFn = () => {
        callCount++;
        return Promise.resolve(`call-${callCount}`);
      };

      // First fetch
      const result1 = await queryClient.fetchQuery({
        queryKey: ['stale-test'],
        queryFn,
        staleTime: 100, // 100ms
      });

      // Immediate second fetch (within stale time)
      const result2 = await queryClient.fetchQuery({
        queryKey: ['stale-test'],
        queryFn,
        staleTime: 100,
      });

      expect(callCount).toBe(1);
      expect(result1).toBe('call-1');
      expect(result2).toBe('call-1');

      // Wait for stale time to pass
      await new Promise(resolve => setTimeout(resolve, 150));

      // Third fetch (after stale time)
      const result3 = await queryClient.fetchQuery({
        queryKey: ['stale-test'],
        queryFn,
        staleTime: 100,
      });

      expect(callCount).toBe(2);
      expect(result3).toBe('call-2');
    });
  });

  describe('Production Readiness', () => {
    it('should have appropriate configuration for production', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      // Should not refetch excessively in production
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(false);
      
      // Should have reasonable stale time to reduce server load
      expect(defaultOptions.queries?.staleTime).toBeGreaterThan(0);
      
      // Should have retry logic for resilience
      expect(defaultOptions.queries?.retry).toBeGreaterThan(0);
    });

    it('should handle large numbers of queries without memory leaks', async () => {
      const initialCacheSize = queryClient.getQueryCache().getAll().length;
      
      // Create many queries
      const promises = Array.from({ length: 100 }, (_, i) =>
        queryClient.fetchQuery({
          queryKey: ['memory-test', i],
          queryFn: () => Promise.resolve(`data-${i}`),
        })
      );

      await Promise.all(promises);

      const finalCacheSize = queryClient.getQueryCache().getAll().length;
      
      // Cache should contain the queries but not exceed reasonable limits
      expect(finalCacheSize).toBeGreaterThan(initialCacheSize);
      expect(finalCacheSize).toBeLessThan(200); // Reasonable upper bound
    });
  });
});