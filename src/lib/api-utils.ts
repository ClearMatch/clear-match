import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  
  if (!value || value === "") return null;
  
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
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session || !session.user) {
    throw new ApiError('Authentication required', 401);
  }
  
  // Get the user's organization_id
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", session.user.id)
    .single();
    
  if (profileError) {
    throw new ApiError('Failed to get user organization', 500);
  }
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      organizationId: profileData.organization_id,
    },
    supabase,
  };
}