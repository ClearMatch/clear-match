import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError, authenticateUser } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await authenticateUser();
    
    const { id: activityId } = params;

    // Verify the activity exists and belongs to the user's organization
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, organization_id")
      .eq("id", activityId)
      .eq("organization_id", user.organizationId)
      .single();
      
    if (activityError || !activity) {
      throw new ApiError('Activity not found or you do not have permission to view its messages', 404);
    }

    // Fetch messages for this activity
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id,
          first_name,
          last_name
        ),
        contact:contacts!messages_contact_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq("activity_id", activityId)
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw new ApiError('Failed to fetch messages', 500);
    }

    return NextResponse.json(messages || []);

  } catch (error) {
    return handleApiError(error);
  }
}