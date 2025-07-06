import { useToast } from "@/hooks/use-toast";
import React from "react";
import useSWR from "swr";
import {
  fetchContacts,
  fetchEvents,
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
      const [contacts, organizations, users, events] = await Promise.all([
        fetchContacts(),
        fetchOrganizations(),
        fetchUsers(),
        fetchEvents(),
      ]);
      return { contacts, organizations, users, events };
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
    contacts: allData?.contacts || [],
    organizations: allData?.organizations || [],
    users: allData?.users || [],
    events: allData?.events || [],
    isLoading,
    hasError: !!error,
    error,
  };
}
