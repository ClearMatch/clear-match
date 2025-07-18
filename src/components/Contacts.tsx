"use client";

import { useOpenable } from "@/hooks";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { ContactsList } from "./Contact/ContactList";
import { SearchAndFilterBar } from "./Contact/ContactList/SearchAndFilterBar";
import { useContacts } from "./Contact/ContactList/useContact";
import DeleteContact from "./Contact/DeleteContact";
import Header from "./Contact/Header";

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
    hasActiveFilters,
    isSearching,
    hasMore,
    onLoadMore,
    refetchContacts,
    sort,
    onSortChange,
  } = useContacts();

  // Auto-open filters when there are active filters (e.g., from ProfileCard navigation)
  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      setShowFilters(true);
    }
  }, [hasActiveFilters, showFilters]);

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
      engagement_score: [],
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
      <DeleteContact
        selectId={selectId}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onRefetchContacts={refetchContacts}
      />
    </div>
  );
}
