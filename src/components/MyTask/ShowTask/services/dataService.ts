import { supabase } from "@/lib/supabase";
import { Contact, Event, JobPosting, RecentActivity } from "../interfaces";

export const fetchEvent = async (eventId: string): Promise<Event> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) throw error;
  return data;
};

export const fetchJobPosting = async (
  jobPostingId: string
): Promise<JobPosting> => {
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", jobPostingId)
    .single();

  if (error) throw error;
  return data;
};

export const fetchContact = async (contactId: string): Promise<Contact> => {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  if (error) throw error;
  return data;
};

export const fetchRecentActivities = async (
  contactId: string,
  currentTaskId?: string
): Promise<RecentActivity[]> => {
  let query = supabase
    .from("activities")
    .select("id, type, description, created_at, status")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (currentTaskId) {
    query = query.neq("id", currentTaskId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};
