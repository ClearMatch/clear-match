import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContacts } from '../useContact';
import { fetchContactsPaginated } from '../contactService';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('../contactService', () => ({
  fetchContactsPaginated: jest.fn(),
}));
jest.mock('@/hooks/useAuth');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockFetchContactsPaginated = fetchContactsPaginated as jest.MockedFunction<typeof fetchContactsPaginated>;
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
    years_of_experience: '5',
    engagement_score: 8,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    tags: [],
  },
  {
    id: 'contact-2',
    first_name: 'Jane',
    last_name: 'Smith',
    personal_email: 'jane@example.com',
    work_email: 'jane@work.com',
    phone: '+0987654321',
    linkedin_url: 'https://linkedin.com/in/janesmith',
    github_url: 'https://github.com/janesmith',
    current_job_title: 'Product Manager',
    current_company: 'ProductCorp',
    current_location: 'New York, NY',
    contact_type: 'lead',
    functional_role: 'product',
    is_active_looking: false,
    tech_stack: ['Python', 'SQL'],
    years_of_experience: '3',
    engagement_score: 6,
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-04T00:00:00Z',
    tags: [],
  }
];

// Create a wrapper component for React Query
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
    mockFetchContactsPaginated.mockResolvedValue(mockContacts);
  });

  describe('Basic Functionality', () => {
    it('should fetch contacts with default parameters', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      await waitFor(() => {
        expect(result.current.contacts).toEqual(mockContacts);
      });

      expect(mockFetchContactsPaginated).toHaveBeenCalledWith(
        0, // page
        25, // pageSize
        undefined, // search
        expect.any(Object) // filters
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading states correctly', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.contacts).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle search input changes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      act(() => {
        result.current.setSearchInputValue('John');
      });

      expect(result.current.searchInputValue).toBe('John');
      expect(result.current.isSearching).toBe(true);

      // Wait for debounce and new query
      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
      }, { timeout: 1000 });
    });

    it('should handle filter changes', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      const newFilters = {
        contact_type: ['lead'],
        functional_role: [],
        is_active_looking: null,
        location_category: [],
        current_company_size: [],
        past_company_sizes: [],
        urgency_level: [],
        employment_status: [],
        engagement_score: [],
        engagement_range: [],
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
    });

    it('should provide onLoadMore function', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      await waitFor(() => {
        expect(result.current.contacts).toEqual(mockContacts);
      });

      // Just verify the function exists and doesn't throw
      expect(typeof result.current.onLoadMore).toBe('function');
      
      // The actual pagination logic is handled by react-query internally
      act(() => {
        result.current.onLoadMore();
      });
    });
  });

  describe('Error Handling', () => {
    it('should expose error state from react-query', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useContacts(), { wrapper });

      // Initially no error
      expect(result.current.error).toBe(null);
      
      // The error handling is managed by react-query
      // We just verify the error property exists
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('Without Authentication', () => {
    it('should not fetch when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: jest.fn(),
      } as any);

      const wrapper = createWrapper();
      renderHook(() => useContacts(), { wrapper });

      expect(mockFetchContactsPaginated).not.toHaveBeenCalled();
    });
  });
});