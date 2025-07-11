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
  workplace_preferences: string;
  compensation_expectations: string;
  visa_requirements: boolean;
  past_company_sizes: string;
  urgency_level: string;
  employment_status: string;
  other_social_urls: string;
  // hybrid_work_days?: string;
}