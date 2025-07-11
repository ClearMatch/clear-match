/**
 * FAILING tests that reproduce the contact type syncing bug
 * These tests should FAIL initially, demonstrating the bug exists
 * After we fix the code, these tests should PASS
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditForm from '../EditForm';
import { Contact } from '../Types';

// Mock the dependencies that cause test environment issues
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

// Test contacts that should reproduce the bug
const clientContact: Contact = {
  id: 'client-1',
  first_name: 'Jane',
  last_name: 'Smith', 
  personal_email: 'jane@client.com',
  phone: '555-0123',
  current_location: 'San Francisco',
  current_company: 'Client Corp',
  contact_type: 'client'  // This should pre-populate as "Client" but currently doesn't
};

const bothContact: Contact = {
  id: 'both-1',
  first_name: 'Bob',
  last_name: 'Johnson',
  personal_email: 'bob@both.com', 
  phone: '555-0456',
  current_location: 'Chicago',
  current_company: 'Both Inc',
  contact_type: 'both'   // This should pre-populate as "Both" but currently doesn't
};

const candidateContact: Contact = {
  id: 'candidate-1', 
  first_name: 'John',
  last_name: 'Doe',
  personal_email: 'john@candidate.com',
  phone: '555-0789',
  current_location: 'New York', 
  current_company: 'Candidate LLC',
  contact_type: 'candidate'  // This works but inconsistently
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

describe('Contact Type Bug Reproduction Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BUG TEST 1: Client contact type should pre-populate but doesn't
   * Expected: Form shows "Client" selected in dropdown
   * Actual: Form shows placeholder "Select a Relationship" 
   */
  test('BUG: Client contact type does not pre-populate in edit form', async () => {
    renderEditForm(clientContact);
    
    // Wait for form to load and populate
    await waitFor(() => {
      // Look for the contact type field
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    }, { timeout: 3000 });

    // The bug: This should show "Client" but instead shows the placeholder
    // This test SHOULD FAIL initially because the bug exists
    await waitFor(() => {
      // Try to find "Client" displayed as the selected value
      const clientDisplayed = screen.queryByDisplayValue('Client');
      expect(clientDisplayed).toBeInTheDocument(); // This should FAIL due to the bug
    });
  });

  /**
   * BUG TEST 2: Both contact type should pre-populate but doesn't  
   * Expected: Form shows "Both" selected in dropdown
   * Actual: Form shows placeholder "Select a Relationship"
   */
  test('BUG: Both contact type does not pre-populate in edit form', async () => {
    renderEditForm(bothContact);
    
    // Wait for form to load and populate
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    }, { timeout: 3000 });

    // The bug: This should show "Both" but instead shows the placeholder  
    // This test SHOULD FAIL initially because the bug exists
    await waitFor(() => {
      const bothDisplayed = screen.queryByDisplayValue('Both');
      expect(bothDisplayed).toBeInTheDocument(); // This should FAIL due to the bug
    });
  });

  /**
   * BUG TEST 3: Candidate works but inconsistently (only after reload)
   * Expected: Form shows "Candidate" selected immediately
   * Actual: Sometimes shows placeholder, works after reload
   */
  test('BUG: Candidate contact type is inconsistent on first load', async () => {
    renderEditForm(candidateContact);
    
    // Wait for form to load 
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    }, { timeout: 3000 });

    // This might pass sometimes, fail sometimes due to timing issues
    // Should consistently show "Candidate" but currently doesn't always
    await waitFor(() => {
      const candidateDisplayed = screen.queryByDisplayValue('Candidate');
      expect(candidateDisplayed).toBeInTheDocument(); // May fail due to timing/consistency issues
    });
  });

  /**
   * BUG TEST 4: Contact type value after data change
   * This simulates switching between different contacts
   * Expected: Form should show the correct contact type for each contact
   * Actual: Form doesn't update properly when contact data changes
   */
  test('BUG: Contact type not updated when switching between contacts', async () => {
    // Start with a candidate contact
    const { rerender } = renderEditForm(candidateContact);
    
    // Wait for form to load with candidate data
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    // Should show candidate initially (this might work)
    await waitFor(() => {
      const candidateDisplayed = screen.queryByDisplayValue('Candidate');
      expect(candidateDisplayed).toBeInTheDocument();
    });

    // Now switch to a client contact (simulating editing a different contact)
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <EditForm data={clientContact} id={clientContact.id} />
      </QueryClientProvider>
    );

    // Wait for the form to reload with client data
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    // BUG: This should show "Client" but might still show "Candidate" or placeholder
    // This test should FAIL initially because of the component re-rendering bug
    await waitFor(() => {
      const clientDisplayed = screen.queryByDisplayValue('Client');
      expect(clientDisplayed).toBeInTheDocument(); // This should FAIL due to the bug
    });
  });
});