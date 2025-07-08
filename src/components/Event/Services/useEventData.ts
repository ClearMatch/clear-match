import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchCandidates, fetchOrganizations } from "../Services/dataFetchers";

export function useEventData() {
  const { toast } = useToast();

  const {
    data: allData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["event-form-data"],
    queryFn: async () => {
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
    staleTime: 60000, // 1 minute
    retry: 3,
  });

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
    
    return undefined;
  }, [error, toast]);

  return {
    candidates: allData?.candidates || [],
    organizations: allData?.organizations || [],
    isLoading,
    hasError: !!error,
    error,
  };
}
