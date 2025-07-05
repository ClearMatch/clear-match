import { supabase } from "@/lib/supabase";
import { EventSchema } from "../Common/schema";

export async function insertEvent(
  url: string,
  { arg }: { arg: EventSchema & { userId: string } }
) {
  const eventData = {
    contact_id: arg.contact_id,
    organization_id: arg.organization_id || null,
    type: arg.type || "none",
    created_at: new Date().toISOString().replace("Z", "+00:00"),
    created_by: arg.userId,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
