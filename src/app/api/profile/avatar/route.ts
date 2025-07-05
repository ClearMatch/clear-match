import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleApiError, ApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new ApiError("No file provided", 400);
    }

    // Enhanced file validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    // Validate MIME type
    if (!allowedTypes.includes(file.type)) {
      throw new ApiError("Invalid file type. Please upload a valid image file.", 400);
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError("File size too large. Maximum size is 5MB.", 400);
    }

    // Minimum file size check (prevent empty files)
    if (file.size < 100) {
      throw new ApiError("File is too small or corrupted.", 400);
    }

    // Secure filename generation - don't trust client filename
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    // Validate file extension
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new ApiError("Invalid file extension.", 400);
    }

    // Generate secure filename with timestamp and random component
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${user.id}/${timestamp}-${randomId}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new ApiError("Failed to upload file", 500);
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile with the new avatar URL
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({
        profile_pic_url: publicUrl,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (profileError) {
      throw new ApiError("Failed to update profile", 500);
    }

    return NextResponse.json({ 
      message: "Avatar uploaded successfully", 
      avatarUrl: publicUrl 
    });
  } catch (error) {
    return handleApiError(error);
  }
}