import { supabase } from "@/lib/supabase";
import { EventSchema } from "../Common/schema";
import { FilterState } from "../Filters/Types";
import { EventData } from "./Types";

/**
 * Inserts a new event with automatic organization_id lookup
 * @param url - SWR mutation URL (unused but required by SWR)
 * @param arg - Event data with user ID
 * @returns Promise with inserted event data
 */
export async function insertEvent(
  url: string,
  { arg }: { arg: EventSchema & { userId: string } }
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

  const eventData = {
    contact_id: arg.contact_id,
    organization_id: profileData.organization_id, // Always use the organization_id from the user's profile
    type: arg.type || "none",
    created_at: new Date().toISOString().replace("Z", "+00:00"),
    created_by: arg.userId,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select();

  if (error) {
    throw new Error(`Failed to insert event: ${error.message}`);
  }
  return data;
}

export const fetchEventsPaginated = async (
  page: number,
  pageSize: number,
  filters?: FilterState
): Promise<EventData[]> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("events")
    .select(
      ` *, 
candidates:contact_id(id, first_name, last_name), 
profiles:created_by (id, first_name, last_name), 
organizations:organization_id(id, name)`
    )
    .order("created_at", { ascending: false });

  if (filters) {
    if (filters.type && filters.type !== "") {
      query = query.eq("type", filters.type);
    }

    if (filters.createdBy && filters.createdBy !== "") {
      query = query.eq("created_by", filters.createdBy);
    }

    if (filters.contact && filters.contact !== "") {
      query = query.eq("contact_id", filters.contact);
    }

    if (filters.organization && filters.organization !== "") {
      query = query.eq("organization_id", filters.organization);
    }
  }

  const { data, error } = await query.range(from, to);

  if (error) throw error;
  return data ?? [];
};
