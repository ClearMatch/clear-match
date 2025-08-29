/**
 * Chat Database Functions
 * Functions that the AI chatbot can call to query and manipulate the database
 */

import { createSupabaseServerClient } from '@/lib/api-utils';
import type { Contact } from '@/components/Contact/ContactList/Types';
import type { ActivityData } from '@/components/MyTask/Services/Types';

// Result formatting helpers for user-friendly responses
export interface FormattedResult {
  success: boolean;
  message: string;
  data?: any;
  link?: string;
}

function formatActivityResult(activity: ActivityData): FormattedResult {
  return {
    success: true,
    message: `✅ ${activity.type === 'call' ? 'Call' : activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} task created successfully! "${activity.subject}"`,
    data: {
      id: activity.id,
      subject: activity.subject,
      type: activity.type,
      priority: activity.priority,
      dueDate: activity.due_date,
      status: activity.status
    },
    link: `/task/show/${activity.id}`
  };
}

function formatContactSearchResult(contacts: Contact[], searchParams: any): FormattedResult {
  const filters = [];
  if (searchParams.searchTerm) filters.push(`term "${searchParams.searchTerm}"`);
  if (searchParams.techStack?.length) filters.push(`tech stack: ${searchParams.techStack.join(', ')}`);
  if (searchParams.company) filters.push(`company "${searchParams.company}"`);
  if (searchParams.engagementScoreMin) filters.push(`engagement score ≥${searchParams.engagementScoreMin}`);
  if (searchParams.yearsExperienceMin) filters.push(`experience ≥${searchParams.yearsExperienceMin} years`);
  if (searchParams.isActiveLooking !== undefined) filters.push(`${searchParams.isActiveLooking ? 'actively looking' : 'not actively looking'}`);

  const filterText = filters.length ? ` matching ${filters.join(', ')}` : '';
  
  return {
    success: true,
    message: `Found ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}${filterText}`,
    data: contacts.map(c => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      company: c.current_company,
      title: c.current_job_title,
      engagementScore: c.engagement_score,
      techStack: c.tech_stack
    }))
  };
}

function formatRecentActivitiesResult(activities: ActivityData[], limit?: number): FormattedResult {
  if (activities.length === 0) {
    return {
      success: true,
      message: "You don't have any recent activities.",
      data: []
    };
  }
  
  const mostRecent = activities[0];
  if (!mostRecent) {
    return {
      success: true,
      message: "You don't have any recent activities.",
      data: []
    };
  }
  
  return {
    success: true,
    message: `You have ${activities.length} recent activit${activities.length !== 1 ? 'ies' : 'y'}`,
    data: {
      mostRecent: {
        id: mostRecent.id,
        subject: mostRecent.subject,
        description: mostRecent.description,
        type: mostRecent.type,
        status: mostRecent.status,
        dueDate: mostRecent.due_date,
        createdAt: mostRecent.created_at
      },
      total: activities.length,
      allActivities: activities.map(a => ({
        id: a.id,
        subject: a.subject,
        description: a.description,
        type: a.type,
        status: a.status
      }))
    }
  };
}

// Type definitions for function parameters
export interface SearchContactsParams {
  searchTerm?: string;
  techStack?: string[];
  company?: string;
  engagementScoreMin?: number;
  yearsExperienceMin?: number;
  isActiveLooking?: boolean;
  limit?: number;
}

export interface CreateActivityParams {
  contactId?: string;
  type: 
    // Original types from database constraint
    | 'none' | 'email' | 'call' | 'video' | 'text'
    // New event types from GitHub issue #138
    | 'new-job-posting' | 'open-to-work' | 'laid-off' | 'interview'
    | 'funding-news' | 'company-layoffs' | 'birthday' | 'meeting'
    | 'm-and-a-activity' | 'email-reply-received' | 'follow-up'
    | 'holiday' | 'personal-interest-tag' | 'dormant-status';
  subject: string;
  description: string;
  dueDate?: string;
  priority?: number; // Low=1, Medium=2, High=3, Critical=4
}

