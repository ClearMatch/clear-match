import { supabase } from "@/lib/supabase";
import { Entity, Event, JobPosting, Organization } from "../AddTask/Types";

export async function fetchCandidates(): Promise<Entity[]> {
  try {
    const { data, error } = await supabase
      .from("candidates")
      .select("id, first_name, last_name")
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .order("first_name");

    if (error) {
      console.error("Candidates error:", error);
      throw new Error(`Failed to fetch candidates: ${error.message}`);
    }

    const uniqueCandidates =
      data?.filter(
        (candidate, index, self) =>
          index === self.findIndex((c) => c.id === candidate.id)
      ) || [];

    return uniqueCandidates;
  } catch (error) {
    console.error("Fetch candidates error:", error);
    throw error;
  }
}

export async function fetchOrganizations(): Promise<Organization[]> {
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .not("name", "is", null)
      .order("name");

    if (error) {
      console.error("Organizations error:", error);
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    const uniqueOrganizations =
      data?.filter(
        (org, index, self) => index === self.findIndex((o) => o.id === org.id)
      ) || [];

    return uniqueOrganizations;
  } catch (error) {
    console.error("Fetch organizations error:", error);
    throw error;
  }
}

export async function fetchUsers(): Promise<Entity[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .order("first_name");

    if (error) {
      console.error("Users error:", error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Fetch users error:", error);
    throw error;
  }
}

export async function fetchEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, contact_id, organization_id, type, created_at, updated_at, created_by"
      )
      .not("type", "is", null)
      .order("type");

    if (error) {
      console.error("Events error:", error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    // Map the data to include 'name' field from 'type' for compatibility
    const mappedData =
      data?.map((event) => ({
        ...event,
        name: event.type, // Map type to name for display purposes
      })) || [];

    return mappedData;
  } catch (error) {
    console.error("Fetch events error:", error);
    throw error;
  }
}

export async function fetchJobPostings(): Promise<JobPosting[]> {
  try {
    const { data, error } = await supabase
      .from("job_postings")
      .select("id, title")
      .not("title", "is", null)
      .order("title");

    if (error) {
      console.error("Job postings error:", error);
      throw new Error(`Failed to fetch job postings: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Fetch job postings error:", error);
    throw error;
  }
}
