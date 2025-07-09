"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteQueryPerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import EventsList from "./Event/EventsList";
import Filters from "./Event/Filters";
import { FilterState, INITIAL_FILTERS } from "./Event/Filters/Types";
import Header from "./Event/Header";
import { EventData } from "./Event/Services/Types";
import { fetchEventsPaginated } from "./Event/Services/eventService";

const PAGE_SIZE = 25;
const CACHE_KEY = "events";

function Events() {
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(INITIAL_FILTERS);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterKey = useMemo(() => {
    return JSON.stringify(appliedFilters);
  }, [appliedFilters]);

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
    queryKey: [CACHE_KEY, filterKey],
    queryFn: ({ pageParam = 0 }) => 
      fetchEventsPaginated(pageParam, PAGE_SIZE, appliedFilters),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 5000,
  });

  // Performance monitoring for infinite query
  useInfiniteQueryPerformanceMonitor({
    queryKey: `${CACHE_KEY}_${filterKey}`,
    isLoading,
    isFetchingNextPage,
    isSuccess,
    isError,
    error,
    threshold: 2000, // 2 seconds threshold for events
  });

  const allEvents = useMemo(() => 
    data?.pages?.flat() || [], [data?.pages]
  );

  const fetchMoreData = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleFiltersApply = useCallback(
    (filters: FilterState) => {
      setAppliedFilters(filters);
      setHasMoreData(true);
    },
    []
  );

  const handleFiltersClear = useCallback(() => {
    setAppliedFilters(INITIAL_FILTERS);
    setHasMoreData(true);
  }, []);

  useEffect(() => {
    if (data?.pages && data.pages.length > 0) {
      const lastPage = data.pages[data.pages.length - 1];
      setHasMoreData(lastPage?.length === PAGE_SIZE || false);
    }
  }, [data?.pages]);

  return (
    <>
      <Header />
      <Filters
        onFiltersApply={handleFiltersApply}
        onFiltersClear={handleFiltersClear}
      />
      <EventsList
        allEvents={allEvents}
        isLoading={isLoading}
        isValidating={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        error={error}
        hasMoreData={hasMoreData}
        fetchMoreData={fetchMoreData}
      />
    </>
  );
}

export default Events;