export interface GetContactStatsParams {
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Search contacts based on various criteria
 */
export async function searchContacts(params: SearchContactsParams): Promise<FormattedResult> {
  const {
    searchTerm,
    techStack,
    company,
    engagementScoreMin,
    yearsExperienceMin,
    isActiveLooking,
    limit = 20
  } = params;

  // Use service role client for server-side operations
  const supabase = await createSupabaseServerClient(true);

  let query = supabase
    .from('contacts')
    .select(`
      *,
      tags:contact_tags (
        tags (
          id,
          name,
          color
        )
      )
    `)
    .order('updated_at', { ascending: false })
    .limit(limit);

  // Apply search term filter
  if (searchTerm && searchTerm.trim()) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,current_company.ilike.%${searchTerm}%,current_job_title.ilike.%${searchTerm}%`
    );
  }

  // Apply tech stack filter
  if (techStack && techStack.length > 0) {
    // Use PostgreSQL array contains operator
    const techStackConditions = techStack.map(skill => 
      `tech_stack.cs.{"${skill}"}`
    );
    if (techStackConditions.length === 1) {
      query = query.filter('tech_stack', 'cs', `{"${techStack[0]}"}`);
    } else {
      query = query.or(techStackConditions.join(','));
    }
  }

  // Apply company filter
  if (company) {
    query = query.ilike('current_company', `%${company}%`);
  }

  // Apply engagement score filter
  if (engagementScoreMin) {
    query = query.gte('engagement_score', engagementScoreMin);
  }

  // Apply years of experience filter (assuming it's stored as a number)
  if (yearsExperienceMin) {
    query = query.gte('years_of_experience', yearsExperienceMin);
  }

  // Apply active looking filter
  if (isActiveLooking !== undefined) {
    query = query.eq('is_active_looking', isActiveLooking);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to search contacts: ${error.message}`);
  return formatContactSearchResult(data || [], params);
}

/**
 * Get detailed information about a specific contact
 */
export async function getContactById(contactId: string): Promise<Contact | null> {
  // Use service role client for server-side operations
  const supabase = await createSupabaseServerClient(true);

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      tags:contact_tags (
        tags (
          id,
          name,
          color
        )
      )
    `)
    .eq('id', contactId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw new Error(`Failed to get contact: ${error.message}`);
  }
  return data;
}

/**
 * Create a new activity/task
 */
export async function createActivity(params: CreateActivityParams, userId: string): Promise<FormattedResult> {
  const {
    contactId,
    type,
    subject,
    description,
    dueDate,
    priority = 2
  } = params;

  // Validate required parameters (should be handled by AI tool description, but keep as safety net)
  if (!type) {
    throw new Error('Activity type is required and cannot be null or empty');
  }
  
  if (!subject?.trim()) {
    throw new Error('Activity subject is required and cannot be empty');
  }
  
  if (!description?.trim()) {
    throw new Error('Activity description is required and cannot be empty');
  }

  // Use service role client for server-side operations
  const supabase = await createSupabaseServerClient(true);

  // Get the user's organization ID from their profile
  const { data: orgData, error: orgError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (orgError || !orgData?.organization_id) {
    throw new Error(`Failed to get user organization: ${orgError?.message || 'No organization found'}`);
  }

  const activityData = {
    contact_id: contactId || null,
    organization_id: orgData.organization_id,
    type,
    subject,
    description,
    content: description, // Use description as content
    due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week from now
    priority,
    status: 'todo',
    created_by: userId,
    assigned_to: userId,
    metadata: {}
  };

  const { data, error } = await supabase
    .from('activities')
    .insert([activityData])
    .select()
    .single();

  if (error) throw new Error(`Failed to create activity: ${error.message}`);
  return formatActivityResult(data);
}

/**
 * Get recent activities for a contact
 */
export async function getContactActivities(contactId: string, limit = 10): Promise<ActivityData[]> {
  // Use service role client for server-side operations
  const supabase = await createSupabaseServerClient(true);

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get contact activities: ${error.message}`);
  return data || [];
}

/**
 * Get contact statistics
 */
export async function getContactStats(params: GetContactStatsParams = {}): Promise<{
  totalContacts: number;
  activeContacts: number;
  averageEngagement: number;
  topCompanies: { company: string; count: number }[];
  topTechStacks: { tech: string; count: number }[];
}> {
  const { timeframe = 'month' } = params;
  
  // Use service role client for server-side operations
  const supabase = await createSupabaseServerClient(true);
  
  // Calculate date range
  const now = new Date();
  const startDate = new Date(now);
  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Get basic stats
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('current_company, tech_stack, engagement_score, is_active_looking, created_at')
    .gte('created_at', startDate.toISOString());

  if (contactsError) throw new Error(`Failed to get contact stats: ${contactsError.message}`);

  const totalContacts = contacts?.length || 0;
  const activeContacts = contacts?.filter(c => c.is_active_looking).length || 0;
  const averageEngagement = contacts?.length ? 
    contacts.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / contacts.length : 0;

  // Calculate top companies
  const companyCount: Record<string, number> = {};
  contacts?.forEach(c => {
    if (c.current_company) {
      companyCount[c.current_company] = (companyCount[c.current_company] || 0) + 1;
    }
  });
  
  const topCompanies = Object.entries(companyCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }));

  // Calculate top tech stacks
  const techCount: Record<string, number> = {};
  contacts?.forEach(c => {
    if (c.tech_stack && Array.isArray(c.tech_stack)) {
      c.tech_stack.forEach((tech: string) => {
        techCount[tech] = (techCount[tech] || 0) + 1;
      });
    }
  });

  const topTechStacks = Object.entries(techCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tech, count]) => ({ tech, count }));

  return {
    totalContacts,
    activeContacts,
    averageEngagement: Math.round(averageEngagement * 10) / 10,
    topCompanies,
    topTechStacks
  };
}

