// Cache keys used across the application
export const CACHE_KEYS = {
  ACTIVITIES_WITH_RELATIONS: "activitiesWithRelations",
  UPDATE_ACTIVITY: (id: string) => `update-activity-${id}`,
  ACTIVITY: (id: string) => ["activity", id],
  ASSIGNEE_OPTIONS: "assigneeOptions",
  CREATOR_OPTIONS: "creatorOptions",
  ORGANIZATION_OPTIONS: "organizationOptions"
} as const;

// Priority constants
export const PRIORITY_RANGE = {
  MIN: 1,
  MAX: 6
} as const;

// Status validation
export const VALID_STATUSES = ['todo', 'in-progress', 'done'] as const;

export type ValidStatus = typeof VALID_STATUSES[number];