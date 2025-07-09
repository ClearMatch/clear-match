"use client";

import DataTable from "@/components/ui/DataTable";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import InfiniteScroll from "react-infinite-scroll-component";
import { EventData } from "../Services/Types";
import Actions from "./Actions";
import Columns from "./Columns";

interface EventsListProps {
  allEvents: EventData[];
  isLoading: boolean;
  isValidating: boolean;
  isFetchingNextPage: boolean;
  error: any;
  hasMoreData: boolean;
  fetchMoreData: () => void;
}

function EventsList({
  allEvents,
  isLoading,
  isValidating,
  isFetchingNextPage,
  error,
  hasMoreData,
  fetchMoreData,
}: EventsListProps) {
  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading events: {error.message}
      </div>
    );
  }

  return (
    <>
      {isLoading && allEvents.length === 0 ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="relative">
          {/* Background refresh indicator */}
          {isValidating && !isFetchingNextPage && allEvents.length > 0 && (
            <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-2 shadow-sm">
              <LoadingSpinner size="sm" />
            </div>
          )}
          <InfiniteScroll
            dataLength={allEvents.length}
            next={fetchMoreData}
            hasMore={hasMoreData}
            scrollableTarget="scrollableDiv"
            loader={
              isFetchingNextPage && (
                <div className="flex justify-center p-4">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading more events...
                  </span>
                </div>
              )
            }
          >
            <div
              id="scrollableDiv"
              className="max-h-[calc(100vh-150px)] w-full overflow-auto"
            >
              <DataTable
                columns={Columns()}
                data={allEvents}
                rowKey="id"
                hideHeaderCheckBox
                hideRowCheckBox
                renderAction={(row) => <Actions id={row.id} />}
              />
            </div>
          </InfiniteScroll>
        </div>
      )}
    </>
  );
}

export default EventsList;
