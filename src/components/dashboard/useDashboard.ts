"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "./DashboardService";
import { DashboardStats, RecentActivity, RecommendedAction } from "./Types";

interface DashboardData {
  stats: DashboardStats;
  recommendedActions: RecommendedAction[];
  recentActivities: RecentActivity[];
}

interface UseDashboardReturn {
  data: DashboardData | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<DashboardData | undefined>;
  mutate: (data?: DashboardData) => Promise<DashboardData | undefined>;
}

const fetchDashboardData = async (userId: string) => {
  return await dashboardService.fetchDashboardData(userId);
};

export function useDashboard(userId: string | undefined): UseDashboardReturn {
  const queryClient = useQueryClient();
  
  const { data, error, isLoading, refetch: queryRefetch } = useQuery({
    queryKey: ["dashboard", userId],
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    retry: 3,
  });

  const refetch = async () => {
    if (!userId) return undefined;

    try {
      const result = await queryRefetch();
      return result.data;
    } catch (error) {
      console.error("Error refetching dashboard data:", error);
      throw error;
    }
  };

  const mutate = async (data?: DashboardData) => {
    if (!userId) return undefined;
    
    if (data) {
      // Update cache with new data
      queryClient.setQueryData(["dashboard", userId], data);
      return data;
    } else {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      const result = await queryClient.fetchQuery({
        queryKey: ["dashboard", userId],
        queryFn: () => fetchDashboardData(userId),
      });
      return result;
    }
  };

  return {
    data,
    loading: isLoading,
    error,
    refetch,
    mutate,
  };
}
