import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import BasicInfoFields from '../BasicInfoFields'

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
  const mockForm = {} as any

  it('should render all basic info fields', () => {
    render(<BasicInfoFields form={mockForm} />)

    expect(screen.getByLabelText(/first name/i)).toBeDefined()
    expect(screen.getByLabelText(/last name/i)).toBeDefined()
    expect(screen.getByLabelText(/personal email/i)).toBeDefined()
  })

  it('should display correct placeholders', () => {
    render(<BasicInfoFields form={mockForm} />)

    expect(screen.getByPlaceholderText('Enter first name')).toBeDefined()
    expect(screen.getByPlaceholderText('Enter last name')).toBeDefined()
    expect(screen.getByPlaceholderText('clear@gmail.com')).toBeDefined()
  })

  it('should mark required fields appropriately', () => {
    render(<BasicInfoFields form={mockForm} />)

    // Check that required fields have the required attribute
    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement
    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/personal email/i) as HTMLInputElement

    expect(firstNameInput.required).toBe(true)
    expect(lastNameInput.required).toBe(true)
    expect(emailInput.required).toBe(true)
  })

  it('should render fields in a grid layout', () => {
    const { container } = render(<BasicInfoFields form={mockForm} />)

    // Check that fields are wrapped in a grid container
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeDefined()
    expect(gridContainer?.classList.contains('grid-cols-1')).toBe(true)
  })
})