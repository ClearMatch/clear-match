import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchContactsPaginated } from "./contactService";
import { Contact, FilterState, SortConfig, SortField } from "./Types";

const PAGE_SIZE = 25;

export function useContacts() {
  const auth = useAuth();
  const [searchInputValue, setSearchInputValue] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    contact_type: [],
    functional_role: [],
    is_active_looking: null,
    location_category: [],
    current_company_size: [],
    past_company_sizes: [],
    urgency_level: [],
    employment_status: [],
    engagement_score: [],
    engagement_range: [],
  });

  const debouncedSearchQuery = useDebounce(searchInputValue, 500);
  const isSearching = searchInputValue !== debouncedSearchQuery;

  const filterKey = useMemo(() => {
    return JSON.stringify({
      search: debouncedSearchQuery || '',
      filters: filters,
      userId: auth.user?.id
    });
  }, [debouncedSearchQuery, filters, auth.user?.id]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["contacts", filterKey],
    queryFn: ({ pageParam = 0 }) =>
      fetchContactsPaginated(
        pageParam,
        PAGE_SIZE,
        debouncedSearchQuery || undefined,
        filters
      ),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    enabled: !!auth.user?.id,
    staleTime: 5000,
  });

  // Flatten all pages of contacts into a single array
  const contacts = useMemo(() => {
    return data?.pages?.flat() || [];
  }, [data?.pages]);

  const fetchMoreData = useCallback(async () => {
    if (!isFetchingNextPage && hasNextPage) {
      try {
        await fetchNextPage();
      } catch (error) {
        console.error('Failed to load more contacts:', error);
      }
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleSortChange = useCallback(() => {
    // Sort functionality can be added later if needed
  }, []);

  return {
    // Data
    contacts,
    totalCount: 0, // Not needed for infinite scroll

    // Search
    searchInputValue,
    setSearchInputValue,

    // Filters
    filters,
    setFilters,

    // Sorting (placeholder)
    sort: { field: 'updated_at', direction: 'desc' } as SortConfig,
    onSortChange: handleSortChange,

    // Loading states
    loading: isLoading,
    isSearching,
    isValidating: isFetching,
    isFetchingMore: isFetchingNextPage,
    error,

    // Pagination
    hasMore: hasNextPage,
    onLoadMore: fetchMoreData,

    // Actions
    refetchContacts: () => {
      // Will be implemented when needed
    },
  };
}