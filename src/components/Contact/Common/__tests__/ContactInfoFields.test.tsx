import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import ContactInfoFields from '../ContactInfoFields'

// Mock the TextInputField component
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

describe('ContactInfoFields', () => {
  const mockForm = {} as any

  it('should render contact information fields', () => {
    render(<ContactInfoFields form={mockForm} />)

    expect(screen.getByLabelText(/work email/i)).toBeDefined()
    expect(screen.getByLabelText(/phone number/i)).toBeDefined()
    expect(screen.getByLabelText(/linkedin url/i)).toBeDefined()
  })

  it('should render social media fields', () => {
    render(<ContactInfoFields form={mockForm} />)

    expect(screen.getByLabelText(/github url/i)).toBeDefined()
    expect(screen.getByLabelText(/other social url/i)).toBeDefined()
    expect(screen.getByLabelText(/resume url/i)).toBeDefined()
  })

  it('should have correct placeholders for URLs', () => {
    render(<ContactInfoFields form={mockForm} />)

    expect(screen.getByPlaceholderText('https://www.linkedin.com/in/username/')).toBeDefined()
    expect(screen.getByPlaceholderText('https://www.github.com/in/username/')).toBeDefined()
    expect(screen.getByPlaceholderText('https://www.example.com/resume.pdf')).toBeDefined()
  })

  it('should mark required fields correctly', () => {
    render(<ContactInfoFields form={mockForm} />)

    const workEmailInput = screen.getByLabelText(/work email/i) as HTMLInputElement
    const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement
    const linkedinInput = screen.getByLabelText(/linkedin url/i) as HTMLInputElement

    expect(workEmailInput.required).toBe(true)
    expect(phoneInput.required).toBe(true)
    expect(linkedinInput.required).toBe(false) // LinkedIn is optional
  })
})