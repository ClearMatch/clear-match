"use client";

import { useOpenable } from "@/hooks";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { CandidatesList } from "./Candidate/CandidateList";
import { SearchAndFilterBar } from "./Candidate/CandidateList/SearchAndFilterBar";
import { useCandidates } from "./Candidate/CandidateList/useCandidate";
import DeleteCandidate from "./Candidate/DeleteCandidate";
import Header from "./Candidate/Header";

export function Candidates() {
  const { user } = useAuth();
  const [selectId, setSelectId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useOpenable();

  const {
    candidates,
    loading,
    searchInputValue,
    setSearchInputValue,
    filters,
    setFilters,
    isSearching,
    hasMore,
    totalCount,
    onLoadMore,
    refetchCandidates,
  } = useCandidates();

  const handleEditClick = (candidateId: string) => {
    setSelectId(candidateId);
  };
  const handleDeleteClick = (candidateId: string) => {
    setSelectId(candidateId);
    onDeleteOpen();
  };

  const handleToggleFilters = () => {
    setFilters({
      relationship_type: [],
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
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Please log in to view candidates</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
      <CandidatesList
        candidates={candidates}
        loading={loading}
        onEditCandidate={handleEditClick}
        onDeleteCandidate={handleDeleteClick}
        hasMore={hasMore}
        totalCount={totalCount}
        onLoadMore={onLoadMore}
      />
      <DeleteCandidate
        selectId={selectId}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onRefetchCandidates={refetchCandidates}
      />
    </div>
  );
}
