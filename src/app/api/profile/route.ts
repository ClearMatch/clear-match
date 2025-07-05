import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateString, ApiError, createSupabaseServerClient } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
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
    const supabase = createSupabaseServerClient();
    
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