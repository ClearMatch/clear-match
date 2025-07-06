"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  phoneNumber: string | null;
  refreshProfile: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch("/api/profile", {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await response.json();
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const refreshProfile = async () => {
    setLoading(true);
    await loadProfile();
  };

  return {
    profile,
    loading,
    error,
    phoneNumber: profile?.phone || null,
    refreshProfile,
  };
}