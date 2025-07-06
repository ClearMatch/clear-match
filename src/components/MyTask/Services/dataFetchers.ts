import { supabase } from "@/lib/supabase";
import { Entity, Event, Organization } from "../AddTask/Types";

export async function fetchContacts(): Promise<Entity[]> {
  try {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .not("first_name", "is", null)
      .not("last_name", "is", null)
      .order("first_name");

    if (error) {
      console.error("Contacts error:", error);
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    const uniqueContacts =
      data?.filter(
        (contact, index, self) =>
          index === self.findIndex((c) => c.id === contact.id)
      ) || [];

    return uniqueContacts;
  } catch (error) {
    console.error("Fetch contacts error:", error);
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
