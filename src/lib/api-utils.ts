import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateCSRFForAPI } from './csrf';
import { sanitize, validateFileUpload } from './security';
import { z } from 'zod';
import { getSupabaseConfig, shouldEnableDebugLogging, getEnvironment } from './environment';

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
 * Enhanced validation helpers with security
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
  
  if (!value || value === "") return null;
  
  if (typeof value !== 'string') {
    throw new ApiError(`${fieldName} must be a string`, 400);
  }
  
  if (value.length > maxLength) {
    throw new ApiError(`${fieldName} must be less than ${maxLength} characters`, 400);
  }
  
  // Sanitize the string for security
  const sanitized = sanitize.string(value);
  return sanitized || null;
}

export function validateEmail(value: unknown): string {
  if (!value || typeof value !== 'string') {
    throw new ApiError('Email is required', 400);
  }
  
  const emailSchema = z.string().email('Invalid email format');
  const result = emailSchema.safeParse(value);
  
  if (!result.success) {
    throw new ApiError('Invalid email format', 400);
  }
  
  return sanitize.email(value);
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
  
  // Enhanced password validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    throw new ApiError(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      400
    );
  }
  
  return password;
}

/**
 * Validate file upload with security checks
 */
export function validateFile(file: File): File {
  const validation = validateFileUpload(file);
  
  if (!validation.valid) {
    throw new ApiError(validation.error || 'Invalid file', 400);
  }
  
  return file;
}

/**
 * API wrapper with built-in security checks
 */
export function secureApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async function(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      // Validate CSRF token for state-changing requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        validateCSRFForAPI(request);
      }
      
      return await handler(request, context);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid CSRF token') {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
      
      return handleApiError(error);
    }
  };
}

/**
 * Authentication and Supabase utilities
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  supabase: SupabaseClient;
}

/**
 * Creates a Supabase server client with proper cookie handling
 * Supports multiple environments (development, staging, production)
 * @param useServiceRole - Use service role key instead of anon key (for admin operations)
 */
export async function createSupabaseServerClient(useServiceRole: boolean = false): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();
  
  // Use service role key if requested and available
  const key = useServiceRole && config.serviceRoleKey ? config.serviceRoleKey : config.anonKey;
  
  if (useServiceRole && !config.serviceRoleKey) {
    throw new ApiError('Service role key is required for this operation', 500);
  }
  
  if (shouldEnableDebugLogging()) {
    console.log(`[Supabase] Using ${getEnvironment()} environment`);
  }
  
  return createServerClient(
    config.url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { [key: string]: any }) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: { [key: string]: any }) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * Authenticates the user and returns user info with organization ID
 */
export async function authenticateUser(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  
  // Get the current user (secure method)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new ApiError('Authentication required', 401);
  }
  
  // Get the user's organization_id
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
    
  if (profileError) {
    throw new ApiError('Failed to get user organization', 500);
  }
  
  return {
    user: {
      id: user.id,
      email: user.email!,
      organizationId: profileData.organization_id,
    },
    supabase,
  };
}