import { supabase } from "@/lib/supabase";
import { Contact, ContactsResponse, FilterState, PaginationParams, SortConfig } from "./Types";

export const fetchContactsPaginated = async (
  page: number,
  pageSize: number,
  searchQuery?: string,
  filters?: FilterState
): Promise<Contact[]> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

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
    .order("updated_at", { ascending: false })
    .range(from, to);

  // Apply search filter
  if (searchQuery && searchQuery.trim()) {
    query = query.or(
      `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,current_company.ilike.%${searchQuery}%,current_job_title.ilike.%${searchQuery}%`
    );
  }

  // Apply filters
  if (filters) {
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
    // Apply engagement filters
    if (filters.engagement_range.length > 0) {
      if (filters.engagement_range.length === 1) {
        const range = filters.engagement_range[0];
        if (range) {
          const [min, max] = range.split('-').map(Number);
          if (min && max) {
            query = query.gte('engagement_score', min).lte('engagement_score', max);
          }
        }
      } else {
        const rangeConditions: string[] = [];
        filters.engagement_range.forEach(range => {
          if (range) {
            const [min, max] = range.split('-').map(Number);
            if (min && max) {
              rangeConditions.push(`(engagement_score.gte.${min},engagement_score.lte.${max})`);
            }
          }
        });
        if (rangeConditions.length > 0) {
          query = query.or(rangeConditions.join(','));
        }
      }
    } else if (filters.engagement_score.length > 0) {
      query = query.in('engagement_score', filters.engagement_score);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const contactService = {
  async fetchContacts(
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

    // Apply engagement filters - prioritize range over individual scores
    if (filters.engagement_range.length > 0) {
      // For multiple ranges, we need OR logic between ranges, but AND within each range
      if (filters.engagement_range.length === 1) {
        // Single range: apply both conditions with AND logic
        const range = filters.engagement_range[0];
        if (range) {
          const [min, max] = range.split('-').map(Number);
          if (min && max) {
            query = query.gte('engagement_score', min).lte('engagement_score', max);
          }
        }
      } else {
        // Multiple ranges: use OR logic between ranges
        const rangeConditions: string[] = [];
        
        filters.engagement_range.forEach(range => {
          const [min, max] = range.split('-').map(Number);
          if (min && max) {
            rangeConditions.push(`and(engagement_score.gte.${min},engagement_score.lte.${max})`);
          }
        });
        
        if (rangeConditions.length > 0) {
          query = query.or(rangeConditions.join(','));
        }
      }
    } else if (filters.engagement_score.length > 0) {
      // Only apply individual scores if no range filter is set
      query = query.in("engagement_score", filters.engagement_score.map(score => parseInt(score)));
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

  async fetchContactsCursor(
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

    // Apply engagement filters - prioritize range over individual scores
    if (filters.engagement_range.length > 0) {
      // For multiple ranges, we need OR logic between ranges, but AND within each range
      if (filters.engagement_range.length === 1) {
        // Single range: apply both conditions with AND logic
        const range = filters.engagement_range[0];
        if (range) {
          const [min, max] = range.split('-').map(Number);
          if (min && max) {
            query = query.gte('engagement_score', min).lte('engagement_score', max);
          }
        }
      } else {
        // Multiple ranges: use OR logic between ranges
        const rangeConditions: string[] = [];
        
        filters.engagement_range.forEach(range => {
          const [min, max] = range.split('-').map(Number);
          if (min && max) {
            rangeConditions.push(`and(engagement_score.gte.${min},engagement_score.lte.${max})`);
          }
        });
        
        if (rangeConditions.length > 0) {
          query = query.or(rangeConditions.join(','));
        }
      }
    } else if (filters.engagement_score.length > 0) {
      // Only apply individual scores if no range filter is set
      query = query.in("engagement_score", filters.engagement_score.map(score => parseInt(score)));
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

  async fetchContactsCount(
    userId: string,
    searchQuery: string,
    filters: FilterState,
    signal?: AbortSignal
  ): Promise<number> {
    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException("Request was aborted", "AbortError");
    }

    let query = supabase
      .from("contacts")
      .select("*", { count: "exact", head: true });

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,current_company.ilike.%${searchQuery}%,current_job_title.ilike.%${searchQuery}%`
      );
    }

    // Apply filters (same logic as fetchContactsCursor)
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

    // Apply engagement filters - prioritize range over individual scores
    if (filters.engagement_range.length > 0) {
      // For multiple ranges, we need OR logic between ranges, but AND within each range
      if (filters.engagement_range.length === 1) {
        // Single range: apply both conditions with AND logic
        const range = filters.engagement_range[0];
        if (range) {
          const [min, max] = range.split('-').map(Number);
          if (min && max) {
            query = query.gte('engagement_score', min).lte('engagement_score', max);
          }
        }
      } else {
        // Multiple ranges: use OR logic between ranges
        const rangeConditions: string[] = [];
        
        filters.engagement_range.forEach(range => {
          const [min, max] = range.split('-').map(Number);
          if (min && max) {
            rangeConditions.push(`and(engagement_score.gte.${min},engagement_score.lte.${max})`);
          }
        });
        
        if (rangeConditions.length > 0) {
          query = query.or(rangeConditions.join(','));
        }
      }
    } else if (filters.engagement_score.length > 0) {
      // Only apply individual scores if no range filter is set
      query = query.in("engagement_score", filters.engagement_score.map(score => parseInt(score)));
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

      const { count, error } = result;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      // Re-throw abort errors and other errors
      throw error;
    }
  },
};
