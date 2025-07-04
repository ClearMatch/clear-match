import { useDebounce } from "@/hooks/useDebounce";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
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

  const swrKey = useMemo(() => {
    const filterKey =
      Object.keys(memoizedFilters).length > 0
        ? JSON.stringify(memoizedFilters)
        : "no-filters";
    return `activities-${debouncedSearchQuery || "no-search"}-${filterKey}`;
  }, [debouncedSearchQuery, memoizedFilters]);

  const {
    data: tasks,
    error,
    isLoading,
    mutate,
  } = useSWR<ActivityWithRelations[]>(
    swrKey,
    async () => {
      try {
        return await fetchActivitiesWithRelations(
          debouncedSearchQuery || undefined,
          Object.keys(memoizedFilters).length > 0
            ? (memoizedFilters as TaskFilterState)
            : undefined
        );
      } catch (error) {
        console.error("Error in SWR fetcher:", error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  const { data: assigneeOptions } = useSWR(
    "assignee-options",
    fetchAssigneeOptions,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onError: (error) => {
        console.error("Error fetching assignee options:", error);
      },
    }
  );

  const { data: creatorOptions } = useSWR(
    "creator-options",
    fetchCreatorOptions,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      onError: (error) => {
        console.error("Error fetching creator options:", error);
      },
    }
  );

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
    mutate();
  }, [mutate]);

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
