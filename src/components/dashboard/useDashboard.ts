"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
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
  error: any;
  refetch: () => Promise<DashboardData | undefined>;
  mutate: (data?: DashboardData) => Promise<DashboardData | undefined>;
}

const fetchDashboardData = async (key: string, userId: string) => {
  return await dashboardService.fetchDashboardData(userId);
};

const mutateDashboardData = async (
  url: string,
  { arg }: { arg: { userId: string } }
) => {
  return await dashboardService.fetchDashboardData(arg.userId);
};

export function useDashboard(userId: string | undefined): UseDashboardReturn {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? [`dashboard-${userId}`, userId] : null,
    ([key, userId]) => fetchDashboardData(key, userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute deduping
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  const { trigger: triggerRefetch, isMutating } = useSWRMutation(
    userId ? `dashboard-${userId}` : null,
    mutateDashboardData
  );

  const refetch = async () => {
    if (!userId) return undefined;

    try {
      const result = await triggerRefetch({ userId });
      mutate(result, false);
      return result;
    } catch (error) {
      console.error("Error refetching dashboard data:", error);
      throw error;
    }
  };

  return {
    data,
    loading: isLoading || isMutating,
    error,
    refetch,
    mutate,
  };
}
