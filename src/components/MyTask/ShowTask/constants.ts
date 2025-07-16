export const EVENT_TYPE_LABELS: Record<string, string> = {
  "job-group-posting": "Job Group Posting",
  layoff: "Layoff",
  birthday: "Birthday",
  "funding-event": "Funding Event",
  "new-job": "New Job",
  none: "None",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  "job-group-posting": "bg-blue-50 text-blue-700 border-blue-200",
  layoff: "bg-red-50 text-red-700 border-red-200",
  birthday: "bg-green-50 text-green-700 border-green-200",
  "funding-event": "bg-purple-50 text-purple-700 border-purple-200",
  "new-job": "bg-indigo-50 text-indigo-700 border-indigo-200",
  none: "bg-gray-50 text-gray-700 border-gray-200",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  none: "None",
  not_contracted: "Not Contracted",
  under_contract: "Under Contract",
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  none: "bg-gray-50 text-gray-700 border-gray-200",
  not_contracted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  under_contract: "bg-green-50 text-green-700 border-green-200",
};

export const PRIORITY_EXPLANATIONS: Record<
  number,
  { calculation: string; description: string }
> = {
  1: {
    calculation: "High engagement × Critical event = 90+ (High Priority)",
    description:
      "Immediate attention required due to high engagement and critical event importance",
  },
  2: {
    calculation:
      "High engagement × Moderate event = 60-89 (High-Medium Priority)",
    description: "Important task requiring attention within 24-48 hours",
  },
  3: {
    calculation: "Medium engagement × Average event = 40-59 (Medium Priority)",
    description: "Standard task requiring attention within a few days",
  },
  4: {
    calculation: "Low engagement × Minor event = 20-39 (Low-Medium Priority)",
    description: "Task can be scheduled for completion within a week",
  },
  5: {
    calculation: "Low engagement × Low importance = 10-19 (Low Priority)",
    description: "Task can be deferred or completed when convenient",
  },
  6: {
    calculation:
      "Minimal engagement × Minimal importance = 0-9 (Very Low Priority)",
    description: "Optional task with no immediate urgency",
  },
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: "text-red-700 bg-red-50 border-red-200",
  2: "text-orange-700 bg-orange-50 border-orange-200",
  3: "text-yellow-700 bg-yellow-50 border-yellow-200",
  4: "text-blue-700 bg-blue-50 border-blue-200",
  5: "text-green-700 bg-green-50 border-green-200",
  6: "text-gray-700 bg-gray-50 border-gray-200",
};
