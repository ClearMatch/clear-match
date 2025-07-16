"use client";

import { emptyFragment } from "@/components/ui/emptyFragment";
import InfiniteScroll from "@/components/ui/infiniteScroll";
import { Loader2 } from "lucide-react";
import ContactsTable from "./ContactsTableNew";
import { Contact, SortConfig, SortField } from "./Types";

interface ContactsListProps {
  contacts: Contact[];
  loading: boolean;
  onDeleteContact: (contactId: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
}

export function ContactsList({
  contacts,
  loading,
  hasMore,
  onLoadMore,
  onDeleteContact,
  sort,
  onSortChange,
}: ContactsListProps) {
  const scrollableContainerId = "contacts-scroll-container";
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
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Showing {contacts.length} contacts
      </div>
      <div id={scrollableContainerId} className="max-h-[70vh] overflow-y-auto">
        <InfiniteScroll
          dataLength={contacts.length}
          next={onLoadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin h-5 w-5 text-indigo-500" />
            </div>
          }
          endMessage={emptyFragment()}
          scrollThreshold={0.6}
          scrollableTarget={scrollableContainerId}
        >
          <ContactsTable
            contacts={contacts}
            onDelete={onDeleteContact}
            sort={sort}
            onSortChange={onSortChange}
          />
        </InfiniteScroll>
      </div>
    </div>
  );
}
