"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";
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

  const { data, error, size, setSize, isLoading, isValidating } =
    useSWRInfinite<EventData[]>(
      (pageIndex) => `${CACHE_KEY}-${pageIndex}-${filterKey}`,
      async (key) => {
        const pageIndex = parseInt(key.split("-")[1]);
        return fetchEventsPaginated(pageIndex, PAGE_SIZE, appliedFilters);
      },
      {
        revalidateOnFocus: false,
        revalidateOnMount: true,
        dedupingInterval: 5000,
        focusThrottleInterval: 10000,
      }
    );

  const allEvents = useMemo(() => data?.flat() || [], [data]);

  const fetchMoreData = useCallback(() => {
    if (!isValidating && hasMoreData) {
      setSize(size + 1);
    }
  }, [isValidating, hasMoreData, size, setSize]);

  const handleFiltersApply = useCallback(
    (filters: FilterState) => {
      setAppliedFilters(filters);
      setSize(1);
      setHasMoreData(true);
    },
    [setSize]
  );

  const handleFiltersClear = useCallback(() => {
    setAppliedFilters(INITIAL_FILTERS);
    setSize(1);
    setHasMoreData(true);
  }, [setSize]);

  useEffect(() => {
    if (data && data.length > 0) {
      const lastPage = data[data.length - 1];
      setHasMoreData(lastPage?.length === PAGE_SIZE || false);
    }
  }, [data]);

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
        isValidating={isValidating}
        error={error}
        hasMoreData={hasMoreData}
        fetchMoreData={fetchMoreData}
      />
    </>
  );
}

export default Events;
