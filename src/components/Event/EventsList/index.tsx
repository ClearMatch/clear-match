"use client";

import DataTable from "@/components/ui/DataTable";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import InfiniteScroll from "react-infinite-scroll-component";
import { EventData } from "../Services/Types";
import Columns from "./Columns";

interface EventsListProps {
  allEvents: EventData[];
  isLoading: boolean;
  isValidating: boolean;
  error: any;
  hasMoreData: boolean;
  fetchMoreData: () => void;
}

function EventsList({
  allEvents,
  isLoading,
  isValidating,
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
        <InfiniteScroll
          dataLength={allEvents.length}
          next={fetchMoreData}
          hasMore={hasMoreData}
          scrollableTarget="scrollableDiv"
          loader={
            isValidating && (
              <div className="flex justify-center p-4">
                <LoadingSpinner />
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
            />
          </div>
        </InfiniteScroll>
      )}
    </>
  );
}

export default EventsList;
