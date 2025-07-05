import {
  ApiError,
  validateString,
  validatePassword,
} from '../api-utils'

describe('ApiError', () => {
  it('should create error with message and default status code', () => {
    const error = new ApiError('Test error')
    
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(500)
    expect(error.name).toBe('ApiError')
  })

  it('should create error with custom status code and code', () => {
    const error = new ApiError('Not found', 404, 'NOT_FOUND')
    
    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })
})

describe('validateString', () => {
  it('should validate required string successfully', () => {
    const result = validateString('test value', 'Test Field', 100, true)
    expect(result).toBe('test value')
  })

  it('should trim whitespace', () => {
    const result = validateString('  test value  ', 'Test Field')
    expect(result).toBe('test value')
  })

  it('should return null for empty non-required field', () => {
    const result = validateString('', 'Test Field', 100, false)
    expect(result).toBe(null)
  })

  it('should return null for null non-required field', () => {
    const result = validateString(null, 'Test Field', 100, false)
    expect(result).toBe(null)
  })

  it('should throw error for required empty field', () => {
    expect(() => {
      validateString('', 'Test Field', 100, true)
    }).toThrow(new ApiError('Test Field is required', 400))
  })

  it('should throw error for non-string value', () => {
    expect(() => {
      validateString(123, 'Test Field')
    }).toThrow(new ApiError('Test Field must be a string', 400))
  })

  it('should throw error for string exceeding max length', () => {
    const longString = 'a'.repeat(101)
    expect(() => {
      validateString(longString, 'Test Field', 100)
    }).toThrow(new ApiError('Test Field must be less than 100 characters', 400))
  })
})

describe('validatePassword', () => {
  it('should validate strong password', () => {
    const result = validatePassword('MyStrongPassword123')
    expect(result).toBe('MyStrongPassword123')
  })

  it('should throw error for non-string password', () => {
    expect(() => {
      validatePassword(123)
    }).toThrow(new ApiError('Password is required and must be a string', 400))
  })

  it('should throw error for null password', () => {
    expect(() => {
      validatePassword(null)
    }).toThrow(new ApiError('Password is required and must be a string', 400))
  })

  it('should throw error for short password', () => {
    expect(() => {
      validatePassword('short')
    }).toThrow(new ApiError('Password must be at least 8 characters long', 400))
  })

  it('should throw error for too long password', () => {
    const longPassword = 'a'.repeat(129)
    expect(() => {
      validatePassword(longPassword)
    }).toThrow(new ApiError('Password must be less than 128 characters', 400))
  })
})