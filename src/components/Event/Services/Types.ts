export interface EventData {
  id: string;
  contact_id: string;
  organization_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Clay webhook structured columns for job-listing events
  position?: string;
  posted_on?: string;
  metro_area?: string;
  company_name?: string;
  contact_name?: string;
  company_website?: string;
  job_listing_url?: string;
  company_location?: string;
  contact_linkedin?: string;
  // Legacy JSONB field for backward compatibility
  data?: Record<string, any>;
  // Related data (Supabase returns arrays for joins)
  contact: {
    id: string;
    first_name: string;
    last_name: string;
  }[] | null;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
  }[] | null;
  organizations: {
    id: string;
    name: string;
  }[] | null;
}
