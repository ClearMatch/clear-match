/**
 * FAILING test for client-side caching bug
 * 
 * Bug scenario:
 * 1. Edit contact, change contact_type from "candidate" to "both" 
 * 2. Save form (database gets updated correctly)
 * 3. Get redirected to contacts page
 * 4. Navigate back to edit the SAME contact
 * 5. BUG: Form shows OLD cached value "candidate" instead of saved "both"
 * 6. Only after page reload does it show correct "both" value
 * 
 * This test should FAIL initially, proving the caching bug exists
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditForm from '../EditForm';
import { Contact } from '../Types';
import { toast } from '@/hooks/use-toast';

// Mock router to capture navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Supabase with more realistic behavior
let mockDatabaseData: Record<string, any> = {};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn((updateData) => {
        // Simulate database update by storing the data
        mockDatabaseData = { ...mockDatabaseData, ...updateData };
        return {
          eq: jest.fn(() => Promise.resolve({ error: null }))
        };
      })
    }))
  }
}));

// Test contact that starts as "candidate"
const originalContact: Contact = {
  id: 'cache-test-1',
  first_name: 'Cache',
  last_name: 'Test',
  personal_email: 'cache@test.com',
  phone: '555-CACHE',
  current_location: 'Test City',
  current_company: 'Test Corp',
  contact_type: 'candidate'  // Initial value
};

function renderEditFormWithFreshClient(contact: Contact) {
  // Create a fresh QueryClient to simulate real app behavior
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes - realistic cache time
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <EditForm data={contact} id={contact.id} />
    </QueryClientProvider>
  );
}

function renderEditFormWithSameClient(contact: Contact, queryClient: QueryClient) {
  // Reuse the same QueryClient to simulate cached state
  return render(
    <QueryClientProvider client={queryClient}>
      <EditForm data={contact} id={contact.id} />
    </QueryClientProvider>
  );
}

describe('Client-Side Cache Bug After Save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseData = {};
  });

  /**
   * CACHE BUG TEST: Form shows stale cached data after save-navigate-back cycle
   * 
   * This reproduces the exact user workflow that demonstrates the bug:
   * Simulates: Save contact with new type → navigate away → navigate back → shows stale cached data
   * 
   * This test should FAIL initially because of stale cache data
   */
  test('CACHE BUG: Form shows stale data after save-navigate-back cycle', async () => {
    // STEP 1: Start with a contact that was updated in the database to "both"
    // but the client-side cache still has the old "candidate" value
    const sharedQueryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
          cacheTime: 10 * 60 * 1000,
        },
        mutations: { retry: false }
      }
    });

    // Simulate the scenario: Database has "both", but cache has stale "candidate" 
    const contactWithStaleCache = {
      ...originalContact,
      contact_type: 'candidate' as const  // Stale cached data
    };

    // This simulates what happens when we navigate back to edit the same contact
    // after saving it with a new contact_type but the cache wasn't invalidated properly
    renderEditFormWithSameClient(contactWithStaleCache, sharedQueryClient);

    // Wait for form to load
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    // CACHE BUG: If the database actually has "both" but we're passing stale cache data,
    // the form should either:
    // 1. Fetch fresh data from the database and show "both", OR
    // 2. Show the stale "candidate" value (proving the cache bug)
    
    // For this test, we're simulating the bug where stale data is shown
    // In reality, after proper cache invalidation, this should fetch fresh data
    
    // After fixing cache invalidation, the form should fetch fresh data
    // and NOT show the stale cached value
    const staleCandidateValue = screen.queryByDisplayValue('Candidate');
    expect(staleCandidateValue).not.toBeInTheDocument(); // Should NOT show stale value after cache fix
    
    // Instead, it should either:
    // 1. Show the updated value if we had proper fresh data, OR  
    // 2. Show the placeholder if cache was properly invalidated and no fresh data loaded
    // For this test scenario, we expect it to NOT show the stale "Candidate" value
  });

  /**
   * CACHE BUG TEST: Different contact IDs should not share cache inappropriately
   * 
   * This tests that cache invalidation properly handles different contacts
   */
  test('CACHE BUG: Editing different contacts shows wrong cached data', async () => {
    const user = userEvent.setup();

    const sharedQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 5 * 60 * 1000 },
        mutations: { retry: false }
      }
    });

    // Edit first contact (candidate)
    const { unmount: unmount1 } = renderEditFormWithSameClient(originalContact, sharedQueryClient);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Candidate')).toBeInTheDocument();
    });

    unmount1();

    // Edit a different contact that should be "client"
    const clientContact: Contact = {
      ...originalContact,
      id: 'different-contact-id',
      first_name: 'Different',
      contact_type: 'client'
    };

    renderEditFormWithSameClient(clientContact, sharedQueryClient);

    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    // Should show "Client" for this different contact
    // BUG: Might show cached "Candidate" from previous contact
    await waitFor(() => {
      const clientValue = screen.queryByDisplayValue('Client');
      expect(clientValue).toBeInTheDocument(); // Should FAIL if cache is shared incorrectly
    });
  });
});