"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { emptyFragment } from "../emptyFragment";
import Body from "./Body";
import Header from "./Header";
import { TableProps, toggleSelectAll, toggleSet } from "./Types";

function DataTable<T>({
  data,
  columns,
  rowKey,
  className,
  expandable = false,
  expandedRowRender,
  renderActionHeader = emptyFragment,
  renderAction,
  setSortSelection,
  sortSelection,
  showInnerIcon = false,
  hideHeaderCheckBox = false,
  hideRowCheckBox = false,
  onRowClick,
  selectedRowCss = "",
  selectedRowId,
}: TableProps<T>) {
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const handleExpand = (key: string) =>
    setExpandedRow((prev) => (prev === key ? null : key));

  const handleSelect = (key: string) => {
    setSelectedRows(toggleSet(selectedRows, key));
  };

  const handleSelectAll = () => {
    setSelectedRows(toggleSelectAll(selectedRows, data, rowKey));
  };

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "bg-white-600 box-border min-w-full text-sm ",
          className?.table
        )}
      >
        <Header
          columns={columns}
          showInnerIcon={showInnerIcon}
          selectAll={handleSelectAll}
          allSelected={data.every((row) =>
            selectedRows.has(String(row[rowKey]))
          )}
          renderActionHeader={renderActionHeader}
          setSortSelection={setSortSelection}
          sortSelection={sortSelection}
          className={className?.header}
          hideHeaderCheckBox={hideHeaderCheckBox}
        />
        <Body
          showInnerIcon={showInnerIcon}
          data={data}
          columns={columns}
          rowKey={rowKey}
          expandedRows={expandedRow ? new Set([expandedRow]) : new Set()}
          selectedRows={selectedRows}
          toggleExpand={handleExpand}
          toggleSelect={handleSelect}
          expandable={expandable}
          expandedRowRender={expandedRowRender}
          renderAction={renderAction}
          className={className?.body}
          hideRowCheckBox={hideRowCheckBox}
          onRowClick={onRowClick}
          selectedRowCss={selectedRowCss}
          selectedRowId={selectedRowId}
        />
      </table>
    </div>
  );
}

export default DataTable;
