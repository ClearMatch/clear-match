"use client";

import { useOpenable } from "@/hooks";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { ContactsList } from "./Candidate/CandidateList";
import { SearchAndFilterBar } from "./Candidate/CandidateList/SearchAndFilterBar";
import { useContacts } from "./Candidate/CandidateList/useCandidate";
import DeleteCandidate from "./Candidate/DeleteCandidate";
import Header from "./Candidate/Header";

export function Contacts() {
  const { user } = useAuth();
  const [selectId, setSelectId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useOpenable();

  const {
    contacts,
    loading,
    searchInputValue,
    setSearchInputValue,
    filters,
    setFilters,
    isSearching,
    hasMore,
    onLoadMore,
    refetchContacts,
    sort,
    onSortChange,
  } = useContacts();

  // Edit is now handled directly in the table component
  const handleDeleteClick = (contactId: string) => {
    setSelectId(contactId);
    onDeleteOpen();
  };

  const handleToggleFilters = () => {
    setFilters({
      contact_type: [],
      location_category: [],
      functional_role: [],
      is_active_looking: null,
      current_company_size: [],
      past_company_sizes: [],
      urgency_level: [],
      employment_status: [],
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
        clearFilter={handleToggleFilters}
      />
      <ContactsList
        contacts={contacts}
        loading={loading}
        onDeleteContact={handleDeleteClick}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        sort={sort}
        onSortChange={onSortChange}
      />
      <DeleteCandidate
        selectId={selectId}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onRefetchContacts={refetchContacts}
      />
    </div>
  );
}
