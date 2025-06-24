export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Event {
  id: string;
  name: string; // This will be mapped from 'type' field
  contact_id?: string;
  organization_id?: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface JobPosting {
  id: string;
  title: string;
}
