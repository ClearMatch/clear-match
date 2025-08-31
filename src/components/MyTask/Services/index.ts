import { supabase } from "@/lib/supabase";
import { TaskFilterState } from "../Filters";
import { ActivityWithRelations } from "./Types";

export const fetchTasksCount = async (
  searchTerm?: string,
  filters?: TaskFilterState
): Promise<number> => {
  // Get current user's organization_id first
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

  let query = supabase
    .from("activities")
    .select("*", { count: 'exact', head: true })
    .eq("organization_id", profileData.organization_id);

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
      query = query.in("contact_id", filters.assigned_to);
    }

    if (filters?.created_by?.length > 0) {
      query = query.in("created_by", filters.created_by);
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error fetching tasks count:", error);
    throw error;
  }

  return count || 0;
};

export const fetchActivitiesWithRelationsPaginated = async (
  page: number,
  pageSize: number,
  searchTerm?: string,
  filters?: TaskFilterState,
  includeAssignedProfiles = true
): Promise<ActivityWithRelations[]> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Get current user's organization_id first
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

  // Build select query conditionally
  const baseSelect = `
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
    events:event_id (
      id,
      company_name,
      job_title,
      position,
      posted_on,
      metro_area,
      company_website,
      job_listing_url,
      company_location,
      contact_name,
      contact_linkedin
    )`;

  const assignedProfileSelect = includeAssignedProfiles 
    ? `,
    assigned_to_profile:assigned_to (
      id,
      first_name,
      last_name
    )` 
    : '';

  let query = supabase
    .from("activities")
    .select(baseSelect + assignedProfileSelect)
    .eq("organization_id", profileData.organization_id) // Filter by organization
    .order("created_at", { ascending: false })
    .order("id", { ascending: false }) // Secondary sort by ID for consistent ordering
    .range(from, to);

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
      query = query.in("contact_id", filters.assigned_to);
    }

    if (filters?.created_by?.length > 0) {
      query = query.in("created_by", filters.created_by);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return (data as unknown as ActivityWithRelations[]) || [];
};

export const fetchActivitiesWithRelations = async (
  searchTerm?: string,
  filters?: TaskFilterState,
  includeAssignedProfiles = true
): Promise<ActivityWithRelations[]> => {
  // Get current user's organization_id first
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

  // Build select query conditionally
  const baseSelect = `
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
    events:event_id (
      id,
      company_name,
      job_title,
      position,
      posted_on,
      metro_area,
      company_website,
      job_listing_url,
      company_location,
      contact_name,
      contact_linkedin
    )`;

  const assignedProfileSelect = includeAssignedProfiles 
    ? `,
    assigned_to_profile:assigned_to (
      id,
      first_name,
      last_name
    )` 
    : '';

  let query = supabase
    .from("activities")
    .select(baseSelect + assignedProfileSelect)
    .eq("organization_id", profileData.organization_id) // Filter by organization
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
      query = query.in("contact_id", filters.assigned_to);
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

  return (data as unknown as ActivityWithRelations[]) || [];
};

export const updateActivityStatus = async (
  activityId: string,
  newStatus: string
): Promise<void> => {
  // Get current user's organization_id first
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

  // Only update if the task belongs to the user's organization
  const { error } = await supabase
    .from("activities")
    .update({ status: newStatus })
    .eq("id", activityId)
    .eq("organization_id", profileData.organization_id);

  if (error) throw error;
};

export const fetchAssigneeOptions = async (): Promise<
  { value: string; label: string }[]
> => {
  // Get current user's organization_id first
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

  // Only fetch contacts from the same organization
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name")
    .eq("organization_id", profileData.organization_id)
    .order("first_name");

  if (error) {
    console.error("Error fetching assignee options:", error);
    throw error;
  }

  if (!data) return [];

  return data.map((contact) => ({
    value: contact.id,
    label: `${contact.first_name} ${contact.last_name}`.trim(),
  }));
};

export const fetchCreatorOptions = async (): Promise<
  { value: string; label: string }[]
> => {
  // Get current user's organization_id first
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

  // Only fetch profiles from the same organization
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("organization_id", profileData.organization_id)
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
  // Get current user's organization_id first
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

  // Only fetch task if it belongs to the user's organization
  const { data, error } = await supabase
    .from("activities")
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
      events:event_id (
        id,
        company_name,
        job_title,
        position,
        posted_on,
        metro_area,
        company_website,
        job_listing_url,
        company_location,
        contact_name,
        contact_linkedin
      )
    `
    )
    .eq("id", id)
    .eq("organization_id", profileData.organization_id)
    .single();

  if (error) throw error;
  return data;
};
