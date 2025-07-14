import { supabase } from "@/lib/supabase";
import { useCallback } from "react";

interface OrganizationAuthData {
  userId: string;
  organizationId: string;
}

/**
 * Reusable hook for organization-based authentication and authorization
 * Provides methods to get authenticated user's organization context
 */
export const useOrganizationAuth = () => {
  /**
   * Get current authenticated user and their organization ID
   * @returns Promise with user and organization data
   * @throws Error if authentication fails or user has no organization
   */
  const getOrganizationAuth = useCallback(async (): Promise<OrganizationAuthData> => {
    // Get current user's authentication status
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Authentication required");
    }

    // Get user's organization context
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error("Failed to get user organization");
    }

    return {
      userId: user.id,
      organizationId: profileData.organization_id,
    };
  }, []);

  /**
   * Helper to add organization filter to Supabase query builder
   * @param query - Supabase query builder
   * @param organizationId - Organization ID to filter by
   * @returns Query builder with organization filter applied
   */
  const addOrganizationFilter = useCallback(
    (query: any, organizationId: string) => {
      return query.eq("organization_id", organizationId);
    },
    []
  );

  return {
    getOrganizationAuth,
    addOrganizationFilter,
  };
};