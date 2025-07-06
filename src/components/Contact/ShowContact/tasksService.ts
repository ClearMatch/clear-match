import { supabase } from "@/lib/supabase";
import { ActivityWithRelations } from "@/components/MyTask/Services/Types";

/**
 * Fetches all tasks related to a specific contact
 * @param contactId - The unique identifier for the contact
 * @returns Promise<ActivityWithRelations[]> - Array of tasks with relations
 */
export async function fetchTasksByContact(contactId: string): Promise<ActivityWithRelations[]> {
  if (!contactId || typeof contactId !== 'string') {
    throw new Error('Invalid contact ID provided');
  }
  const { data, error } = await supabase
    .from("activities")
    .select(
      `
      *,
      contacts:contact_id (
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
    .eq("contact_id", contactId)
    .order("priority", { ascending: false }) // Most critical first
    .order("due_date", { ascending: true }); // Then by due date

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data || [];
}