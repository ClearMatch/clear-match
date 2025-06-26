"use client";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PaginationProps } from "./Types";

const Pagination = <T,>({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  data,
  className,
}: PaginationProps<T>) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  if (data.length < 1) {
    return (
      <h1 className="mt-2 w-full text-center" color="gray">
        No Data Found
      </h1>
    );
  }

  return (
    <div
      className={cn(
        `flex items-center justify-between p-4 pb-0 text-sm text-gray-700`,
        className
      )}
    >
      <div className="leading-[1.125rem] tracking-[0.0225rem]">
        {start}-{end} of {totalItems}
      </div>
      <div className="flex items-center">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="flex h-[20px] w-[24px] cursor-pointer items-center justify-center rounded-md border bg-white disabled:opacity-30"
        >
          <ArrowLeft size="sm" />
        </button>
        <span className="px-2 leading-[1.125rem] tracking-[0.0225rem]">
          {currentPage}/{totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex h-[20px] w-[24px] cursor-pointer items-center justify-center rounded-md border bg-white disabled:opacity-30"
        >
          <ArrowRight size="sm" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
