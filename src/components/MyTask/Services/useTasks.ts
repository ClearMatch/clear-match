import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteQueryPerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchActivitiesWithRelationsPaginated,
  fetchAssigneeOptions,
  fetchCreatorOptions,
  fetchTasksCount,
} from ".";
import { TaskFilterState } from "../Filters";
import { PRIORITY_RANGES } from "../Filters/PriorityRangeFilter";
import {
  calculateTaskPriorityScore,
  sortTasksByPriorityScore,
} from "../TaskList/utils";

const PAGE_SIZE = 25;

export function useTasks() {
  const searchParams = useSearchParams();
  const [searchInputValue, setSearchInputValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [filters, setFilters] = useState<TaskFilterState>({
    type: [],
    status: [],
    priority: [],
    assigned_to: [],
    created_by: [],
    priorityRanges: [],
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const priorityParam = searchParams.get("priority");
    if (priorityParam) {
      const priorityValue = parseInt(priorityParam, 10);
      if ([1, 2, 3, 4].includes(priorityValue)) {
        setFilters((prev) => ({
          ...prev,
          priority: [priorityValue.toString()],
        }));
      }
    }
  }, [searchParams]);

  const debouncedSearchQuery = useDebounce(searchInputValue, 500);
  const isSearching = searchInputValue !== debouncedSearchQuery;

  const memoizedFilters = useMemo(() => {
    const activeFilters: Partial<TaskFilterState> = {};

    if (filters?.type?.length > 0) activeFilters.type = filters.type;
    if (filters?.status?.length > 0) activeFilters.status = filters.status;
    if (filters?.priority?.length > 0)
      activeFilters.priority = filters.priority;
    if (filters?.assigned_to?.length > 0)
      activeFilters.assigned_to = filters.assigned_to;
    if (filters?.created_by?.length > 0)
      activeFilters.created_by = filters.created_by;
    if (filters?.priorityRanges?.length > 0)
      activeFilters.priorityRanges = filters.priorityRanges;

    return activeFilters;
  }, [
    filters?.type,
    filters?.status,
    filters?.priority,
    filters?.assigned_to,
    filters?.created_by,
    filters?.priorityRanges,
  ]);

  const filterKey = useMemo(() => {
    // Create a stable, sorted key to ensure consistent caching
    const filterEntries = Object.entries(memoizedFilters).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return JSON.stringify({
      search: debouncedSearchQuery || "",
      filters: Object.fromEntries(filterEntries),
    });
  }, [debouncedSearchQuery, memoizedFilters]);

  const queryClient = useQueryClient();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isSuccess,
    isError,
  } = useInfiniteQuery({
    queryKey: ["tasks", filterKey],
    queryFn: ({ pageParam = 0 }) =>
      fetchActivitiesWithRelationsPaginated(
        pageParam,
        PAGE_SIZE,
        debouncedSearchQuery || undefined,
        Object.keys(memoizedFilters).length > 0
          ? (memoizedFilters as TaskFilterState)
          : undefined
      ),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 0, // No caching - always fetch fresh
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false,
  });

  // Performance monitoring for infinite query
  useInfiniteQueryPerformanceMonitor({
    queryKey: `tasks_${filterKey}`,
    isLoading,
    isFetchingNextPage,
    isSuccess,
    isError,
    error,
    threshold: 2000, // 2 seconds threshold for tasks
  });

  // Separate query for total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["tasks-count", filterKey],
    queryFn: () =>
      fetchTasksCount(
        debouncedSearchQuery || undefined,
        Object.keys(memoizedFilters).length > 0
          ? (memoizedFilters as TaskFilterState)
          : undefined
      ),
    staleTime: 0, // No caching - always fetch fresh
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false,
  });

  const allTasks = useMemo(() => {
    const tasks = data?.pages?.flat() || [];
    // Deduplicate tasks by ID to prevent duplicate key errors
    const seen = new Set();
    const deduplicatedTasks = tasks.filter((task) => {
      if (seen.has(task.id)) {
        console.warn(`Duplicate task ID detected: ${task.id}`);
        return false;
      }
      seen.add(task.id);
      return true;
    });

    // Apply priority range filtering if any ranges are selected
    let filteredTasks = deduplicatedTasks;
    if (filters.priorityRanges.length > 0) {
      filteredTasks = deduplicatedTasks.filter((task) => {
        const score = calculateTaskPriorityScore(task);
        return filters.priorityRanges.some((rangeId) => {
          const range = PRIORITY_RANGES.find((r) => r.id === rangeId);
          return range && score >= range.min && score <= range.max;
        });
      });
    }

    // Apply default priority sorting
    return sortTasksByPriorityScore(filteredTasks);
  }, [data?.pages, filters.priorityRanges]);

  const fetchMoreData = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Clear all cached task data when component mounts to ensure fresh start
  useEffect(() => {
    // Remove all cached task queries to force fresh data loading
    queryClient.removeQueries({ queryKey: ["tasks"], exact: false });
    queryClient.removeQueries({ queryKey: ["tasks-count"], exact: false });
  }, [queryClient]);

  useEffect(() => {
    if (data?.pages && data.pages.length > 0) {
      const lastPage = data.pages[data.pages.length - 1];
      setHasMoreData(lastPage?.length === PAGE_SIZE || false);
    }
  }, [data?.pages]);

  const { data: assigneeOptions } = useQuery({
    queryKey: ["assignee-options"],
    queryFn: fetchAssigneeOptions,
    staleTime: 60000, // 1 minute
  });

  const { data: creatorOptions } = useQuery({
    queryKey: ["creator-options"],
    queryFn: fetchCreatorOptions,
    staleTime: 60000, // 1 minute
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      // Reset pagination state when search changes
      if (value !== searchInputValue) {
        setHasMoreData(true);
      }
    },
    [searchInputValue]
  );

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: TaskFilterState) => {
      setFilters((prevFilters) => {
        const safeNewFilters = {
          type: newFilters?.type || [],
          status: newFilters?.status || [],
          priority: newFilters?.priority || [],
          assigned_to: newFilters?.assigned_to || [],
          created_by: newFilters?.created_by || [],
          priorityRanges: newFilters?.priorityRanges || [],
        };

        const hasChanged = Object.keys(safeNewFilters).some((key) => {
          const filterKey = key as keyof TaskFilterState;
          return (
            JSON.stringify(prevFilters[filterKey]) !==
            JSON.stringify(safeNewFilters[filterKey])
          );
        });

        if (hasChanged) {
          setHasMoreData(true);
          // Clear the query cache to prevent stale data
          queryClient.removeQueries({ queryKey: ["tasks"] });
          queryClient.removeQueries({ queryKey: ["tasks-count"] });
        }

        return hasChanged ? safeNewFilters : prevFilters;
      });
    },
    [queryClient]
  );

  const clearFilters = useCallback(() => {
    setFilters((prevFilters) => {
      const hasActiveFilters = Object.values(prevFilters || {}).some(
        (filter) => Array.isArray(filter) && filter.length > 0
      );

      if (!hasActiveFilters) return prevFilters;

      setHasMoreData(true);
      // Clear the query cache to prevent stale data
      queryClient.removeQueries({ queryKey: ["tasks"] });
      queryClient.removeQueries({ queryKey: ["tasks-count"] });

      return {
        type: [],
        status: [],
        priority: [],
        assigned_to: [],
        created_by: [],
        priorityRanges: [],
      };
    });
  }, [queryClient]);

  const refetchTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["tasks-count"] });
  }, [queryClient]);

  return {
    tasks: allTasks,
    assigneeOptions: assigneeOptions || [],
    creatorOptions: creatorOptions || [],

    searchInputValue,
    setSearchInputValue,
    debouncedSearchQuery,
    onSearchChange: handleSearchChange,

    filters,
    setFilters: handleFiltersChange,
    showFilters,
    onToggleFilters: handleToggleFilters,
    clearFilters,

    loading: isLoading,
    isSearching,
    isValidating: isFetching,
    isFetchingNextPage,
    error,
    hasMoreData,
    fetchMoreData,
    totalCount,

    refetchTasks,
  };
}
