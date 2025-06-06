"use client";

import { useOpenable } from "@/hooks";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { CandidatesList } from "./Candidate/CandidateList";
import { SearchAndFilterBar } from "./Candidate/CandidateList/SearchAndFilterBar";
import { useCandidates } from "./Candidate/CandidateList/useCandidate";
import CreateCandidate from "./Candidate/CreateCandidate";
import DeleteCandidate from "./Candidate/DeleteCandidate";
import EditCandidate from "./Candidate/EditCandidate";
import Header from "./Candidate/Header";

export function Candidates() {
  const { user } = useAuth();
  const [selectId, setSelectId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { isOpen, onOpen, onClose } = useOpenable();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useOpenable();

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
    onEditOpen();
  };
  const handleDeleteClick = (candidateId: string) => {
    setSelectId(candidateId);
    onDeleteOpen();
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
      <Header onOpen={onOpen} />
      <SearchAndFilterBar
        searchInputValue={searchInputValue}
        onSearchChange={setSearchInputValue}
        isSearching={isSearching}
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
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
      <CreateCandidate
        isOpen={isOpen}
        onClose={onClose}
        onRefetchCandidates={refetchCandidates}
      />
      <EditCandidate
        selectId={selectId}
        isOpen={isEditOpen}
        onClose={onEditClose}
        onRefetchCandidates={refetchCandidates}
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
