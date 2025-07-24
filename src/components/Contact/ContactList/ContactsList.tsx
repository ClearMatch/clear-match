"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Loader2 } from "lucide-react";
import InfiniteScroll from "react-infinite-scroll-component";
import ContactsTable from "./ContactsTableNew";
import { Contact, SortConfig, SortField } from "./Types";

interface ContactsListProps {
  contacts: Contact[];
  totalCount: number;
  loading: boolean;
  isValidating?: boolean;
  isFetchingNextPage?: boolean;
  onDeleteContact: (contactId: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
}

export function ContactsList({
  contacts,
  totalCount,
  loading,
  isValidating = false,
  isFetchingNextPage = false,
  hasMore,
  onLoadMore,
  onDeleteContact,
  sort,
  onSortChange,
}: ContactsListProps) {
  if (loading && contacts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!loading && contacts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">No contacts found</div>
    );
  }

  return (
    <>
      {/* Contact Counter Display */}
      {!loading && contacts.length > 0 && (
        <div className="mb-4 px-4 py-2 bg-gray-50 border rounded-lg">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {contacts.length} contacts
            </span>
          </p>
        </div>
      )}

      {loading && contacts.length === 0 ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="relative">
          {/* Background refresh indicator */}
          {isValidating && !isFetchingNextPage && contacts.length > 0 && (
            <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-2 shadow-sm">
              <LoadingSpinner size="sm" />
            </div>
          )}
          <InfiniteScroll
            dataLength={contacts.length}
            next={onLoadMore}
            hasMore={hasMore}
            scrollableTarget="scrollableDiv"
            loader={
              isFetchingNextPage && (
                <div className="flex justify-center p-4">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading more contacts...
                  </span>
                </div>
              )
            }
          >
            <div
              id="scrollableDiv"
              className="max-h-[calc(100vh-286px)] w-full overflow-auto"
            >
              <ContactsTable
                contacts={contacts}
                onDelete={onDeleteContact}
                sort={sort}
                onSortChange={onSortChange}
              />
            </div>
          </InfiniteScroll>
        </div>
      )}
    </>
  );
}
