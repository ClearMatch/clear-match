import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function that includes common providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Add any global providers here (theme, router, etc.)
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  }

  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Create a user event instance for consistent usage
export const createUser = () => userEvent.setup()

// Mock form control for React Hook Form components
export const createMockFormControl = () => ({
  field: {
    name: 'test-field',
    value: '',
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ref: jest.fn(),
  },
  fieldState: {
    invalid: false,
    isTouched: false,
    isDirty: false,
    error: undefined,
  },
  formState: {
    touchedFields: {},
    isSubmitted: false,
    isSubmitting: false,
    isValidating: false,
    isValid: false,
    isDirty: false,
    isLoading: false,
    submitCount: 0,
    dirtyFields: {},
    errors: {},
  },
})

// Mock Supabase response patterns
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  count: null,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

// Mock Supabase query builder
export const createMockSupabaseQuery = (response: any) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(response),
  then: jest.fn().mockResolvedValue(response),
})

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render with our custom render
export { customRender as render }