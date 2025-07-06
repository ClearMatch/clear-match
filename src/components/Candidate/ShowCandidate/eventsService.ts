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

export async function fetchEventsByCandidate(candidateId: string): Promise<Event[]> {
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
    .eq("contact_id", candidateId)
    .order("created_at", { ascending: false }); // Newest first

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return data || [];
}