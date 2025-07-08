/**
 * Centralized query key management for TanStack Query
 * 
 * This file provides type-safe query key factories to ensure consistency
 * across the application and prevent cache invalidation issues.
 * 
 * Query Key Hierarchy:
 * - Level 1: Entity type (contacts, tasks, dashboard, etc.)
 * - Level 2: Entity scope (list, detail, options, etc.)
 * - Level 3: Parameters (filters, search, pagination, etc.)
 * 
 * Examples:
 * - ['contacts', 'list', { search: 'john', filters: { status: 'active' } }]
 * - ['tasks', 'detail', 'task-123']
 * - ['dashboard', 'stats', 'user-456']
 */

import type { QueryClient } from '@tanstack/react-query';

export interface ContactFilters {
  status?: string;
  organizationId?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ContactSort {
  field: 'firstName' | 'lastName' | 'email' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  creatorId?: string;
  contactId?: string;
  eventId?: string;
  dueDate?: {
    start: string;
    end: string;
  };
}

export interface TaskSort {
  field: 'title' | 'status' | 'priority' | 'due_date' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

/**
 * Contact Query Keys
 */
export const contactKeys = {
  // Base key for all contact queries
  all: ['contacts'] as const,
  
  // Contact lists with various parameters
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params: {
    search?: string;
    filters?: ContactFilters;
    sort?: ContactSort;
    userId?: string;
  }) => [...contactKeys.lists(), params] as const,
  
  // Individual contact details
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
  
  // Contact-related data
  tasks: (contactId: string) => [...contactKeys.all, 'tasks', contactId] as const,
  events: (contactId: string) => [...contactKeys.all, 'events', contactId] as const,
  
  // Contact form options
  organizations: () => [...contactKeys.all, 'organizations'] as const,
  tags: () => [...contactKeys.all, 'tags'] as const,
} as const;

/**
 * Task Query Keys
 */
export const taskKeys = {
  // Base key for all task queries
  all: ['tasks'] as const,
  
  // Task lists with various parameters
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: {
    search?: string;
    filters?: TaskFilters;
    sort?: TaskSort;
  }) => [...taskKeys.lists(), params] as const,
  
  // Individual task details
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  
  // Task form options
  assigneeOptions: () => [...taskKeys.all, 'assignee-options'] as const,
  creatorOptions: () => [...taskKeys.all, 'creator-options'] as const,
  formData: () => [...taskKeys.all, 'form-data'] as const,
} as const;

/**
 * Dashboard Query Keys
 */
export const dashboardKeys = {
  // Base key for all dashboard queries
  all: ['dashboard'] as const,
  
  // Dashboard statistics
  stats: (userId: string) => [...dashboardKeys.all, 'stats', userId] as const,
  
  // Dashboard charts and analytics
  analytics: (userId: string, timeRange?: string) => 
    [...dashboardKeys.all, 'analytics', userId, timeRange] as const,
  
  // Recent activity
  activity: (userId: string, limit?: number) => 
    [...dashboardKeys.all, 'activity', userId, limit] as const,
} as const;

/**
 * Event Query Keys
 */
export const eventKeys = {
  // Base key for all event queries
  all: ['events'] as const,
  
  // Event lists
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: {
    search?: string;
    filters?: Record<string, unknown>;
    sort?: Record<string, unknown>;
  }) => [...eventKeys.lists(), params] as const,
  
  // Individual event details
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  
  // Event form data
  formData: () => [...eventKeys.all, 'form-data'] as const,
} as const;

/**
 * User/Profile Query Keys
 */
export const userKeys = {
  // Base key for all user queries
  all: ['users'] as const,
  
  // Current user profile
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
  
  // User lists (for dropdowns, assignments, etc.)
  lists: () => [...userKeys.all, 'list'] as const,
  list: (organizationId?: string) => [...userKeys.lists(), organizationId] as const,
  
  // User preferences
  preferences: (userId: string) => [...userKeys.all, 'preferences', userId] as const,
} as const;

