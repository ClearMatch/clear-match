import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { contactService } from "./contactService";
import { Contact, FilterState, SortConfig, SortField } from "./Types";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 25;

export function useContacts() {
  const auth = useAuth();
  const [searchInputValue, setSearchInputValue] = useState("");
  const [sort, setSort] = useState<SortConfig>({ 
    field: 'updated_at', 
    direction: 'desc' 
  });
  const [filters, setFilters] = useState<FilterState>({
    contact_type: [],
    functional_role: [],
    is_active_looking: null,
    location_category: [],
    current_company_size: [],
    past_company_sizes: [],
    urgency_level: [],
    employment_status: [],
  });

  const debouncedSearchQuery = useDebounce(searchInputValue, 500);
  const isSearching = searchInputValue !== debouncedSearchQuery;
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["contacts", { search: debouncedSearchQuery, filters, sort, userId: auth.user?.id }],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      if (!auth.user?.id) return Promise.resolve({ contacts: [], hasMore: false, totalCount: 0 });
      
      return contactService.fetchContactsCursor(
        auth.user.id,
        debouncedSearchQuery,
        filters,
        sort,
        pageParam,
        PAGE_SIZE
      );
    },
    enabled: !!auth.user?.id,
    initialPageParam: undefined as string | undefined, // Initial cursor is undefined
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      
      // Get cursor from the last contact based on sort field
      const lastContact = lastPage.contacts[lastPage.contacts.length - 1];
      return lastContact ? lastContact[sort.field] as string : undefined;
    },
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    staleTime: 60000, // 1 minute
  });

  // Flatten all pages of contacts into a single array
  const contacts = useMemo(() => {
    return data?.pages.flatMap(page => page.contacts) || [];
  }, [data]);

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    try {
      await fetchNextPage();
    } catch (err) {
      console.error("Error loading more contacts:", err);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refetchContacts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
  }, [queryClient]);

  const handleSortChange = useCallback((field: SortField) => {
    setSort(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  return {
    // Data
    contacts,

    // Search
    searchInputValue,
    setSearchInputValue,
    debouncedSearchQuery,

    // Filters
    filters,
    setFilters,

    // Sorting
    sort,
    onSortChange: handleSortChange,

    // Loading states
    loading: isLoading,
    isSearching,
    isFetchingMore: isFetchingNextPage,
    error,

    // Pagination
    hasMore: hasNextPage,
    onLoadMore: handleLoadMore,

    // Actions
    refetchContacts,
  };
}
