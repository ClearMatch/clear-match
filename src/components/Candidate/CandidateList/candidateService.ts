import { supabase } from "@/lib/supabase";
import { ContactsResponse, FilterState, PaginationParams, SortConfig } from "./Types";

export const candidateService = {
  async fetchCandidates(
    searchQuery: string,
    filters: FilterState,
    pagination: PaginationParams,
    signal?: AbortSignal
  ): Promise<ContactsResponse> {
    const { page, pageSize } = pagination;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException("Request was aborted", "AbortError");
    }

    let query = supabase
      .from("contacts")
      .select(
        `
      *,
      tags:contact_tags (
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
    if (filters.contact_type.length > 0) {
      query = query.in("contact_type", filters.contact_type);
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

      const contacts = data || [];
      const totalCount = count || 0;
      const hasMore = from + contacts.length < totalCount;

      return {
        contacts: contacts,
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
    sort: SortConfig = { field: 'updated_at', direction: 'desc' },
    cursor?: string,
    pageSize: number = 20,
    signal?: AbortSignal
  ): Promise<ContactsResponse> {
    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException("Request was aborted", "AbortError");
    }

    let query = supabase
      .from("contacts")
      .select(
        `
        *,
        tags:contact_tags (
          tags (
            id,
            name,
            color
          )
        )
      `
      )
      .order(sort.field, { ascending: sort.direction === 'asc' })
      .limit(pageSize + 1);

    if (cursor) {
      // Apply cursor based on sort direction
      if (sort.direction === 'asc') {
        query = query.gt(sort.field, cursor);
      } else {
        query = query.lt(sort.field, cursor);
      }
    }

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,current_company.ilike.%${searchQuery}%,current_job_title.ilike.%${searchQuery}%`
      );
    }

    // Apply filters
    if (filters.contact_type.length > 0) {
      query = query.in("contact_type", filters.contact_type);
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

      const contacts = data || [];
      const hasMore = contacts.length > pageSize;

      // Remove the extra item if it exists
      if (hasMore) {
        contacts.pop();
      }

      return {
        contacts: contacts,
        hasMore,
        totalCount: 0, // Not available with cursor pagination
      };
    } catch (error) {
      // Re-throw abort errors and other errors
      throw error;
    }
  },
};
