import { NextResponse } from 'next/server';

/**
 * Standardized API error responses
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standard error response handler
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code 
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

/**
 * Validation helpers
 */
export function validateString(
  value: unknown,
  fieldName: string,
  maxLength: number = 255,
  required: boolean = false
): string | null {
  if (!value && required) {
    throw new ApiError(`${fieldName} is required`, 400);
  }
  
  if (!value) return null;
  
  if (typeof value !== 'string') {
    throw new ApiError(`${fieldName} must be a string`, 400);
  }
  
  if (value.length > maxLength) {
    throw new ApiError(`${fieldName} must be less than ${maxLength} characters`, 400);
  }
  
  return value.trim();
}

export function validatePassword(password: unknown): string {
  if (!password || typeof password !== 'string') {
    throw new ApiError('Password is required and must be a string', 400);
  }
  
  if (password.length < 8) {
    throw new ApiError('Password must be at least 8 characters long', 400);
  }
  
  if (password.length > 128) {
    throw new ApiError('Password must be less than 128 characters', 400);
  }
  
  return password;
}