import { supabase } from "@/lib/supabase";
import { TaskFilterState } from "../Filters";
import { ActivityWithRelations } from "./Types";

export const fetchActivitiesWithRelations = async (
  searchTerm?: string,
  filters?: TaskFilterState
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

  if (filters) {
    if (filters?.type?.length > 0) {
      query = query.in("type", filters.type);
    }

    if (filters?.status?.length > 0) {
      query = query.in("status", filters.status);
    }

    if (filters?.priority?.length > 0) {
      query = query.in("priority", filters.priority);
    }

    if (filters?.assigned_to?.length > 0) {
      query = query.in("candidate_id", filters.assigned_to);
    }

    if (filters?.created_by?.length > 0) {
      query = query.in("created_by", filters.created_by);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching task:", error);
    throw error;
  }

  return data || [];
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

export const fetchAssigneeOptions = async (): Promise<
  { value: string; label: string }[]
> => {
  const { data, error } = await supabase
    .from("candidates")
    .select("id, first_name, last_name")
    .order("first_name");

  if (error) {
    console.error("Error fetching assignee options:", error);
    throw error;
  }

  if (!data) return [];

  return data.map((candidate) => ({
    value: candidate.id,
    label: `${candidate.first_name} ${candidate.last_name}`.trim(),
  }));
};

export const fetchCreatorOptions = async (): Promise<
  { value: string; label: string }[]
> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .order("first_name");

  if (error) {
    console.error("Error fetching creator options:", error);
    throw error;
  }

  if (!data) return [];

  return data.map((profile) => ({
    value: profile.id,
    label: `${profile.first_name} ${profile.last_name}`.trim(),
  }));
};

export const fetchTaskById = async (
  id: string
): Promise<ActivityWithRelations> => {
  const { data, error } = await supabase
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
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};
