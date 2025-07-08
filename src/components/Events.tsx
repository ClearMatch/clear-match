"use client";

import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import EventsList from "./Event/EventsList";
import Filters from "./Event/Filters";
import { FilterState, INITIAL_FILTERS } from "./Event/Filters/Types";
import Header from "./Event/Header";
import { EventData } from "./Event/Services/Types";
import { fetchEventsPaginated } from "./Event/Services/eventService";
import { eventKeys } from "@/lib/query-keys";

const PAGE_SIZE = 25;

function Events() {
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(INITIAL_FILTERS);

  const { 
    data, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isFetching,
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: eventKeys.list({ 
      search: '', 
      filters: appliedFilters as unknown as Record<string, unknown>, 
      sort: {} 
    }),
    queryFn: ({ pageParam = 0 }) => 
      fetchEventsPaginated(pageParam, PAGE_SIZE, appliedFilters),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer than PAGE_SIZE items, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length; // Return the next page index
    },
    staleTime: 60 * 1000, // 60 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const allEvents = useMemo(() => data?.pages.flat() || [], [data]);

  const fetchMoreData = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleFiltersApply = useCallback(
    (filters: FilterState) => {
      setAppliedFilters(filters);
    },
    []
  );

  const handleFiltersClear = useCallback(() => {
    setAppliedFilters(INITIAL_FILTERS);
  }, []);

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
        error={error}
        hasMoreData={hasNextPage}
        fetchMoreData={fetchMoreData}
      />
    </>
  );
}

export default Events;
