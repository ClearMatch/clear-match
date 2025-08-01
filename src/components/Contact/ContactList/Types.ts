export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  work_email: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  current_job_title: string;
  current_company: string;
  current_location: string | { location: string };
  contact_type: string;
  functional_role: string;
  is_active_looking: boolean;
  tech_stack: string[];
  years_of_experience?: string;
  engagement_score?: number;
  created_at: string;
  updated_at: string;
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
}

export interface FilterState {
  contact_type: string[];
  functional_role: string[];
  is_active_looking: boolean | null;
  location_category: string[];
  current_company_size: string[];
  past_company_sizes: string[];
  urgency_level: string[];
  employment_status: string[];
  engagement_score: string[];
  engagement_range: string[]; // Will store values like "8-10", "6-7", etc.
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ContactsResponse {
  contacts: Contact[];
  hasMore: boolean;
  totalCount: number;
}

export interface FetchOptions {
  signal?: AbortSignal;
}

export interface CursorPaginationParams {
  cursor?: string;
  pageSize?: number;
}

export interface PaginationState {
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
}

export interface LoadingState {
  isInitialLoading: boolean;
  isFetchingMore: boolean;
  isSearching: boolean;
}

// Sorting types
export type SortField = 'first_name' | 'last_name' | 'created_at' | 'updated_at' | 'years_of_experience' | 'engagement_score';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
