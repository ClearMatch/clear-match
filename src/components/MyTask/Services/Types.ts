export interface ActivityData {
  id: string;
  contact_id: string | null;
  organization_id: string | null;
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  created_by: string;
  due_date: string;
  status: string;
  priority: number;
  subject: string | null;
  content: string | null;
  assigned_to: string | null;
  event_id: string | null;
  job_posting_id: string | null;
}

export interface ActivityWithRelations extends ActivityData {
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  events?: {
    id: string;
    company_name: string | null;
    job_title: string | null;
    position: string | null;
    posted_on: string | null;
    metro_area: string | null;
    company_website: string | null;
    job_listing_url: string | null;
    company_location: string | null;
    contact_name: string | null;
    contact_linkedin: string | null;
  };
}

export const getFullName = (firstName?: string, lastName?: string): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return "N/A";
  }
};

const priorityMap: Record<number, string> = {
  4: "Critical",
  3: "High",
  2: "Medium",
  1: "Low",
};

export const getPriorityLabel = (priority: number): string =>
  priorityMap[priority] || "N/A";

export const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];
