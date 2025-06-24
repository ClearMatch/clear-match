import { useDebounce } from "@/hooks/useDebounce";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { candidateService } from "./candidateService";
import { Candidate, FilterState, SortConfig, SortField } from "./Types";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 25;

export function useCandidates() {
  const auth = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [sort, setSort] = useState<SortConfig>({ 
    field: 'updated_at', 
    direction: 'desc' 
  });
  const [filters, setFilters] = useState<FilterState>({
    relationship_type: [],
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

  const fetchCandidates = useCallback(() => {
    if (!auth.user?.id) return Promise.resolve({ candidates: [], hasMore: false, totalCount: 0 });
    
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
    auth.user?.id ? ["candidates", debouncedSearchQuery, filters, sort] : null,
    fetchCandidates
  );

  useEffect(() => {
    if (data) {
      setCandidates(data.candidates);
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
      // Get cursor from the last candidate based on sort field
      const lastCandidate = candidates[candidates.length - 1];
      const newCursor = lastCandidate ? lastCandidate[sort.field] as string : undefined;

      const response = await candidateService.fetchCandidatesCursor(
        auth.user.id,
        debouncedSearchQuery,
        filters,
        sort,
        newCursor,
        PAGE_SIZE
      );
      
      setCandidates((prev) => [...prev, ...response.candidates]);
      setHasMore(response.hasMore);
      setCursor(newCursor);
    } catch (err) {
      console.error("Error loading more candidates:", err);
    } finally {
      setIsFetchingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [hasMore, isFetchingMore, candidates, sort, debouncedSearchQuery, filters, auth.user?.id]);

  const refetchCandidates = useCallback(() => {
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
    candidates,

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
    refetchCandidates,
  };
}
