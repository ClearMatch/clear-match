import { supabase } from "@/lib/supabase";
import { ActivityWithRelations } from "@/components/MyTask/Services/Types";

/**
 * Fetches all tasks related to a specific candidate
 * @param candidateId - The unique identifier for the candidate
 * @returns Promise<ActivityWithRelations[]> - Array of tasks with relations
 */
export async function fetchTasksByCandidate(candidateId: string): Promise<ActivityWithRelations[]> {
  if (!candidateId || typeof candidateId !== 'string') {
    throw new Error('Invalid candidate ID provided');
  }
  const { data, error } = await supabase
    .from("activities")
    .select(
      `
      *,
      candidates:candidate_id (
        id,
        first_name,
        last_name,
        personal_email
      ),
      profiles:created_by (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq("candidate_id", candidateId)
    .order("priority", { ascending: false }) // Most critical first
    .order("due_date", { ascending: true }); // Then by due date

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data || [];
}