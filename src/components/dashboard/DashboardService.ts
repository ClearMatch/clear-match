"use client";

import { supabase } from "@/lib/supabase";
import { Candidate, FilterState } from "../Candidate/CandidateList/Types";
import { candidateService } from "../Candidate/CandidateList/candidateService";
import { DashboardStats, RecentActivity, RecommendedAction } from "./Types";

// Minimal candidate interface for dashboard stats
interface DashboardCandidate {
  id: string;
  first_name: string;
  last_name: string;
  relationship_type: string;
  is_active_looking: boolean;
  updated_at: string;
}

const createEmptyFilters = (): FilterState => {
  return {
    relationship_type: [],
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

  // Single optimized query to get all candidate data at once
  const { data: allCandidates, error: candidatesError } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, relationship_type, is_active_looking, updated_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(200); // Much smaller limit for dashboard stats

  if (candidatesError) {
    throw new Error(`Failed to fetch candidates: ${candidatesError.message}`);
  }

  const candidates: DashboardCandidate[] = allCandidates || [];

  // Filter the results locally instead of making multiple queries
  const candidatesOnly = candidates.filter(c => c.relationship_type === "candidate");
  const clientsOnly = candidates.filter(c => c.relationship_type === "client");
  const bothOnly = candidates.filter(c => c.relationship_type === "both");
  const candidatesAndBoth = candidates.filter(c => 
    c.relationship_type === "candidate" || c.relationship_type === "both"
  );
  const activeSearching = candidates.filter(c => 
    (c.relationship_type === "candidate" || c.relationship_type === "both") && 
    c.is_active_looking === true
  );

  return {
    candidates: candidatesOnly,
    clients: clientsOnly,
    both: bothOnly,
    candidatesAndBoth: candidatesAndBoth,
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
      candidateName: "Activity",
      candidateId: activity.candidate_id || "",
      type: activity.type,
      description: activity.description,
      createdAt: activity.created_at,
    })) || []
  );
};

const generateCandidateActions = (
  candidates: DashboardCandidate[]
): RecommendedAction[] => {
  return candidates
    .filter((candidate) => candidate.id)
    .map((candidate, index) => ({
      id: candidate.id || `candidate-action-${index}`,
      candidateId: candidate.id || "",
      candidateName:
        `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() ||
        "Unknown Candidate",
      actionType: "follow_up",
      reason: candidate.is_active_looking
        ? "Active job seeker - schedule interview"
        : "No recent activity - follow up needed",
      priority: candidate.is_active_looking
        ? "high"
        : ("medium" as "high" | "medium" | "low"),
      dueDate: new Date(Date.now() + 86400000 * (index + 1)).toISOString(),
      type: "candidate" as const,
    }));
};

const generateClientActions = (
  clients: DashboardCandidate[],
  candidateActionsCount: number
): RecommendedAction[] => {
  return clients
    .filter((client) => client.id)
    .map((client, index) => ({
      id: client.id || `client-action-${index}`,
      candidateId: client.id || "",
      candidateName:
        `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
        "Unknown Client",
      actionType: "follow_up",
      reason: "Check for new job openings and requirements",
      priority: "medium" as "high" | "medium" | "low",
      dueDate: new Date(
        Date.now() + 86400000 * (index + candidateActionsCount + 1)
      ).toISOString(),
      type: "client" as const,
    }));
};

const generateBothActions = (
  bothContacts: DashboardCandidate[],
  existingActionsCount: number
): RecommendedAction[] => {
  return bothContacts
    .filter((contact) => contact.id)
    .map((contact, index) => ({
      id: contact.id || `both-action-${index}`,
      candidateId: contact.id || "",
      candidateName:
        `${contact.first_name || ""} ${contact.last_name || ""}`.trim() ||
        "Unknown Contact",
      actionType: "follow_up",
      reason: contact.is_active_looking
        ? "Active job seeker + potential client - dual opportunity"
        : "Both candidate and client - check for opportunities on both sides",
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
  const [candidatesData, recentActivities] = await Promise.all([
    fetchCandidatesData(userId),
    fetchRecentActivities(profile.organization_id),
  ]);

  // Generate actions from a smaller, more relevant subset
  const candidateActions = generateCandidateActions(candidatesData.candidates.slice(0, 10));
  const clientActions = generateClientActions(
    candidatesData.clients.slice(0, 5),
    candidateActions.length
  );
  const bothActions = generateBothActions(
    candidatesData.both.slice(0, 5),
    candidateActions.length + clientActions.length
  );

  const allRecommendedActions = sortRecommendedActions([
    ...candidateActions,
    ...clientActions,
    ...bothActions,
  ]);

  // Stats using the combined candidatesAndBoth count
  const stats: DashboardStats = {
    totalCandidates: candidatesData.candidatesAndBoth.length,
    totalClients: candidatesData.clients.length,
    activeSearching: candidatesData.activeSearching.length,
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
  generateCandidateActions,
  generateClientActions,
  generateBothActions,
  sortRecommendedActions,
};
