"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import HeaderColumn from "./HeaderColumn";
import { Column, TableHeaderProps } from "./Types";

function Header<T>({
  columns,
  selectAll,
  allSelected,
  setSortSelection,
  sortSelection,
  className,
  hideHeaderCheckBox,
  renderActionHeader,
}: TableHeaderProps<T>) {
  const handleSort = (col: Column<T>) => () => {
    if (!col.sortable) return;
    if (!setSortSelection) return;
    setSortSelection((prev) => ({
      sortBy: col.key as string,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <thead
      className={cn(
        "relative h-11.25 bg-white text-left shadow-[0_3px_10px_rgb(0,0,0,0.2)]",
        className
      )}
    >
      <tr>
        <th
          className={cn(
            "w-[1.563rem] px-5 py-2",
            !hideHeaderCheckBox ? "table-cell" : "hidden"
          )}
        >
          {!hideHeaderCheckBox && (
            <Checkbox
              checked={allSelected}
              onCheckedChange={selectAll}
              className="border-indigo-600 text-indigo-600"
            />
          )}
        </th>

        {columns.map((col, index) => (
          <HeaderColumn
            key={index}
            col={col}
            handleSort={handleSort}
            sortSelection={sortSelection}
          />
        ))}
        {renderActionHeader && (
          <th className="cursor-pointer">{renderActionHeader(columns)}</th>
        )}
      </tr>
    </thead>
  );
}

export default Header;
