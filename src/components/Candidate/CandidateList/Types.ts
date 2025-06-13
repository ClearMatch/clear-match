export interface Candidate {
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
  current_location: string;
  relationship_type: string;
  functional_role: string;
  is_active_looking: boolean;
  tech_stack: string[];
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
}

export interface FilterState {
  relationship_type: string[];
  functional_role: string[];
  is_active_looking: boolean | null;
  location_category: string[];
  current_company_size: string[];
  past_company_sizes: string[];
  urgency_level: string[];
  employment_status: string[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CandidatesResponse {
  candidates: Candidate[];
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
