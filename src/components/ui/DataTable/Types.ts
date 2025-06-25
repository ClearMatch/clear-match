import React, { RefObject } from "react";

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  width?: string;
  sortable?: boolean;
};

export type SortSelection = { sortOrder: "asc" | "desc"; sortBy: string };
export type TableClassName = {
  header?: string;
  table?: string;
  body?: string;
};

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T;
  className?: TableClassName;
  expandable?: boolean;
  expandedRowRender?: (row: T) => React.ReactNode;
  onPageChange?: (page: number) => void;
  classNames?: TableClassNames;
  renderActionHeader?: (data: Column<T>[]) => React.ReactNode;
  renderAction?: (row: T) => React.ReactNode | string;
  setSortSelection?: React.Dispatch<React.SetStateAction<SortSelection>>;
  sortSelection?: SortSelection;
  showInnerIcon?: boolean;
  hideHeaderCheckBox?: boolean;
  hideRowCheckBox?: boolean;
  showViewStatus?: keyof T;
  onRowClick?: (row: T) => void;
  showBorderIndicator?: boolean;
  selectedRowCss?: string;
  selectedRowId?: string | null;
}

export interface TableBodyProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T;
  expandedRows: Set<string>;
  selectedRows: Set<string>;
  toggleExpand: (key: string) => void;
  toggleSelect: (key: string) => void;
  expandable: boolean;
  expandedRowRender?: (row: T) => React.ReactNode;
  renderAction?: (row: T) => React.ReactNode | string;
  className?: string;
  showInnerIcon?: boolean;
  hideRowCheckBox: boolean;
  onRowClick?: (row: T) => void;
  showBorderIndicator?: boolean;
  selectedRowCss?: string;
  selectedRowId?: string | null;
}

export function toggleSet(set: Set<string>, key: string): Set<string> {
  const newSet = new Set(set);
  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    newSet.add(key);
  }
  return newSet;
}

export function toggleSelectAll<T>(
  currentSet: Set<string>,
  data: T[],
  rowKey: keyof T
): Set<string> {
  const allSelected = data.every((row) => currentSet.has(String(row[rowKey])));
  const newSet = new Set(currentSet);
  data.forEach((row) => {
    const key = String(row[rowKey]);
    if (allSelected) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
  });
  return newSet;
}

export interface TableClassNames {
  header?: string;
  body?: string;
  row?: string;
  cell?: string;
}

export interface TableHeaderProps<T> {
  columns: Column<T>[];
  selectAll: () => void;
  allSelected: boolean;
  renderActionHeader?: (data: Column<T>[]) => React.ReactNode;
  setSortSelection?: React.Dispatch<React.SetStateAction<SortSelection>>;
  sortSelection?: SortSelection;
  className?: string;
  showInnerIcon?: boolean;
  hideHeaderCheckBox: boolean;
}

type IndicatorRef = RefObject<HTMLDivElement | null>;

export const showIndicator = (indicatorRef: IndicatorRef) => () => {
  if (indicatorRef.current) indicatorRef.current.style.display = "block";
};

export const hideIndicator = (indicatorRef: IndicatorRef) => () => {
  if (indicatorRef.current) indicatorRef.current.style.display = "none";
};

export interface PaginationProps<T> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  data: T[];
  className?: string;
}
