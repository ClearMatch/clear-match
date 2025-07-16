import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { dashboardKeys } from "@/lib/query-keys";
import { unifiedDashboardService, UnifiedDashboardData } from "../Services";

interface UseUnifiedDashboardOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

export function useUnifiedDashboard(
  userId: string | undefined,
  options: UseUnifiedDashboardOptions = {}
): UseQueryResult<UnifiedDashboardData, Error> {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    refetchInterval,
  } = options;

  return useQuery({
    queryKey: dashboardKeys.stats(userId || ""),
    queryFn: () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return unifiedDashboardService.fetchUnifiedDashboardData(userId);
    },
    enabled: enabled && !!userId,
    staleTime,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useTimelineData(userId: string | undefined) {
  const { data, ...rest } = useUnifiedDashboard(userId);
  return {
    timeline: data?.timeline,
    ...rest,
  };
}

export function useTaskPriorityData(userId: string | undefined) {
  const { data, ...rest } = useUnifiedDashboard(userId);
  return {
    taskPriority: data?.taskPriority,
    ...rest,
  };
}

export function useProfileData(userId: string | undefined) {
  const { data, ...rest } = useUnifiedDashboard(userId);
  return {
    profileData: data?.profileData,
    ...rest,
  };
}

export function useDashboardStats(userId: string | undefined) {
  const { data, ...rest } = useUnifiedDashboard(userId);
  return {
    stats: data?.stats,
    ...rest,
  };
}

export function useRecentActivities(userId: string | undefined) {
  const { data, ...rest } = useUnifiedDashboard(userId);
  return {
    recentActivities: data?.recentActivities,
    ...rest,
  };
}

export function useRecommendedActions(userId: string | undefined) {
  const { data, ...rest } = useUnifiedDashboard(userId);
  return {
    recommendedActions: data?.recommendedActions,
    ...rest,
  };
}
