import { NextResponse } from 'next/server';
import { handleApiError, createSupabaseServerClient, ApiError } from '@/lib/api-utils';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new ApiError('Authentication required', 401);
    }

    // Call the Supabase Edge Function to sync HubSpot contacts
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-hubspot`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId: user.id }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error syncing HubSpot contacts:', error);
    return handleApiError(error);
  }
}