import { useDebounce } from "@/hooks/useDebounce";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  fetchActivitiesWithRelations,
  fetchAssigneeOptions,
  fetchCreatorOptions,
} from ".";
import { TaskFilterState } from "../Filters";
import { ActivityWithRelations } from "./Types";

export function useTasks() {
  const [searchInputValue, setSearchInputValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilterState>({
    type: [],
    status: [],
    priority: [],
    assigned_to: [],
    created_by: [],
  });

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

    return activeFilters;
  }, [
    filters?.type,
    filters?.status,
    filters?.priority,
    filters?.assigned_to,
    filters?.created_by,
  ]);

  const queryClient = useQueryClient();

  const {
    data: tasks,
    error,
    isLoading,
  } = useQuery<ActivityWithRelations[]>({
    queryKey: [
      "tasks",
      { search: debouncedSearchQuery, filters: memoizedFilters },
    ],
    queryFn: async () => {
      try {
        return await fetchActivitiesWithRelations(
          debouncedSearchQuery || undefined,
          Object.keys(memoizedFilters).length > 0
            ? (memoizedFilters as TaskFilterState)
            : undefined
        );
      } catch (error) {
        // Only log in development, not in tests
        if (process.env.NODE_ENV === "development") {
          console.error("Error in query fetcher:", error);
        }
        throw error;
      }
    },
    staleTime: 2000,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

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

  const handleSearchChange = useCallback((value: string) => {
    setSearchInputValue(value);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleFiltersChange = useCallback((newFilters: TaskFilterState) => {
    setFilters((prevFilters) => {
      const safeNewFilters = {
        type: newFilters?.type || [],
        status: newFilters?.status || [],
        priority: newFilters?.priority || [],
        assigned_to: newFilters?.assigned_to || [],
        created_by: newFilters?.created_by || [],
      };

      const hasChanged = Object.keys(safeNewFilters).some((key) => {
        const filterKey = key as keyof TaskFilterState;
        return (
          JSON.stringify(prevFilters[filterKey]) !==
          JSON.stringify(safeNewFilters[filterKey])
        );
      });

      return hasChanged ? safeNewFilters : prevFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters((prevFilters) => {
      const hasActiveFilters = Object.values(prevFilters || {}).some(
        (filter) => Array.isArray(filter) && filter.length > 0
      );

      if (!hasActiveFilters) return prevFilters;

      return {
        type: [],
        status: [],
        priority: [],
        assigned_to: [],
        created_by: [],
      };
    });
  }, []);

  const refetchTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  return {
    tasks: tasks || [],
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
    error,

    refetchTasks,
  };
}
