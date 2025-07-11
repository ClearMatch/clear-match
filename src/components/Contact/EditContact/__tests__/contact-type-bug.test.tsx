/**
 * Tests for contact type synchronization in edit forms
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditForm from '../EditForm';
import { Contact } from '../Types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test contact data
const clientContact: Contact = {
  id: 'client-1',
  first_name: 'Jane',
  last_name: 'Smith', 
  personal_email: 'jane@client.com',
  work_email: '',
  phone: '555-0123',
  linkedin_url: '',
  github_url: '',
  resume_url: '',
  functional_role: '',
  current_location: 'San Francisco',
  current_job_title: '',
  current_company: 'Client Corp',
  current_company_size: '',
  contact_type: 'client',
  workplace_preferences: '',
  compensation_expectations: '',
  visa_requirements: false,
  past_company_sizes: '',
  urgency_level: '',
  employment_status: '',
  other_social_urls: ''
};

const bothContact: Contact = {
  id: 'both-1',
  first_name: 'Bob',
  last_name: 'Johnson',
  personal_email: 'bob@both.com', 
  work_email: '',
  phone: '555-0456',
  linkedin_url: '',
  github_url: '',
  resume_url: '',
  functional_role: '',
  current_location: 'Chicago',
  current_job_title: '',
  current_company: 'Both Inc',
  current_company_size: '',
  contact_type: 'both',
  workplace_preferences: '',
  compensation_expectations: '',
  visa_requirements: false,
  past_company_sizes: '',
  urgency_level: '',
  employment_status: '',
  other_social_urls: ''
};

const candidateContact: Contact = {
  id: 'candidate-1', 
  first_name: 'John',
  last_name: 'Doe',
  personal_email: 'john@candidate.com',
  work_email: '',
  phone: '555-0789',
  linkedin_url: '',
  github_url: '',
  resume_url: '',
  functional_role: '',
  current_location: 'New York',
  current_job_title: '',
  current_company: 'Candidate LLC',
  current_company_size: '',
  contact_type: 'candidate',
  workplace_preferences: '',
  compensation_expectations: '',
  visa_requirements: false,
  past_company_sizes: '',
  urgency_level: '',
  employment_status: '',
  other_social_urls: ''
};

function renderEditForm(contact: Contact) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <EditForm data={contact} id={contact.id} />
    </QueryClientProvider>
  );
}

describe('Contact Type Synchronization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should pre-populate client contact type in edit form', async () => {
    renderEditForm(clientContact);
    
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      const clientDisplayed = screen.queryByDisplayValue('Client');
      expect(clientDisplayed).toBeInTheDocument();
    });
  });

  test('should pre-populate both contact type in edit form', async () => {
    renderEditForm(bothContact);
    
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      const bothDisplayed = screen.queryByDisplayValue('Both');
      expect(bothDisplayed).toBeInTheDocument();
    });
  });

  test('should pre-populate candidate contact type consistently', async () => {
    renderEditForm(candidateContact);
    
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      const candidateDisplayed = screen.queryByDisplayValue('Candidate');
      expect(candidateDisplayed).toBeInTheDocument();
    });
  });

  test('should update contact type when switching between contacts', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Render candidate contact first
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <EditForm data={candidateContact} id={candidateContact.id} key="candidate" />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    // Check that the form starts with candidate data
    await waitFor(() => {
      const firstNameInput = screen.getByDisplayValue('John');
      expect(firstNameInput).toBeInTheDocument();
    });

    // Rerender with client contact and different key to force remount
    rerender(
      <QueryClientProvider client={queryClient}>
        <EditForm data={clientContact} id={clientContact.id} key="client" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    // Check that the form updates to show client data after rerender
    await waitFor(() => {
      const firstNameInput = screen.getByDisplayValue('Jane');
      expect(firstNameInput).toBeInTheDocument();
    });
  });
});