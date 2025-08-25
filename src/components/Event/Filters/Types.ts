export interface FilterState {
  type: string;
  createdBy: string;
  contact: string;
  organization: string;
  // Clay webhook filters for job-listing events
  position: string;
  companyName: string;
  metroArea: string;
  dateRange: string; // Recent: last 7 days, This Month, This Quarter
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: keyof FilterState;
  placeholder: string;
  label: string;
  options?: FilterOption[];
  type?: 'select' | 'search' | 'text';
}

export const INITIAL_FILTERS: FilterState = {
  type: "",
  createdBy: "",
  contact: "",
  organization: "",
  position: "",
  companyName: "",
  metroArea: "",
  dateRange: "",
};

// Date range filter options
export const DATE_RANGE_OPTIONS: FilterOption[] = [
  { value: "recent", label: "Last 7 days" },
  { value: "this_month", label: "This month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "all_time", label: "All time" },
];
