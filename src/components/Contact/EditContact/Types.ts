export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  work_email: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  resume_url: string;
  functional_role: string;
  current_location: string | { location: string };
  current_job_title: string;
  current_company: string;
  current_company_size: string;
  contact_type: string;
  workplace_preferences: string | { value: string };
  compensation_expectations: string | { value: string };
  visa_requirements: boolean | string;
  past_company_sizes: string | string[];
  urgency_level: string;
  employment_status: string;
  other_social_urls: string | { value: string };
  years_of_experience?: string;
  engagement_score?: number;
  // hybrid_work_days?: string;
}