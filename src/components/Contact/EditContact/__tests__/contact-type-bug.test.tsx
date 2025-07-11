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
  phone: '555-0123',
  current_location: 'San Francisco',
  current_company: 'Client Corp',
  contact_type: 'client'
};

const bothContact: Contact = {
  id: 'both-1',
  first_name: 'Bob',
  last_name: 'Johnson',
  personal_email: 'bob@both.com', 
  phone: '555-0456',
  current_location: 'Chicago',
  current_company: 'Both Inc',
  contact_type: 'both'
};

const candidateContact: Contact = {
  id: 'candidate-1', 
  first_name: 'John',
  last_name: 'Doe',
  personal_email: 'john@candidate.com',
  phone: '555-0789',
  current_location: 'New York', 
  current_company: 'Candidate LLC',
  contact_type: 'candidate'
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
    const { rerender } = renderEditForm(candidateContact);
    
    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    await waitFor(() => {
      const candidateDisplayed = screen.queryByDisplayValue('Candidate');
      expect(candidateDisplayed).toBeInTheDocument();
    });

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <EditForm data={clientContact} id={clientContact.id} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const contactTypeField = screen.getByLabelText(/contact type/i);
      expect(contactTypeField).toBeInTheDocument();
    });

    await waitFor(() => {
      const clientDisplayed = screen.queryByDisplayValue('Client');
      expect(clientDisplayed).toBeInTheDocument();
    });
  });
});