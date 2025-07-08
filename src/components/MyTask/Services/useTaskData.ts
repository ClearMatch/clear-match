import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  fetchContacts,
  fetchEvents,
  fetchOrganizations,
  fetchUsers,
} from "../Services/dataFetchers";

export function useTaskData() {
  const { toast } = useToast();

  const {
    data: allData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["task-form-data"],
    queryFn: async () => {
      const [contacts, organizations, users, events] = await Promise.all([
        fetchContacts(),
        fetchOrganizations(),
        fetchUsers(),
        fetchEvents(),
      ]);
      return { contacts, organizations, users, events };
    },
    staleTime: 60000, // 1 minute
    retry: 3,
  });

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
