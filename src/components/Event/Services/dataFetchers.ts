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
