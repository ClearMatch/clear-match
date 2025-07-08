import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from '../useTasks';
import {
  fetchActivitiesWithRelations,
  fetchAssigneeOptions, 
  fetchCreatorOptions
} from '../index';

// Mock dependencies
jest.mock('../index', () => ({
  fetchActivitiesWithRelations: jest.fn(),
  fetchAssigneeOptions: jest.fn(),
  fetchCreatorOptions: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockFetchActivitiesWithRelations = fetchActivitiesWithRelations as jest.MockedFunction<typeof fetchActivitiesWithRelations>;
const mockFetchAssigneeOptions = fetchAssigneeOptions as jest.MockedFunction<typeof fetchAssigneeOptions>;
const mockFetchCreatorOptions = fetchCreatorOptions as jest.MockedFunction<typeof fetchCreatorOptions>;

// Test data
const mockTasks = [
  {
    id: 'task-1',
    type: 'task',
    description: 'Follow up on application',
    status: 'pending',
    priority: 1,
    created_by: 'user-456',
    contact_id: 'contact-1',
    organization_id: 'org-456',
    due_date: '2024-12-31T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    subject: 'Contact John Doe',
    content: 'Follow up on application',
    assigned_to: 'user-123',
    event_id: null,
    job_posting_id: null,
    metadata: {},
    contacts: {
      id: 'contact-1',
      first_name: 'John',
      last_name: 'Doe'
    },
    profiles: {
      id: 'user-123',
      first_name: 'Assignee',
      last_name: 'User'
    }
  },
  {
    id: 'task-2',
    type: 'task',
    description: 'Review candidate application',
    status: 'in_progress',
    priority: 2,
    created_by: 'user-123',
    contact_id: 'contact-2',
    organization_id: 'org-456',
    due_date: '2024-12-25T00:00:00Z',
    created_at: '2024-01-02T00:00:00Z',
    subject: 'Review application',
    content: 'Review candidate application',
    assigned_to: 'user-456',
    event_id: null,
    job_posting_id: null,
    metadata: {},
    contacts: {
      id: 'contact-2',
      first_name: 'Jane',
      last_name: 'Smith'
    },
    profiles: {
      id: 'user-456',
      first_name: 'Creator',
      last_name: 'User'
    }
  }
];

const mockUsers = [
  {
    value: 'user-123',
    label: 'John Smith'
  },
  {
    value: 'user-456',
    label: 'Jane Doe'
  }
];

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

describe('Task Query Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockFetchActivitiesWithRelations.mockResolvedValue(mockTasks);
    mockFetchAssigneeOptions.mockResolvedValue(mockUsers);
    mockFetchCreatorOptions.mockResolvedValue(mockUsers);
  });

  describe('useTasks Hook', () => {
    it('should fetch tasks with default parameters', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toEqual(mockTasks);
      });

      expect(mockFetchActivitiesWithRelations).toHaveBeenCalledWith(undefined, undefined);
      expect(result.current.loading).toBe(false);
    });

    it('should fetch assignee and creator options', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.assigneeOptions).toEqual(mockUsers);
        expect(result.current.creatorOptions).toEqual(mockUsers);
      });

      expect(mockFetchAssigneeOptions).toHaveBeenCalled();
      expect(mockFetchCreatorOptions).toHaveBeenCalled();
    });

    it('should handle search input changes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      act(() => {
        result.current.onSearchChange('Contact');
      });

      expect(result.current.searchInputValue).toBe('Contact');
      expect(result.current.isSearching).toBe(true);

      // Wait for debounce
      await waitFor(() => {
        expect(result.current.debouncedSearchQuery).toBe('Contact');
        expect(result.current.isSearching).toBe(false);
      }, { timeout: 1000 });
    });

    it('should handle filter changes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      const newFilters = {
        type: [],
        status: ['pending'],
        priority: ['high'],
        assigned_to: [],
        created_by: [],
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });

    it('should toggle filters visibility', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      expect(result.current.showFilters).toBe(false);

      act(() => {
        result.current.onToggleFilters();
      });

      expect(result.current.showFilters).toBe(true);
    });

    it('should clear filters', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      // Set some filters first
      act(() => {
        result.current.setFilters({
          type: [],
          status: ['pending'],
          priority: ['high'],
          assigned_to: [],
          created_by: [],
        });
      });

      expect(result.current.filters.status).toEqual(['pending']);

      // Clear filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters.status).toEqual([]);
      expect(result.current.filters.priority).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch tasks';
      mockFetchActivitiesWithRelations.mockRejectedValue(new Error(errorMessage));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.tasks).toEqual([]);
    });

    it('should refetch tasks when requested', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toEqual(mockTasks);
      });

      // Clear the mock and set up new data
      mockFetchActivitiesWithRelations.mockClear();
      const newTasks = [mockTasks[0]!];
      mockFetchActivitiesWithRelations.mockResolvedValue(newTasks);

      act(() => {
        result.current.refetchTasks();
      });

      await waitFor(() => {
        expect(mockFetchActivitiesWithRelations).toHaveBeenCalled();
      });
    });

    it('should call fetch with correct parameters when search and filters are applied', async () => {
      mockFetchActivitiesWithRelations.mockClear();
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      // Set search and filters
      act(() => {
        result.current.onSearchChange('test search');
        result.current.setFilters({
          type: [],
          status: ['pending'],
          priority: [],
          assigned_to: [],
          created_by: [],
        });
      });

      // Wait for debounced search and filters to take effect
      await waitFor(() => {
        expect(mockFetchActivitiesWithRelations).toHaveBeenCalledWith(
          'test search',
          { status: ['pending'] }
        );
      }, { timeout: 1000 });
    });
  });
});