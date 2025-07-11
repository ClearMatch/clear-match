/**
 * Tests for client-side cache invalidation after contact updates
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditForm from '../EditForm';
import { Contact } from '../Types';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
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

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Supabase
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

// Test data
const originalContact: Contact = {
  id: 'cache-test-1',
  first_name: 'Cache',
  last_name: 'Test',
  personal_email: 'cache@test.com',
  work_email: '',
  phone: '555-CACHE',
  linkedin_url: '',
  github_url: '',
  resume_url: '',
  functional_role: '',
  current_location: 'Test City',
  current_job_title: '',
  current_company: 'Test Corp',
  current_company_size: '',
  contact_type: 'candidate',  // Initial value
  workplace_preferences: '',
  compensation_expectations: '',
  visa_requirements: false,
  past_company_sizes: '',
  urgency_level: '',
  employment_status: '',
  other_social_urls: ''
};

function renderEditFormWithFreshClient(contact: Contact) {
  // Create a fresh QueryClient to simulate real app behavior
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes - realistic cache time
        gcTime: 10 * 60 * 1000, // 10 minutes
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

describe('Client-Side Cache Invalidation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabaseData = {};
  });

  test('should display contact type from props data', async () => {
    const sharedQueryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
        },
        mutations: { retry: false }
      }
    });

    // Test that form correctly displays the contact type from the data prop
    const candidateContact = {
      ...originalContact,
      contact_type: 'candidate' as const
    };

    renderEditFormWithSameClient(candidateContact, sharedQueryClient);

    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    const candidateValue = screen.queryByDisplayValue('Candidate');
    expect(candidateValue).toBeInTheDocument();
  });

  test('should handle cache correctly for different contacts', async () => {
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

    await waitFor(() => {
      const clientValue = screen.queryByDisplayValue('Client');
      expect(clientValue).toBeInTheDocument();
    });
  });
});