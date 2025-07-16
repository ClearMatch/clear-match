export interface Event {
  id: string;
  contact_id?: string;
  organization_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SalaryRange {
  min?: number;
  max?: number;
  currency?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  posting_date: string | null;
  salary_range: SalaryRange | null;
  event_id: string | null;
  status: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  location?: string;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  status: string;
}

export interface EngagementLevel {
  level: string;
  color: string;
  description: string;
}

export interface PriorityInfo {
  calculation: string;
  description: string;
}
