import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validatePassword, ApiError, authenticateUser } from '@/lib/api-utils';

export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateUser();

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Input validation
    validatePassword(currentPassword);
    validatePassword(newPassword);

    // Validate current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new ApiError("Current password is incorrect", 400);
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new ApiError("Failed to update password", 500);
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}