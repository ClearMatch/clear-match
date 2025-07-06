import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateString, ApiError, createSupabaseServerClient } from '@/lib/api-utils';
import { validatePhoneNumber } from '@/lib/phone-utils';

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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      throw new ApiError('Authentication required', 401);
    }
    
    const user = session.user;
    const body = await request.json();
    const { phone } = body;

    // Validate phone number if provided
    if (phone !== undefined) {
      if (phone && !validatePhoneNumber(phone)) {
        throw new ApiError('Invalid phone number format', 400);
      }

      // Update phone number in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({ phone: phone || null })
        .eq("id", user.id)
        .select()
        .single();

      if (profileError) {
        throw new ApiError("Failed to update phone number", 500);
      }

      return NextResponse.json(profile);
    }

    throw new ApiError('No valid fields provided for update', 400);
  } catch (error) {
    return handleApiError(error);
  }
}