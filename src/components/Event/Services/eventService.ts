import { supabase } from "@/lib/supabase";
import { formatISO } from "date-fns";
import { EventSchema } from "../Common/schema";

export const insertEvent = async (
  url: string,
  { arg }: { arg: EventSchema & { userId: string } }
) => {
  const eventData = {
    contact_id: arg.contact_id,
    organization_id: arg.organization_id || null,
    type: arg.type || "none",
    created_at: formatISO(new Date()),
    created_by: arg.userId,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(eventData)
    .select();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  return data;
};
