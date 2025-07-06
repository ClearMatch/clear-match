"use client";

import { supabase } from "@/lib/supabase";
import { Contact, FilterState } from "../Contact/ContactList/Types";
import { contactService } from "../Contact/ContactList/contactService";
import { DashboardStats, RecentActivity, RecommendedAction } from "./Types";

// Minimal contact interface for dashboard stats
interface DashboardContact {
  id: string;
  first_name: string;
  last_name: string;
  contact_type: string;
  is_active_looking: boolean;
  updated_at: string;
}

const createEmptyFilters = (): FilterState => {
  return {
    contact_type: [],
    location_category: [],
    functional_role: [],
    is_active_looking: null,
    current_company_size: [],
    past_company_sizes: [],
    urgency_level: [],
    employment_status: [],
  };
};

const fetchCandidatesData = async (userId: string) => {
  // Get user's organization for direct database query
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId);

  if (profileError || !profiles || profiles.length === 0) {
    throw new Error("Could not fetch user profile");
  }

  const organizationId = profiles[0].organization_id;

  // Single optimized query to get all contact data at once
  const { data: allContacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, contact_type, is_active_looking, updated_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(200); // Much smaller limit for dashboard stats

  if (contactsError) {
    throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
  }

  const contacts: DashboardContact[] = allContacts || [];

  // Filter the results locally instead of making multiple queries
  const contactsOnly = contacts.filter(c => c.contact_type === "contact");
  const clientsOnly = contacts.filter(c => c.contact_type === "client");
  const bothOnly = contacts.filter(c => c.contact_type === "both");
  const contactsAndBoth = contacts.filter(c => 
    c.contact_type === "contact" || c.contact_type === "both"
  );
  const activeSearching = contacts.filter(c => 
    (c.contact_type === "contact" || c.contact_type === "both") && 
    c.is_active_looking === true
  );

  return {
    contacts: contactsOnly,
    clients: clientsOnly,
    both: bothOnly,
    contactsAndBoth: contactsAndBoth,
    activeSearching: activeSearching,
  };
};

const fetchRecentActivities = async (
  organizationId: string
): Promise<RecentActivity[]> => {
  const { data: activitiesResult } = await supabase
    .from("activities")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    activitiesResult?.map((activity) => ({
      id: activity.id,
      contactName: "Activity",
      contactId: activity.contact_id || "",
      type: activity.type,
      description: activity.description,
      createdAt: activity.created_at,
    })) || []
  );
};

const generateContactActions = (
  contacts: DashboardContact[]
): RecommendedAction[] => {
  return contacts
    .filter((contact) => contact.id)
    .map((contact, index) => ({
      id: contact.id || `contact-action-${index}`,
      contactId: contact.id || "",
      contactName:
        `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
        "Unknown Candidate",
      actionType: "follow_up",
      reason: contact.is_active_looking
        ? "Active job seeker - schedule interview"
        : "No recent activity - follow up needed",
      priority: contact.is_active_looking
        ? "high"
        : ("medium" as "high" | "medium" | "low"),
      dueDate: new Date(Date.now() + 86400000 * (index + 1)).toISOString(),
      type: "contact" as const,
    }));
};

const generateClientActions = (
  clients: DashboardContact[],
  contactActionsCount: number
): RecommendedAction[] => {
  return clients
    .filter((client) => client.id)
    .map((client, index) => ({
      id: client.id || `client-action-${index}`,
      contactId: client.id || "",
      contactName:
        `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
        "Unknown Client",
      actionType: "follow_up",
      reason: "Check for new job openings and requirements",
      priority: "medium" as "high" | "medium" | "low",
      dueDate: new Date(
        Date.now() + 86400000 * (index + contactActionsCount + 1)
      ).toISOString(),
      type: "client" as const,
    }));
};

const generateBothActions = (
  bothContacts: DashboardContact[],
  existingActionsCount: number
): RecommendedAction[] => {
  return bothContacts
    .filter((contact) => contact.id)
    .map((contact, index) => ({
      id: contact.id || `both-action-${index}`,
      contactId: contact.id || "",
      contactName:
        `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
        "Unknown Contact",
      actionType: "follow_up",
      reason: contact.is_active_looking
        ? "Active job seeker + potential client - dual opportunity"
        : "Both contact and client - check for opportunities on both sides",
      priority: contact.is_active_looking
        ? "high"
        : ("medium" as "high" | "medium" | "low"),
      dueDate: new Date(
        Date.now() + 86400000 * (index + existingActionsCount + 1)
      ).toISOString(),
      type: "both" as const,
    }));
};

const sortRecommendedActions = (
  actions: RecommendedAction[]
): RecommendedAction[] => {
  return actions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return (
      new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
    );
  });
};

export const fetchDashboardData = async (userId: string) => {
  // Get user's organization ID (this is now done inside fetchCandidatesData)
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Profile query failed: ${profileError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    throw new Error(`No profile found for user ${userId}. Please complete your profile setup.`);
  }

  const profile = profiles[0];

  if (!profile?.organization_id) {
    throw new Error("User profile exists but no organization is associated");
  }

  // Fetch all data in parallel - now much more efficient
  const [contactsData, recentActivities] = await Promise.all([
    fetchCandidatesData(userId),
    fetchRecentActivities(profile.organization_id),
  ]);

  // Generate actions from a smaller, more relevant subset
  const contactActions = generateContactActions(contactsData.contacts.slice(0, 10));
  const clientActions = generateClientActions(
    contactsData.clients.slice(0, 5),
    contactActions.length
  );
  const bothActions = generateBothActions(
    contactsData.both.slice(0, 5),
    contactActions.length + clientActions.length
  );

  const allRecommendedActions = sortRecommendedActions([
    ...contactActions,
    ...clientActions,
    ...bothActions,
  ]);

  // Stats using the combined contactsAndBoth count
  const stats: DashboardStats = {
    totalContacts: contactsData.contactsAndBoth.length,
    totalClients: contactsData.clients.length,
    activeSearching: contactsData.activeSearching.length,
    recentActivities: recentActivities.length,
    pendingActions: allRecommendedActions.length,
  };

  return {
    stats,
    recommendedActions: allRecommendedActions,
    recentActivities,
  };
};

export const dashboardService = {
  fetchDashboardData,
  createEmptyFilters,
  fetchCandidatesData,
  fetchRecentActivities,
  generateContactActions,
  generateClientActions,
  generateBothActions,
  sortRecommendedActions,
};
