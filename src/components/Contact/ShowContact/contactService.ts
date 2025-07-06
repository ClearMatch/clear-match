import { supabase } from "@/lib/supabase";
import { Contact } from "../ContactList/Types";

interface ContactTag {
  tags: {
    id: string;
    name: string;
    color: string;
  };
}

/**
 * Fetches a contact by ID with associated tags
 * @param contactId - The unique identifier for the contact
 * @returns Promise<Contact> - The contact with transformed tags
 */
export async function fetchContactById(contactId: string): Promise<Contact> {
  if (!contactId || typeof contactId !== 'string') {
    throw new Error('Invalid contact ID provided');
  }
  const { data, error } = await supabase
    .from("contacts")
    .select(
      `
      *,
      tags:contact_tags (
        tags (
          id,
          name,
          color
        )
      )
    `
    )
    .eq("id", contactId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch contact: ${error.message}`);
  }

  if (!data) {
    throw new Error("Contact not found");
  }

  // Transform the tags data to match the expected format
  const transformedData = {
    ...data,
    tags: data.tags?.map((ct: ContactTag) => ct.tags).filter(Boolean) || [],
  };

  return transformedData;
}