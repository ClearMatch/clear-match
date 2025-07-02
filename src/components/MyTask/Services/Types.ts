export interface ActivityData {
  id: string;
  candidate_id: string | null;
  organization_id: string | null;
  type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
  due_date: string;
  status: string;
  priority: number;
}

export interface ActivityWithRelations extends ActivityData {
  candidates?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  profiles?: {
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
  1: "High",
  2: "High-Medium",
  3: "Medium",
  4: "Low-Medium",
  5: "Low",
  6: "Very Low",
};

export const getPriorityLabel = (priority: number): string =>
  priorityMap[priority] || "N/A";

export const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];
