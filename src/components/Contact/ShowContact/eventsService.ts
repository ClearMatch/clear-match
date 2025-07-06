import { supabase } from "@/lib/supabase";

export interface Event {
  id: string;
  contact_id: string;
  organization_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Fetches all events related to a specific contact
 * @param contactId - The unique identifier for the contact
 * @returns Promise<Event[]> - Array of events with creator information
 */
export async function fetchEventsByContact(contactId: string): Promise<Event[]> {
  if (!contactId || typeof contactId !== 'string') {
    throw new Error('Invalid contact ID provided');
  }
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles:created_by (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false }); // Newest first

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return data || [];
}