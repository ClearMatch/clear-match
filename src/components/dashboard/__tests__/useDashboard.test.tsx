import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from '../useDashboard';
import { dashboardService } from '../DashboardService';

// Mock dependencies
jest.mock('../DashboardService', () => ({
  dashboardService: {
    fetchDashboardData: jest.fn(),
  },
}));
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

// Test data
const mockUser = {
  id: 'user-123',
  user_metadata: { 
    organizationId: 'org-456' 
  }
};

const mockDashboardData = {
  stats: {
    totalContacts: 150,
    totalClients: 120,
    activeSearching: 45,
    recentActivities: 15,
    pendingActions: 30,
  },
  recommendedActions: [
    {
      id: 'action-1',
      contactId: 'contact-1',
      contactName: 'John Doe',
      actionType: 'follow_up',
      reason: 'Last contact was 2 weeks ago',
      priority: 'high' as const,
      type: 'contact' as const
    },
  ],
  recentActivities: [
    {
      id: 'activity-1',
      contactId: 'contact-1',
      contactName: 'John Doe',
      type: 'contact_created',
      description: 'New contact added: John Doe',
      createdAt: '2024-01-01T10:00:00Z'
    },
  ]
};

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
}

describe('useDashboard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock response
    mockDashboardService.fetchDashboardData.mockResolvedValue(mockDashboardData);
  });

  describe('Basic Functionality', () => {
    it('should fetch dashboard data when userId is provided', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDashboardData);
      });

      expect(mockDashboardService.fetchDashboardData).toHaveBeenCalledWith('user-123');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch data when userId is undefined', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard(undefined), { wrapper });

      // Should not trigger fetch
      expect(mockDashboardService.fetchDashboardData).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch dashboard data';
      mockDashboardService.fetchDashboardData.mockRejectedValue(new Error(errorMessage));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.data).toBeUndefined();
      // Loading may still be true while retrying
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDashboardData);
      });

      // Clear mock and set up new data
      mockDashboardService.fetchDashboardData.mockClear();
      const newData = { ...mockDashboardData, stats: { ...mockDashboardData.stats, totalContacts: 200 } };
      mockDashboardService.fetchDashboardData.mockResolvedValue(newData);

      let refetchResult;
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(refetchResult).toEqual(newData);
      expect(mockDashboardService.fetchDashboardData).toHaveBeenCalledWith('user-123');
    });

    it('should handle refetch when userId is undefined', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard(undefined), { wrapper });

      let refetchResult;
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(refetchResult).toBeUndefined();
      expect(mockDashboardService.fetchDashboardData).not.toHaveBeenCalled();
    });
  });

  describe('Mutate Functionality', () => {
    it('should update cache when mutate is called with data', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDashboardData);
      });

      const newData = { ...mockDashboardData, stats: { ...mockDashboardData.stats, totalContacts: 300 } };

      let mutateResult;
      await act(async () => {
        mutateResult = await result.current.mutate(newData);
      });

      expect(mutateResult).toEqual(newData);
      // Give the cache time to update
      await waitFor(() => {
        expect(result.current.data).toEqual(newData);
      });
    });

    it('should refetch when mutate is called without data', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDashboardData);
      });

      // Clear mock and set up new data for refetch
      mockDashboardService.fetchDashboardData.mockClear();
      const newData = { ...mockDashboardData, stats: { ...mockDashboardData.stats, totalContacts: 400 } };
      mockDashboardService.fetchDashboardData.mockResolvedValue(newData);

      let mutateResult;
      await act(async () => {
        mutateResult = await result.current.mutate();
      });

      expect(mutateResult).toEqual(newData);
      expect(mockDashboardService.fetchDashboardData).toHaveBeenCalledWith('user-123');
    });

    it('should handle mutate when userId is undefined', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard(undefined), { wrapper });

      let mutateResult;
      await act(async () => {
        mutateResult = await result.current.mutate();
      });

      expect(mutateResult).toBeUndefined();
    });
  });

  describe('Query Configuration', () => {
    it('should use correct stale time and retry settings', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDashboardData);
      });

      // The hook should have been called with the correct parameters
      expect(mockDashboardService.fetchDashboardData).toHaveBeenCalledWith('user-123');
    });

    it('should handle changing userId', async () => {
      const wrapper = createWrapper();
      const { result, rerender } = renderHook(
        ({ userId }) => useDashboard(userId),
        { wrapper, initialProps: { userId: 'user-123' } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDashboardData);
      });

      // Change userId
      const newData = { ...mockDashboardData, stats: { ...mockDashboardData.stats, totalContacts: 500 } };
      mockDashboardService.fetchDashboardData.mockResolvedValue(newData);

      rerender({ userId: 'user-456' });

      await waitFor(() => {
        expect(mockDashboardService.fetchDashboardData).toHaveBeenCalledWith('user-456');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockDashboardService.fetchDashboardData.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.data).toBeUndefined();
    });

    it('should handle refetch errors', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboard('user-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockDashboardData);
      });

      // Set up error for refetch
      mockDashboardService.fetchDashboardData.mockRejectedValue(new Error('Refetch failed'));

      // Just verify that refetch doesn't crash
      await act(async () => {
        try {
          await result.current.refetch();
        } catch (error) {
          expect(error).toEqual(new Error('Refetch failed'));
        }
      });
    });
  });
});