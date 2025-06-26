"use client";
import React from "react";
import BodyContent from "./BodyContent";
import { TableBodyProps } from "./Types";

function Body<T>({
  data,
  columns,
  rowKey,
  expandedRows,
  selectedRows,
  toggleExpand,
  toggleSelect,
  expandable,
  expandedRowRender,
  renderAction,
  className,
  showInnerIcon,
  hideRowCheckBox,
  onRowClick,
  selectedRowCss = "",
  selectedRowId,
}: TableBodyProps<T>) {
  return (
    <tbody>
      {data.map((row) => {
        const key = String(row[rowKey]);
        const isExpanded = expandedRows.has(key);
        const isSelected = selectedRows.has(key);

        return (
          <React.Fragment key={key}>
            <BodyContent
              row={row}
              columns={columns}
              toggleExpand={toggleExpand}
              toggleSelect={toggleSelect}
              expandable={expandable}
              expandedRowRender={expandedRowRender}
              renderAction={renderAction}
              className={className}
              showInnerIcon={showInnerIcon}
              isExpanded={isExpanded}
              isSelected={isSelected}
              uniqueKey={key}
              hideRowCheckBox={hideRowCheckBox}
              onRowClick={onRowClick}
              selectedRowCss={selectedRowCss}
              selectedRowId={selectedRowId}
              rowKey={rowKey}
            />
          </React.Fragment>
        );
      })}
    </tbody>
  );
}

export default Body;
