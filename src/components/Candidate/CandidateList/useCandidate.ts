import { useDebounce } from "@/hooks/useDebounce";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { candidateService } from "./candidateService";
import { Candidate, FilterState } from "./Types";

const PAGE_SIZE = 25;

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    relationship_type: [],
    functional_role: [],
    is_active_looking: null,
    location_category: [],
  });

  const isLoadingMoreRef = useRef(false);
  const debouncedSearchQuery = useDebounce(searchInputValue, 500);
  const isSearching = searchInputValue !== debouncedSearchQuery;

  const fetchCandidates = useCallback(() => {
    return candidateService.fetchCandidates(debouncedSearchQuery, filters, {
      page: 0,
      pageSize: PAGE_SIZE,
    });
  }, [debouncedSearchQuery, filters]);

  const { data, error, isLoading, mutate } = useSWR(
    ["candidate", debouncedSearchQuery, filters],
    fetchCandidates
  );

  useEffect(() => {
    if (data) {
      setCandidates(data.candidates);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setCurrentPage(0);
    }
  }, [data]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || isLoadingMoreRef.current) {
      return;
    }

    setIsFetchingMore(true);
    isLoadingMoreRef.current = true;

    try {
      const nextPage = currentPage + 1;
      const response = await candidateService.fetchCandidates(
        debouncedSearchQuery,
        filters,
        { page: nextPage, pageSize: PAGE_SIZE }
      );
      setCandidates((prev) => {
        return [...prev, ...response.candidates];
      });

      setCurrentPage(nextPage);
      setHasMore(response.hasMore);
      setTotalCount(response.totalCount);
    } catch (err) {
      console.error("Error loading more candidates:", err);
    } finally {
      setIsFetchingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [hasMore, isFetchingMore, currentPage, debouncedSearchQuery, filters]);

  const refetchCandidates = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    // Data
    candidates,
    totalCount,

    // Search
    searchInputValue,
    setSearchInputValue,
    debouncedSearchQuery,

    // Filters
    filters,
    setFilters,

    // Loading states
    loading: isLoading,
    isSearching,
    isFetchingMore,
    error,

    // Pagination
    hasMore,
    currentPage,
    onLoadMore: handleLoadMore,

    // Actions
    refetchCandidates,
  };
}
