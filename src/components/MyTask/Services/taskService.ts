import { supabase } from "@/lib/supabase";
import { TaskSchema } from "../Common/schema";

/**
 * Inserts a new task with automatic organization_id lookup and priority calculation
 * @param url - SWR mutation URL (unused but required by SWR)
 * @param arg - Task data with user ID
 * @returns Promise with inserted task data
 */
export async function insertTask(
  url: string,
  { arg }: { arg: TaskSchema & { userId: string } }
) {
  if (!arg.userId) {
    throw new Error("User ID is required");
  }

  // First, get the user's organization_id from their profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", arg.userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to get user organization: ${profileError.message}`);
  }

  // Determine the priority based on creation type
  let finalPriority = arg.priority;

  if (arg.creation_type === "automatic") {
    // For automatic tasks, calculate priority on frontend
    if (arg.event_id && arg.contact_id) {
      try {
        // Get engagement score from contact
        const { data: contactData, error: contactError } = await supabase
          .from("contacts")
          .select("engagement_score")
          .eq("id", arg.contact_id)
          .single();

        // Get event score from event metadata
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("metadata")
          .eq("id", arg.event_id)
          .single();

        if (!contactError && !eventError && contactData && eventData) {
          const engagementScore = contactData.engagement_score || 3;
          const eventScore = eventData.metadata?.importance_score || 3;
          const calculatedScore = engagementScore * eventScore;

          // Map calculated score to priority (1-6)
          if (calculatedScore >= 85) finalPriority = "6"; // Critical
          else if (calculatedScore >= 68) finalPriority = "5"; // High
          else if (calculatedScore >= 51) finalPriority = "4"; // Medium
          else if (calculatedScore >= 34) finalPriority = "3"; // Low-Medium
          else if (calculatedScore >= 17) finalPriority = "2"; // Low
          else finalPriority = "1"; // Very Low
        } else {
          console.warn("Failed to get scores for calculation, using default");
          finalPriority = "3"; // Default to medium if data retrieval fails
        }
      } catch (error) {
        console.warn("Error calculating priority:", error);
        finalPriority = "3"; // Default to medium if calculation fails
      }
    } else {
      // If automatic but missing event or contact, default to medium
      finalPriority = "3";
    }
  } else if (arg.creation_type === "manual") {
    // For manual tasks, use provided priority or default to medium
    finalPriority = arg.priority || "2";
  }

  const taskData = {
    contact_id: arg.contact_id,
    organization_id: profileData.organization_id, // Always use the organization_id from the user's profile
    type: arg.type,
    subject: arg.subject || null,
    content: arg.content || null,
    description: arg.description || null,
    status: arg.status || "todo",
    due_date: arg.due_date || null,
    event_id: arg.event_id || null,
    assigned_to: arg.assigned_to || null,
    priority: parseInt(finalPriority), // Convert to number for database
    job_posting_id: arg.job_posting_id || null,
    creation_type: arg.creation_type || "manual", // Add creation_type to the data
    metadata: null,
    created_at: new Date().toISOString().replace("Z", "+00:00"),
    created_by: arg.userId,
  };

  const { data, error } = await supabase
    .from("activities")
    .insert(taskData)
    .select();

  if (error) {
    throw new Error(`Failed to insert task: ${error.message}`);
  }
  return data;
}
