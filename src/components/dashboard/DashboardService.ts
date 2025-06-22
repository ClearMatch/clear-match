"use client";

import { supabase } from "@/lib/supabase";
import { Candidate, FilterState } from "../Candidate/CandidateList/Types";
import { candidateService } from "../Candidate/CandidateList/candidateService";
import { DashboardStats, RecentActivity, RecommendedAction } from "./Types";

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
  const emptyFilters = createEmptyFilters();

  const candidatesFilter: FilterState = {
    ...emptyFilters,
    relationship_type: ["candidate"],
  };

  const clientsFilter: FilterState = {
    ...emptyFilters,
    relationship_type: ["client"],
  };

  const bothFilter: FilterState = {
    ...emptyFilters,
    relationship_type: ["both"],
  };

  const candidatesAndBothFilter: FilterState = {
    ...emptyFilters,
    relationship_type: ["candidate", "both"],
  };

  const activeSearchingFilter: FilterState = {
    ...emptyFilters,
    relationship_type: ["candidate", "both"],
    is_active_looking: true,
  };

  const [
    candidatesResult,
    clientsResult,
    bothResult,
    candidatesAndBothResult,
    activeSearchingResult,
  ] = await Promise.all([
    candidateService.fetchCandidatesCursor(
      userId,
      "",
      candidatesFilter,
      undefined,
      1000
    ),
    candidateService.fetchCandidatesCursor(
      userId,
      "",
      clientsFilter,
      undefined,
      1000
    ),
    candidateService.fetchCandidatesCursor(
      userId,
      "",
      bothFilter,
      undefined,
      1000
    ),
    candidateService.fetchCandidatesCursor(
      userId,
      "",
      candidatesAndBothFilter,
      undefined,
      1000
    ),
    candidateService.fetchCandidatesCursor(
      userId,
      "",
      activeSearchingFilter,
      undefined,
      1000
    ),
  ]);

  return {
    candidates: candidatesResult.candidates,
    clients: clientsResult.candidates,
    both: bothResult.candidates,
    candidatesAndBoth: candidatesAndBothResult.candidates,
    activeSearching: activeSearchingResult.candidates,
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
  candidates: Candidate[]
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
  clients: Candidate[],
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
  bothContacts: Candidate[],
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
  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (!profile?.organization_id) {
    throw new Error("Organization not found");
  }

  // Fetch all data in parallel
  const [candidatesData, recentActivities] = await Promise.all([
    fetchCandidatesData(userId),
    fetchRecentActivities(profile.organization_id),
  ]);

  const candidateActions = generateCandidateActions(candidatesData.candidates);
  const clientActions = generateClientActions(
    candidatesData.clients,
    candidateActions.length
  );
  const bothActions = generateBothActions(
    candidatesData.both,
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
