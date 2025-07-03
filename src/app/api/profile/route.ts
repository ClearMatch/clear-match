import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleApiError, validateString, ApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      throw new ApiError('Authentication required', 401);
    }
    
    const user = session.user;

    // Fetch user profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new ApiError("Profile not found", 404);
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      throw new ApiError('Authentication required', 401);
    }
    
    const user = session.user;

    const body = await request.json();
    const { firstName, lastName, occupation } = body;

    // Input validation and sanitization
    const sanitizedData = {
      first_name: validateString(firstName, 'First name', 100),
      last_name: validateString(lastName, 'Last name', 100),
      occupation: validateString(occupation, 'Occupation', 200),
    };

    // Update user profile in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update(sanitizedData)
      .eq("id", user.id)
      .select()
      .single();

    if (profileError) {
      throw new ApiError("Failed to update profile", 500);
    }

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}