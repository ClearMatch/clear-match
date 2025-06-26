"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TableBodyProps } from "./Types";

type Props<T> = Omit<
  TableBodyProps<T>,
  "data" | "expandedRows" | "selectedRows"
> & {
  isSelected: boolean;
  isExpanded: boolean;
  row: T;
  uniqueKey: string;
  showCheckBox?: boolean;
  selectedRowCss?: string;
};

const BodyContent = <T,>({
  columns,
  toggleExpand,
  expandable,
  isSelected,
  className,
  toggleSelect,
  isExpanded,
  row,
  uniqueKey,
  renderAction,
  expandedRowRender,
  hideRowCheckBox,
  onRowClick,
}: Props<T>) => {
  const handleRowClick = () => {
    if (expandable) {
      toggleExpand(uniqueKey);
    } else {
      onRowClick?.(row);
    }
  };

  return (
    <>
      <tr
        onClick={handleRowClick}
        className={cn(
          "box-border h-10 cursor-pointer",
          "bg-gray-175",
          "hover:bg-gray-200",
          "h-[51px] border-b border-b-[#D0D2D5]",
          className
        )}
      >
        <td
          className={cn(
            "w-[1.563rem] px-5 py-2",
            !hideRowCheckBox ? "table-cell" : "hidden"
          )}
        >
          <div className="flex items-center gap-6">
            {!hideRowCheckBox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(uniqueKey)}
                className="border-indigo-600 text-indigo-600"
              />
            )}
          </div>
        </td>
        {columns.map((col) => (
          <td key={String(col.key)} className={`p-2 ${col.className ?? ""}`}>
            {col.render ? col.render(row) : String(row[col.key as keyof T])}
          </td>
        ))}
        <td className="cursor-pointer">
          {renderAction && <>{renderAction(row)}</>}
        </td>
      </tr>
      {expandable && isExpanded && expandedRowRender && (
        <tr>
          <td colSpan={columns.length + 2} className="bg-gray-50 p-0">
            {expandedRowRender(row)}
          </td>
        </tr>
      )}
    </>
  );
};

export default BodyContent;
