import { useDebounce } from "@/hooks/useDebounce";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { candidateService } from "./candidateService";
import { Contact, FilterState, SortConfig, SortField } from "./Types";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 25;

export function useContacts() {
  const auth = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
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

  const isLoadingMoreRef = useRef(false);
  const debouncedSearchQuery = useDebounce(searchInputValue, 500);
  const isSearching = searchInputValue !== debouncedSearchQuery;

  const fetchContacts = useCallback(() => {
    if (!auth.user?.id) return Promise.resolve({ contacts: [], hasMore: false, totalCount: 0 });
    
    return candidateService.fetchCandidatesCursor(
      auth.user.id,
      debouncedSearchQuery,
      filters,
      sort,
      undefined, // no cursor for initial load
      PAGE_SIZE
    );
  }, [auth.user?.id, debouncedSearchQuery, filters, sort]);

  const { data, error, isLoading, mutate } = useSWR(
    auth.user?.id ? ["contacts", debouncedSearchQuery, filters, sort] : null,
    fetchContacts
  );

  useEffect(() => {
    if (data) {
      setContacts(data.contacts);
      setHasMore(data.hasMore);
      setCursor(undefined); // Reset cursor on new search/filter/sort
    }
  }, [data]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || isLoadingMoreRef.current || !auth.user?.id) {
      return;
    }

    setIsFetchingMore(true);
    isLoadingMoreRef.current = true;

    try {
      // Get cursor from the last contact based on sort field
      const lastContact = contacts[contacts.length - 1];
      const newCursor = lastContact ? lastContact[sort.field] as string : undefined;

      const response = await candidateService.fetchCandidatesCursor(
        auth.user.id,
        debouncedSearchQuery,
        filters,
        sort,
        newCursor,
        PAGE_SIZE
      );
      
      setContacts((prev) => [...prev, ...response.contacts]);
      setHasMore(response.hasMore);
      setCursor(newCursor);
    } catch (err) {
      console.error("Error loading more contacts:", err);
    } finally {
      setIsFetchingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [hasMore, isFetchingMore, contacts, sort, debouncedSearchQuery, filters, auth.user?.id]);

  const refetchContacts = useCallback(() => {
    mutate();
  }, [mutate]);

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
    isFetchingMore,
    error,

    // Pagination
    hasMore,
    onLoadMore: handleLoadMore,

    // Actions
    refetchContacts,
  };
}
