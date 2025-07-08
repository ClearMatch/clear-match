export interface FilterState {
  type: string;
  createdBy: string;
  contact: string;
  organization: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: keyof FilterState;
  placeholder: string;
  label: string;
  options: FilterOption[];
}

export const INITIAL_FILTERS: FilterState = {
  type: "",
  createdBy: "",
  contact: "",
  organization: "",
};
