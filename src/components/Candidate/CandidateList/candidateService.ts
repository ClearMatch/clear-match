import { supabase } from "@/lib/supabase";
import { CandidatesResponse, FilterState, PaginationParams } from "./Types";

export const candidateService = {
  async fetchCandidates(
    searchQuery: string,
    filters: FilterState,
    pagination: PaginationParams,
    signal?: AbortSignal
  ): Promise<CandidatesResponse> {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException("Request was aborted", "AbortError");
    }

    let query = supabase
      .from("candidates")
      .select(
        `
      *,
      tags:candidate_tags (
        tags (
          id,
          name,
          color
        )
      )
    `,
        { count: "exact" }
      )
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Apply search filter
    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,current_company.ilike.%${searchQuery}%,current_job_title.ilike.%${searchQuery}%`
      );
    }

    // Apply filters
    if (filters.relationship_type.length > 0) {
      query = query.in("relationship_type", filters.relationship_type);
    }
    if (filters.location_category.length > 0) {
      query = query.contains(
        "workplace_preferences",
        `"${filters.location_category}"`
      );
    }
    if (filters.functional_role.length > 0) {
      query = query.in("functional_role", filters.functional_role);
    }
    if (filters.is_active_looking !== null) {
      query = query.eq("is_active_looking", filters.is_active_looking);
    }

    if (filters.current_company_size.length > 0) {
      query = query.in("current_company_size", filters.current_company_size);
    }

    if (filters.past_company_sizes.length > 0) {
      query = query.overlaps("past_company_sizes", filters.past_company_sizes);
    }

    if (filters.urgency_level.length > 0) {
      query = query.in("urgency_level", filters.urgency_level);
    }

    if (filters.employment_status.length > 0) {
      query = query.in("employment_status", filters.employment_status);
    }

    // Check abort signal before making the request
    if (signal?.aborted) {
      throw new DOMException("Request was aborted", "AbortError");
    }

    // Create a promise that rejects when the signal is aborted
    const abortPromise = new Promise<never>((_, reject) => {
      if (signal) {
        signal.addEventListener("abort", () => {
          reject(new DOMException("Request was aborted", "AbortError"));
        });
      }
    });

    try {
      // Race between the query and abort signal
      const result = signal
        ? await Promise.race([query, abortPromise])
        : await query;

      const { data, error, count } = result;

      if (error) throw error;

      const candidates = data || [];
      const totalCount = count || 0;
      const hasMore = from + candidates.length < totalCount;

      return {
        candidates,
        hasMore,
        totalCount,
      };
    } catch (error) {
      // Re-throw abort errors and other errors
      throw error;
    }
  },

  async fetchCandidatesCursor(
    userId: string,
    searchQuery: string,
    filters: FilterState,
    cursor?: string,
    pageSize: number = 20,
    signal?: AbortSignal
  ): Promise<CandidatesResponse> {
    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException("Request was aborted", "AbortError");
    }

    let query = supabase
      .from("candidates")
      .select(
        `
        *,
        tags:candidate_tags (
          tags (
            id,
            name,
            color
          )
        )
      `
      )
      .order("updated_at", { ascending: false })
      .limit(pageSize + 1);

    if (cursor) {
      query = query.lt("updated_at", cursor);
    }

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,current_company.ilike.%${searchQuery}%,current_job_title.ilike.%${searchQuery}%`
      );
    }

    // Apply filters
    if (filters.relationship_type.length > 0) {
      query = query.in("relationship_type", filters.relationship_type);
    }

    if (filters.location_category.length > 0) {
      query = query.contains(
        "workplace_preferences",
        `"${filters.location_category}"`
      );
    }

    if (filters.functional_role.length > 0) {
      query = query.in("functional_role", filters.functional_role);
    }
    if (filters.is_active_looking !== null) {
      query = query.eq("is_active_looking", filters.is_active_looking);
    }
    if (filters.current_company_size.length > 0) {
      query = query.overlaps(
        "current_company_size",
        filters.current_company_size
      );
    }

    if (filters.past_company_sizes.length > 0) {
      query = query.in("past_company_sizes", filters.past_company_sizes);
    }

    if (filters.urgency_level.length > 0) {
      query = query.in("urgency_level", filters.urgency_level);
    }

    if (filters.employment_status.length > 0) {
      query = query.in("employment_status", filters.employment_status);
    }

    if (signal?.aborted) {
      throw new DOMException("Request was aborted", "AbortError");
    }

    // Create a promise that rejects when the signal is aborted
    const abortPromise = new Promise<never>((_, reject) => {
      if (signal) {
        signal.addEventListener("abort", () => {
          reject(new DOMException("Request was aborted", "AbortError"));
        });
      }
    });

    try {
      // Race between the query and abort signal
      const result = signal
        ? await Promise.race([query, abortPromise])
        : await query;

      const { data, error } = result;

      if (error) throw error;

      const candidates = data || [];
      const hasMore = candidates.length > pageSize;

      // Remove the extra item if it exists
      if (hasMore) {
        candidates.pop();
      }

      return {
        candidates,
        hasMore,
        totalCount: 0, // Not available with cursor pagination
      };
    } catch (error) {
      // Re-throw abort errors and other errors
      throw error;
    }
  },
};