/**
 * Organization Query Keys
 */
export const organizationKeys = {
  // Base key for all organization queries
  all: ['organizations'] as const,
  
  // Organization lists
  lists: () => [...organizationKeys.all, 'list'] as const,
  
  // Individual organization details
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  
  // Organization members
  members: (organizationId: string) => 
    [...organizationKeys.all, 'members', organizationId] as const,
} as const;

/**
 * Utility functions for query key management
 */
export const queryKeyUtils = {
  /**
   * Helper to invalidate all queries for a specific entity
   */
  invalidateEntity: (queryClient: QueryClient, entityKey: readonly string[]) => {
    return queryClient.invalidateQueries({ queryKey: entityKey });
  },

  /**
   * Helper to remove all queries for a specific entity
   */
  removeEntity: (queryClient: QueryClient, entityKey: readonly string[]) => {
    return queryClient.removeQueries({ queryKey: entityKey });
  },

  /**
   * Helper to get all cached data for an entity
   */
  getEntityData: (queryClient: QueryClient, entityKey: readonly string[]) => {
    return queryClient.getQueriesData({ queryKey: entityKey });
  },

  /**
   * Helper to prefetch related data
   */
  prefetchRelated: async (
    queryClient: QueryClient,
    relationships: { queryKey: readonly string[]; queryFn: () => Promise<unknown> }[]
  ) => {
    const prefetchPromises = relationships.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({ queryKey, queryFn })
    );
    
    return Promise.all(prefetchPromises);
  },

  /**
   * Granular cache invalidation helpers
   */
  invalidateContactsAfterMutation: (queryClient: QueryClient, contactId?: string) => {
    // Always invalidate lists to show updated data
    queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    
    // If we have a specific contact, invalidate its details and related data
    if (contactId) {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(contactId) });
      queryClient.invalidateQueries({ queryKey: contactKeys.tasks(contactId) });
      queryClient.invalidateQueries({ queryKey: contactKeys.events(contactId) });
    }
  },

  invalidateTasksAfterMutation: (queryClient: QueryClient, taskId?: string, contactId?: string) => {
    // Always invalidate task lists
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    
    // If we have a specific task, invalidate its details
    if (taskId) {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    }
    
    // If task is related to a contact, invalidate contact's tasks
    if (contactId) {
      queryClient.invalidateQueries({ queryKey: contactKeys.tasks(contactId) });
    }
  },

  invalidateDashboardAfterMutation: (queryClient: QueryClient, userId?: string) => {
    // Invalidate dashboard data that might be affected by mutations
    if (userId) {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(userId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.activity(userId) });
    }
  },

  /**
   * Validation helper for query keys
   */
  validateQueryKey: (key: readonly unknown[]): readonly unknown[] => {
    if (key.length > 4) {
      console.warn('Query key depth exceeds recommended limit (4 levels):', key);
    }
    
    if (key.some(segment => segment === undefined || segment === null)) {
      console.warn('Query key contains undefined/null segments:', key);
    }
    
    return key;
  },
} as const;

/**
 * Type helpers for query keys
 */
export type ContactQueryKey = readonly string[] | readonly (string | object)[];
export type TaskQueryKey = readonly string[] | readonly (string | object)[];
export type DashboardQueryKey = readonly string[] | readonly (string | object)[];
export type EventQueryKey = readonly string[] | readonly (string | object)[];
export type UserQueryKey = readonly string[] | readonly (string | object)[];
export type OrganizationQueryKey = readonly string[] | readonly (string | object)[];

/**
 * Union type of all possible query keys
 */
export type AllQueryKeys = 
  | ContactQueryKey 
  | TaskQueryKey 
  | DashboardQueryKey 
  | EventQueryKey 
  | UserQueryKey 
  | OrganizationQueryKey;