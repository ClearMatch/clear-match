import { useToast } from "@/hooks/use-toast";
import React from "react";
import useSWR from "swr";
import {
  fetchCandidates,
  fetchEvents,
  fetchJobPostings,
  fetchOrganizations,
  fetchUsers,
} from "../Services/dataFetchers";

const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 60000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

export function useTaskData() {
  const { toast } = useToast();

  const {
    data: allData,
    error,
    isLoading,
  } = useSWR(
    "task-form-data",
    async () => {
      const [candidates, organizations, users, events, jobPostings] =
        await Promise.all([
          fetchCandidates(),
          fetchOrganizations(),
          fetchUsers(),
          fetchEvents(),
          fetchJobPostings(),
        ]);
      return { candidates, organizations, users, events, jobPostings };
    },
    SWR_CONFIG
  );

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: `Failed to load form data: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return {
    candidates: allData?.candidates || [],
    organizations: allData?.organizations || [],
    users: allData?.users || [],
    events: allData?.events || [],
    jobPostings: allData?.jobPostings || [],
    isLoading,
    hasError: !!error,
    error,
  };
}
