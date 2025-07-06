import { supabase } from "@/lib/supabase";
import { EventSchema } from "../Common/schema";

export async function insertEvent(
  url: string,
  { arg }: { arg: EventSchema & { userId: string } }
) {
  console.log("Insert event called with userId:", arg.userId);
  // First, get the user's organization_id from their profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", arg.userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    throw new Error("Failed to get user organization");
  }

  const eventData = {
    contact_id: arg.contact_id,
    organization_id: profileData.organization_id, // Always use the organization_id from the user's profile
    type: arg.type || "none",
    created_at: new Date().toISOString().replace("Z", "+00:00"),
    created_by: arg.userId,
  };

  console.log("Event data to insert:", eventData);

  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  console.log("Successfully inserted event:", data);
  return data;
}
