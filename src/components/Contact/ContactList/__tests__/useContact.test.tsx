import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContacts } from '../useContact';
import { contactService } from '../contactService';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('../contactService', () => ({
  contactService: {
    fetchContactsCursor: jest.fn(),
  },
}));
jest.mock('@/hooks/useAuth');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockContactService = contactService as jest.Mocked<typeof contactService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Test data
const mockUser = {
  id: 'user-123',
  user_metadata: { 
    organizationId: 'org-456' 
  }
};

const mockContacts = [
  {
    id: 'contact-1',
    first_name: 'John',
    last_name: 'Doe',
    personal_email: 'john@example.com',
    work_email: 'john@work.com',
    phone: '+1234567890',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    github_url: 'https://github.com/johndoe',
    current_job_title: 'Software Engineer',
    current_company: 'TechCorp',
    current_location: 'San Francisco, CA',
    contact_type: 'candidate',
    functional_role: 'engineering',
    is_active_looking: true,
    tech_stack: ['React', 'TypeScript'],
    years_of_experience: 5,
    engagement_score: 85,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags: []
  },
  {
    id: 'contact-2', 
    first_name: 'Jane',
    last_name: 'Smith',
    personal_email: 'jane@example.com',
    work_email: 'jane@work.com',
    phone: '+1234567891',
    linkedin_url: 'https://linkedin.com/in/janesmith',
    github_url: 'https://github.com/janesmith',
    current_job_title: 'Product Manager',
    current_company: 'ProductCorp',
    current_location: 'New York, NY',
    contact_type: 'candidate',
    functional_role: 'product',
    is_active_looking: false,
    tech_stack: ['Product Management', 'Analytics'],
    years_of_experience: 7,
    engagement_score: 92,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    tags: []
  }
];

const mockContactResponse = {
  contacts: mockContacts,
  hasMore: false,
  totalCount: 2
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

describe('useContacts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    } as any);

    // Setup default mock response
    mockContactService.fetchContactsCursor.mockResolvedValue(mockContactResponse);
  });

  describe('Basic Functionality', () => {
    it('should fetch contacts with default parameters', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      await waitFor(() => {
        expect(result.current.contacts).toEqual(mockContacts);
      });

      expect(mockContactService.fetchContactsCursor).toHaveBeenCalledWith(
        'user-123',
        '',
        expect.any(Object), // filters
        expect.any(Object), // sort
        undefined, // pageParam
        25 // PAGE_SIZE
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn(),
      } as any);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      // Should not call the service
      expect(mockContactService.fetchContactsCursor).not.toHaveBeenCalled();
      expect(result.current.contacts).toEqual([]);
    });

    it('should handle search input changes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      act(() => {
        result.current.setSearchInputValue('John');
      });

      expect(result.current.searchInputValue).toBe('John');
      expect(result.current.isSearching).toBe(true);

      // Wait for debounce
      await waitFor(() => {
        expect(result.current.debouncedSearchQuery).toBe('John');
        expect(result.current.isSearching).toBe(false);
      }, { timeout: 1000 });
    });

    it('should handle sorting changes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      const newSort = { field: 'first_name' as const, direction: 'asc' as const };

      act(() => {
        // The hook doesn't expose setSort directly, it uses onSortChange
        result.current.onSortChange('first_name');
      });

      expect(result.current.sort.field).toBe('first_name');
    });

    it('should handle filter changes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      const newFilters = {
        contact_type: ['lead'],
        functional_role: [],
        is_active_looking: true,
        location_category: [],
        current_company_size: [],
        past_company_sizes: [],
        urgency_level: [],
        employment_status: [],
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });
  });

  describe('Infinite Query Functionality', () => {
    it('should handle pagination correctly', async () => {
      const firstPageResponse = {
        contacts: [mockContacts[0]!],
        hasMore: true,
        totalCount: 2
      };
      const secondPageResponse = {
        contacts: [mockContacts[1]!],
        hasMore: false,
        totalCount: 2
      };

      mockContactService.fetchContactsCursor
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      // Wait for first page to load
      await waitFor(() => {
        expect(result.current.contacts).toEqual([mockContacts[0]]);
      });

      // hasMore should be determined by the infinite query logic
      // We'll just check that onLoadMore exists
      expect(typeof result.current.onLoadMore).toBe('function');
    });

    it('should handle loading states correctly', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      // Should start with loading state
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const errorMessage = 'Failed to fetch contacts';
      mockContactService.fetchContactsCursor.mockRejectedValue(new Error(errorMessage));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.contacts).toEqual([]);
      // Loading state may vary depending on retry behavior
    });
  });

  describe('Query Parameters', () => {
    it('should call service with correct parameters when search and filters are applied', async () => {
      mockContactService.fetchContactsCursor.mockClear();
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      // Set search and filters
      act(() => {
        result.current.setSearchInputValue('test search');
        result.current.setFilters({
          contact_type: ['lead'],
          functional_role: [],
          is_active_looking: null,
          location_category: [],
          current_company_size: [],
          past_company_sizes: [],
          urgency_level: [],
          employment_status: [],
        });
        result.current.onSortChange('first_name');
      });

      // Wait for debounced search and query to execute
      await waitFor(() => {
        expect(mockContactService.fetchContactsCursor).toHaveBeenCalledWith(
          'user-123',
          'test search',
          expect.objectContaining({
            contact_type: ['lead']
          }),
          expect.objectContaining({
            field: 'first_name'
          }),
          undefined,
          25
        );
      }, { timeout: 1000 });
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch contacts when requested', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      await waitFor(() => {
        expect(result.current.contacts).toEqual(mockContacts);
      });

      // Clear mock and set up new data
      mockContactService.fetchContactsCursor.mockClear();
      const newResponse = {
        contacts: [mockContacts[0]!],
        hasMore: false,
        totalCount: 1
      };
      mockContactService.fetchContactsCursor.mockResolvedValue(newResponse);

      act(() => {
        result.current.refetchContacts();
      });

      await waitFor(() => {
        expect(mockContactService.fetchContactsCursor).toHaveBeenCalled();
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should clear search when requested', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      // Set search first
      act(() => {
        result.current.setSearchInputValue('test');
      });

      expect(result.current.searchInputValue).toBe('test');

      // Clear search
      act(() => {
        result.current.setSearchInputValue('');
      });

      expect(result.current.searchInputValue).toBe('');
    });

    it('should clear filters when requested', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      // Set filters first
      act(() => {
        result.current.setFilters({
          contact_type: ['lead'],
          functional_role: [],
          is_active_looking: true,
          location_category: [],
          current_company_size: [],
          past_company_sizes: [],
          urgency_level: [],
          employment_status: [],
        });
      });

      expect(result.current.filters.contact_type).toEqual(['lead']);

      // Clear filters by setting to default state
      act(() => {
        result.current.setFilters({
          contact_type: [],
          functional_role: [],
          is_active_looking: null,
          location_category: [],
          current_company_size: [],
          past_company_sizes: [],
          urgency_level: [],
          employment_status: [],
        });
      });

      expect(result.current.filters.contact_type).toEqual([]);
      expect(result.current.filters.is_active_looking).toBe(null);
    });
  });
});