"use client";

import { emptyFragment } from "@/components/ui/emptyFragment";
import InfiniteScroll from "@/components/ui/infiniteScroll";
import { Loader2 } from "lucide-react";
import { CandidatesTable } from "./CandidatesTable";
import { Candidate, SortConfig, SortField } from "./Types";

interface CandidatesListProps {
  candidates: Candidate[];
  loading: boolean;
  onDeleteCandidate: (candidateId: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
}

export function CandidatesList({
  candidates,
  loading,
  hasMore,
  onLoadMore,
  onDeleteCandidate,
  sort,
  onSortChange,
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
      <div className="text-sm text-gray-600">
        Showing {candidates.length} candidates
      </div>
      <div
        id={scrollableContainerId}
        className="max-h-[70vh] overflow-y-auto"
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
        >
          <CandidatesTable
            candidates={candidates}
            sort={sort}
            onSortChange={onSortChange}
            onEdit={() => {}} // Not used anymore, navigation handled in table
            onDelete={(candidate) => onDeleteCandidate(candidate.id)}
          />
        </InfiniteScroll>
      </div>
    </div>
  );
}
