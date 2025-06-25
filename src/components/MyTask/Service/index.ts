import { supabase } from "@/lib/supabase";
import { ActivityWithRelations } from "./Types";

export const fetchActivitiesWithRelations = async (
  searchTerm?: string
): Promise<ActivityWithRelations[]> => {
  let query = supabase
    .from("activities")
    .select(
      `
      *,
      candidates:candidate_id (
        id,
        first_name,
        last_name
      ),
      profiles:created_by (
        id,
        first_name,
        last_name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (searchTerm && searchTerm.trim()) {
    query = query.or(`description.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const updateActivityStatus = async (
  activityId: string,
  newStatus: string
): Promise<void> => {
  const { error } = await supabase
    .from("activities")
    .update({ status: newStatus })
    .eq("id", activityId);

  if (error) throw error;
};
