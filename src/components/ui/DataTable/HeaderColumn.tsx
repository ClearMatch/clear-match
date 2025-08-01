"use client";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUp } from "lucide-react";
import { emptyFragment } from "../emptyFragment";
import { Column, SortSelection } from "./Types";

interface Props<T> {
  col: Column<T>;
  handleSort: (col: Column<T>) => () => void;
  sortSelection?: SortSelection;
}

function HeaderColumn<T>({ col, handleSort, sortSelection }: Props<T>) {
  return (
    <th
      key={String(col.key)}
      className={cn(
        "cursor-pointer px-2 py-[0.9375rem] text-xs leading-[0.9375rem] font-semibold tracking-[0.0375rem]",
        col.className ?? ""
      )}
      style={{ width: col.width }}
      onClick={handleSort(col)}
    >
      <div className="flex items-center">
        {col.header}
        {sortSelection ? (
          <>
            {sortSelection.sortBy === col.key && col.sortable && (
              <span className="ml-1">
                {sortSelection.sortOrder === "asc" ? (
                  <ArrowUp className="h-3 w-3" />
                ) : sortSelection.sortOrder === "desc" ? (
                  <ArrowDownIcon className="h-3 w-3" />
                ) : (
                  ""
                )}
              </span>
            )}
          </>
        ) : (
          emptyFragment()
        )}
      </div>
    </th>
  );
}

export default HeaderColumn;
