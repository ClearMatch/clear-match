import React from "react";
import useSWR from "swr";
import { useToast } from "@/hooks/use-toast";
import {
  fetchCandidates,
  fetchOrganizations,
  fetchUsers,
  fetchEvents,
  fetchJobPostings,
} from "../Services/dataFetchers";

const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 60000,
};

export function useTaskData() {
  const { toast } = useToast();

  const candidates = useSWR("candidates", fetchCandidates, SWR_CONFIG);
  const organizations = useSWR("organizations", fetchOrganizations, SWR_CONFIG);
  const users = useSWR("users", fetchUsers, SWR_CONFIG);
  const events = useSWR("events", fetchEvents, SWR_CONFIG);
  const jobPostings = useSWR("jobPostings", fetchJobPostings, SWR_CONFIG);

  // Handle errors
  React.useEffect(() => {
    const errors = [
      { error: candidates.error, name: "candidates" },
      { error: organizations.error, name: "organizations" },
      { error: users.error, name: "users" },
      { error: events.error, name: "events" },
      { error: jobPostings.error, name: "job postings" },
    ];

    errors.forEach(({ error, name }) => {
      if (error) {
        toast({
          title: "Error",
          description: `Failed to fetch ${name}: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  }, [
    candidates.error,
    organizations.error,
    users.error,
    events.error,
    jobPostings.error,
    toast,
  ]);

  const isLoading = [
    candidates.isLoading,
    organizations.isLoading,
    users.isLoading,
    events.isLoading,
    jobPostings.isLoading,
  ].some(Boolean);

  return {
    candidates: candidates.data || [],
    organizations: organizations.data || [],
    users: users.data || [],
    events: events.data || [],
    jobPostings: jobPostings.data || [],
    isLoading,
    hasError: [
      candidates.error,
      organizations.error,
      users.error,
      events.error,
      jobPostings.error,
    ].some(Boolean),
  };
}
