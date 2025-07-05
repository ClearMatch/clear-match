import React from 'react'
import { render, screen } from '@testing-library/react'
import BasicInfoFields from '../BasicInfoFields'

// Mock form object for testing
const mockForm = {
  control: {
    _getWatch: jest.fn(),
    _formValues: {},
    _defaultValues: {},
  } as any,
}

// Mock the TextInputField component since we're just testing the structure
jest.mock('../TextInputField', () => {
  return function MockTextInputField({ name, label, placeholder, required }: any) {
    return (
      <div>
        <label htmlFor={name}>
          {label}
          {required && <span>*</span>}
        </label>
        <input
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
        />
      </div>
    )
  }
})

describe('BasicInfoFields', () => {
  it('should render all basic info fields', () => {
    render(<BasicInfoFields form={mockForm} />)

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/personal email/i)).toBeInTheDocument()
  })

  it('should display correct placeholders', () => {
    render(<BasicInfoFields form={mockForm} />)

    expect(screen.getByPlaceholderText('Enter first name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter last name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('clear@gmail.com')).toBeInTheDocument()
  })

  it('should mark required fields appropriately', () => {
    render(<BasicInfoFields form={mockForm} />)

    // Check that required fields have the required attribute
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/personal email/i)

    expect(firstNameInput).toBeRequired()
    expect(lastNameInput).toBeRequired()
    expect(emailInput).toBeRequired()
  })

  it('should render fields in a grid layout', () => {
    const { container } = render(<BasicInfoFields form={mockForm} />)

    // Check that fields are wrapped in a grid container
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'gap-6')
  })
})