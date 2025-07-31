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
  creation_type?: "manual" | "automatic";
}

export interface ActivityWithRelations extends ActivityData {
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    engagement_score?: number;
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

export const getPriorityLabel = (
  priority: number,
  creationType?: "manual" | "automatic"
): string => {
  if (creationType === "automatic") {
    // For automatic tasks, use different labels based on score ranges
    const autoPriorityMap: Record<number, string> = {
      6: "Critical",
      5: "High",
      4: "Medium",
      3: "Low-Medium",
      2: "Low",
      1: "Very Low",
    };
    return autoPriorityMap[priority] || "Very Low";
  } else {
    // For manual tasks, use the standard 4-level system
    return priorityMap[priority] || "Low";
  }
};

export const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];
