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
      `id, contact_id, organization_id, type, created_at, updated_at, created_by,
      position, posted_on, metro_area, company_name, contact_name,
      company_website, job_listing_url, company_location, contact_linkedin, data,
      contact:contact_id(id, first_name, last_name), 
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

    // Clay webhook specific filters
    if (filters.position && filters.position !== "") {
      query = query.ilike("position", `%${filters.position}%`);
    }

    if (filters.companyName && filters.companyName !== "") {
      query = query.ilike("company_name", `%${filters.companyName}%`);
    }

    if (filters.metroArea && filters.metroArea !== "") {
      query = query.ilike("metro_area", `%${filters.metroArea}%`);
    }

    // Date range filters
    if (filters.dateRange && filters.dateRange !== "") {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case "recent":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "this_quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        default:
          startDate = new Date(0); // All time
      }

      if (filters.dateRange !== "all_time") {
        query = query.gte("created_at", startDate.toISOString());
      }
    }
  }

  const { data, error } = await query.range(from, to);

  if (error) throw error;
  return data ?? [];
};
