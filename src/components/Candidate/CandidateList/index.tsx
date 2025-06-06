"use client";

import { emptyFragment } from "@/components/ui/emptyFragment";
import InfiniteScroll from "@/components/ui/infiniteScroll";
import { Loader2 } from "lucide-react";
import { CandidateCard } from "./CandidateCard";
import { Candidate } from "./Types";

interface CandidatesListProps {
  candidates: Candidate[];
  loading: boolean;
  onEditCandidate: (candidateId: string) => void;
  onDeleteCandidate: (candidateId: string) => void;
  hasMore: boolean;
  totalCount: number;
  onLoadMore: () => void;
}

export function CandidatesList({
  candidates,
  loading,
  onEditCandidate,
  hasMore,
  totalCount,
  onLoadMore,
  onDeleteCandidate,
}: CandidatesListProps) {
  const scrollableContainerId = "candidates-scroll-container";
  if (loading && candidates.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!loading && candidates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">No candidates found</div>
    );
  }

  return (
    <div className="space-y-6">
      {totalCount > 0 && (
        <div className="text-sm text-gray-600">
          Showing {candidates.length} of {totalCount} candidates
        </div>
      )}
      <div
        id={scrollableContainerId}
        className="max-h-[70vh] overflow-y-auto pr-2"
      >
        <InfiniteScroll
          dataLength={candidates.length}
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
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {candidates.map((candidate, index) => (
            <CandidateCard
              key={`${candidate.id}-${index}`}
              candidate={candidate}
              onEdit={onEditCandidate}
              onDelete={onDeleteCandidate}
            />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
}
