import { supabase } from "@/lib/supabase";
import { Entity, Organization } from "../AddEvent/Types";

export async function fetchCandidates(): Promise<Entity[]> {
  try {
    const { data, error } = await supabase
      .from("candidates")
      .select("id, first_name, last_name")
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .order("first_name");

    if (error) {
      throw new Error(`Failed to fetch candidates: ${error.message}`);
    }

    const uniqueCandidates = data
      ? Array.from(new Map(data.map(candidate => [candidate.id, candidate])).values())
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
      ? Array.from(new Map(data.map(org => [org.id, org])).values())
      : [];

    return uniqueOrganizations;
  } catch (error) {
    throw error;
  }
}
