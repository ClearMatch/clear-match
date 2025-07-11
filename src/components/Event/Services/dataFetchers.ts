import { supabase } from "@/lib/supabase";
import { Entity, Organization } from "../AddEvent/Types";
import { EventData } from "./Types";

export async function fetchCandidates(): Promise<Entity[]> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .order("first_name");

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    const uniqueCandidates = data
      ? Array.from(
          new Map(data.map((candidate) => [candidate.id, candidate])).values()
        )
      : [];

    return uniqueCandidates;
  } catch (error) {
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
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    const uniqueOrganizations = data
      ? Array.from(new Map(data.map((org) => [org.id, org])).values())
      : [];

    return uniqueOrganizations;
  } catch (error) {
    throw error;
  }
}

export async function fetchEventById(id: string): Promise<EventData> {
  try {
    if (!id) {
      throw new Error("Event ID is required");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Authentication required");
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Failed to get user organization");
    }

    // Add organization-based filtering for security
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        contacts:contact_id (
          id,
          first_name,
          last_name
        ),
        profiles:created_by (
          id,
          first_name,
          last_name
        ),
        organizations:organization_id (
          id,
          name
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Event not found");
      }
      throw new Error(`Failed to fetch event: ${error.message}`);
    }

    if (!data) {
      throw new Error("Event not found");
    }

    return data as EventData;
  } catch (error) {
    console.error("fetchEventById error:", error);
    throw error;
  }
}