/**
 * Get recent activities (user's tasks)
 */
export async function getRecentActivities(limit = 20): Promise<FormattedResult> {
  // Use service role client for server-side operations
  const supabase = await createSupabaseServerClient(true);

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      contacts (
        id,
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get recent activities: ${error.message}`);
  return formatRecentActivitiesResult(data || [], limit);
}

/**
 * Update activity status
 */
export async function updateActivityStatus(activityId: string, status: 'todo' | 'in-progress' | 'done'): Promise<ActivityData> {
  // Use service role client for server-side operations
  const supabase = await createSupabaseServerClient(true);

  const { data, error } = await supabase
    .from('activities')
    .update({ status })
    .eq('id', activityId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update activity status: ${error.message}`);
  return data;
}

// Export function definitions for the AI
export const chatFunctions = {
  searchContacts: {
    name: 'searchContacts',
    description: 'Search for contacts based on various criteria like name, company, tech stack, engagement score, etc.',
    parameters: {
      type: 'object',
      properties: {
        searchTerm: {
          type: 'string',
          description: 'Search term to match against names, companies, or job titles'
        },
        techStack: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of technologies/skills to search for (e.g., ["Python", "React"])'
        },
        company: {
          type: 'string',
          description: 'Company name to search for'
        },
        engagementScoreMin: {
          type: 'number',
          description: 'Minimum engagement score (1-10)'
        },
        yearsExperienceMin: {
          type: 'number',
          description: 'Minimum years of experience'
        },
        isActiveLooking: {
          type: 'boolean',
          description: 'Whether to filter for actively looking candidates'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)'
        }
      }
    }
  },
  getContactById: {
    name: 'getContactById',
    description: 'Get detailed information about a specific contact by ID',
    parameters: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'The unique ID of the contact'
        }
      },
      required: ['contactId']
    }
  },
  createActivity: {
    name: 'createActivity',
    description: 'Create a new activity or task, optionally associated with a contact',
    parameters: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'ID of the contact this activity is for (optional)'
        },
        type: {
          type: 'string',
          enum: ['follow_up', 'interview', 'call', 'email', 'meeting', 'note'],
          description: 'Type of activity'
        },
        subject: {
          type: 'string',
          description: 'Brief subject/title of the activity'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the activity'
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO format (optional, defaults to 1 week from now)'
        },
        priority: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: 'Priority level: 1=Low, 2=Medium, 3=High, 4=Critical'
        }
      },
      required: ['type', 'subject', 'description']
    }
  },
  getContactActivities: {
    name: 'getContactActivities',
    description: 'Get recent activities/tasks for a specific contact',
    parameters: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          description: 'The ID of the contact'
        },
        limit: {
          type: 'number',
          description: 'Number of activities to retrieve (default: 10)'
        }
      },
      required: ['contactId']
    }
  },
  getContactStats: {
    name: 'getContactStats',
    description: 'Get statistical insights about contacts (total count, engagement, top companies, etc.)',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['week', 'month', 'quarter', 'year'],
          description: 'Timeframe for statistics (default: month)'
        }
      }
    }
  },
  getRecentActivities: {
    name: 'getRecentActivities',
    description: 'Get recent activities/tasks for the current user',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of activities to retrieve (default: 20)'
        }
      }
    }
  },
  updateActivityStatus: {
    name: 'updateActivityStatus',
    description: 'Update the status of an activity/task',
    parameters: {
      type: 'object',
      properties: {
        activityId: {
          type: 'string',
          description: 'The ID of the activity to update'
        },
        status: {
          type: 'string',
          enum: ['todo', 'in-progress', 'done'],
          description: 'New status for the activity'
        }
      },
      required: ['activityId', 'status']
    }
  }
};

// Function execution mapping
export const executeChatFunction = async (
  functionName: string, 
  parameters: any, 
  userId: string
): Promise<any> => {
  switch (functionName) {
    case 'searchContacts':
      return await searchContacts(parameters);
    case 'getContactById':
      return await getContactById(parameters.contactId);
    case 'createActivity':
      return await createActivity(parameters, userId);
    case 'getContactActivities':
      return await getContactActivities(parameters.contactId, parameters.limit);
    case 'getContactStats':
      return await getContactStats(parameters);
    case 'getRecentActivities':
      return await getRecentActivities(parameters.limit);
    case 'updateActivityStatus':
      return await updateActivityStatus(parameters.activityId, parameters.status);
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
};