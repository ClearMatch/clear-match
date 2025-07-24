"use client";

import { useOpenable } from "@/hooks";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { ContactsList } from "./Contact/ContactList";
import { SearchAndFilterBar } from "./Contact/ContactList/SearchAndFilterBar";
import { useContacts } from "./Contact/ContactList/useContact";
import DeleteContact from "./Contact/DeleteContact";
import Header from "./Contact/Header";

export function Contacts() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [selectId, setSelectId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useOpenable();

  const engagementMin = searchParams.get('engagement_min');
  const engagementMax = searchParams.get('engagement_max');

  const {
    contacts,
    totalCount,
    loading,
    searchInputValue,
    setSearchInputValue,
    filters,
    setFilters,
    isSearching,
    isValidating,
    isFetchingMore,
    hasMore,
    onLoadMore,
    refetchContacts,
    sort,
    onSortChange,
  } = useContacts();

  // Apply URL parameters to filters on component mount
  useEffect(() => {
    if (engagementMin && engagementMax) {
      // Set engagement range filter for the UI
      const minScore = parseInt(engagementMin);
      const maxScore = parseInt(engagementMax);
      const rangeFilter = `${minScore}-${maxScore}`;

      setFilters(prevFilters => ({
        ...prevFilters,
        engagement_score: [], // Clear individual scores
        engagement_range: [rangeFilter], // Use range filter instead
      }));
      
      // Keep filters closed by default when coming from dashboard
      setShowFilters(false);
    }
  }, [engagementMin, engagementMax, setFilters]);

  // Edit is now handled directly in the table component
  const handleDeleteClick = (contactId: string) => {
    setSelectId(contactId);
    onDeleteOpen();
  };

  const handleClearFilters = () => {
    setFilters({
      contact_type: [],
      location_category: [],
      functional_role: [],
      is_active_looking: null,
      current_company_size: [],
      past_company_sizes: [],
      urgency_level: [],
      employment_status: [],
      engagement_score: [],
      engagement_range: [],
    });
  };

  if (!user || !user.id) {
    return (
      <div>
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Please log in to view contacts</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <SearchAndFilterBar
        searchInputValue={searchInputValue}
        onSearchChange={setSearchInputValue}
        isSearching={isSearching}
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearFilter={handleClearFilters}
      />
      <ContactsList
        contacts={contacts}
        totalCount={totalCount}
        loading={loading}
        isValidating={isValidating}
        isFetchingNextPage={isFetchingMore}
        onDeleteContact={handleDeleteClick}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        sort={sort}
        onSortChange={onSortChange}
      />
      <DeleteContact
        selectId={selectId}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onRefetchContacts={refetchContacts}
      />
    </div>
  );
}
