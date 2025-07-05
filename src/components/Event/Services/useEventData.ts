import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import useSWR from "swr";
import { fetchCandidates, fetchOrganizations } from "../Services/dataFetchers";

const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 60000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

export function useEventData() {
  const { toast } = useToast();

  const {
    data: allData,
    error,
    isLoading,
  } = useSWR(
    "event-form-data",
    async () => {
      try {
        const [candidates, organizations] = await Promise.all([
          fetchCandidates(),
          fetchOrganizations(),
        ]);
        return { candidates, organizations };
      } catch (error) {
        throw error;
      }
    },
    SWR_CONFIG
  );

  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => {
        toast({
          title: "Error",
          description: `Failed to load form data: ${error.message}`,
          variant: "destructive",
        });
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [error, toast]);

  return {
    candidates: allData?.candidates || [],
    organizations: allData?.organizations || [],
    isLoading,
    hasError: !!error,
    error,
  };
}
