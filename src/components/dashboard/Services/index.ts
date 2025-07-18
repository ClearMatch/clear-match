import { supabase } from "@/lib/supabase";
import {
  format,
  isToday,
  isThisWeek,
  isThisMonth,
  addMonths,
  isAfter,
  isBefore,
} from "date-fns";
import { ActivityWithRelations } from "@/components/MyTask/Services/Types";

export interface DashboardStats {
  totalContacts: number;
  totalClients: number;
  activeSearching: number;
  recentActivities: number;
  pendingActions: number;
}

export interface RecentActivity {
  id: string;
  contactName: string;
  contactId: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface RecommendedAction {
  id: string;
  contactId: string;
  contactName: string;
  actionType: string;
  reason: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  type: "contact" | "client" | "both";
}

export interface TimelineTask {
  id: string;
  description: string;
  priority: number;
  due_date: string;
  status: string;
  subject: string | null;
  contact_name?: string;
}

export interface TimelineGroup {
  period: string;
  count: number;
  tasks: TimelineTask[];
}

export interface TimelineData {
  today: TimelineGroup;
  nextWeek: TimelineGroup;
  oneMonth: TimelineGroup;
  twoMonths: TimelineGroup;
  threeMonths: TimelineGroup;
}

export interface TaskPriorityCount {
  priority: number;
  count: number;
  label: string;
}

export interface ProfileGroup {
  scoreRange: string;
  count: number;
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    engagement_score: number;
  }>;
}

export interface ProfileData {
  groups: ProfileGroup[];
  totalContacts: number;
}

export interface UnifiedDashboardData {
  stats: DashboardStats;
  timeline: TimelineData;
  taskPriority: TaskPriorityCount[];
  profileData: ProfileData;
  recentActivities: RecentActivity[];
  recommendedActions: RecommendedAction[];
}

export const getPriorityLabel = (priority: number): string => {
  switch (priority) {
    case 4:
      return "Critical";
    case 3:
      return "High";
    case 2:
      return "Medium";
    case 1:
    default:
      return "Low";
  }
};

export const getPriorityColor = (priority: number): string => {
  switch (priority) {
    case 4:
      return "bg-[#FF6F6F]";
    case 3:
      return "bg-[#FFBD59]";
    case 2:
      return "bg-[#FFFF4D]";
    case 1:
    default:
      return "bg-[#D4F1D4]";
  }
};

const fetchUserProfile = async (userId: string) => {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (error || !profiles?.organization_id) {
    throw new Error("Could not fetch user profile or organization");
  }

  return profiles;
};

const fetchContactsData = async (organizationId: string) => {
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, contact_type, is_active_looking, engagement_score, updated_at"
    )
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  const contactsOnly =
    contacts?.filter((c) => c.contact_type === "candidate") || [];
  const clientsOnly =
    contacts?.filter((c) => c.contact_type === "client") || [];
  const bothOnly = contacts?.filter((c) => c.contact_type === "both") || [];
  const contactsAndBoth =
    contacts?.filter(
      (c) => c.contact_type === "candidate" || c.contact_type === "both"
    ) || [];
  const activeSearching =
    contacts?.filter(
      (c) =>
        (c.contact_type === "candidate" || c.contact_type === "both") &&
        c.is_active_looking === true
    ) || [];

  return {
    allContacts: contacts || [],
    contactsOnly,
    clientsOnly,
    bothOnly,
    contactsAndBoth,
    activeSearching,
  };
};

const fetchTimelineData = async (
  organizationId: string
): Promise<TimelineData> => {
  const { data: tasks, error } = await supabase
    .from("activities")
    .select(
      `
      id,
      description,
      priority,
      due_date,
      status,
      subject,
      contacts:contact_id (
        first_name,
        last_name
      )
    `
    )
    .eq("organization_id", organizationId)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true })
    .order("priority", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch timeline data: ${error.message}`);
  }

  const now = new Date();
  const oneMonthFromNow = addMonths(now, 1);
  const twoMonthsFromNow = addMonths(now, 2);
  const threeMonthsFromNow = addMonths(now, 3);

  const timelineData: TimelineData = {
    today: { period: "Today", count: 0, tasks: [] },
    nextWeek: { period: "Next Week", count: 0, tasks: [] },
    oneMonth: { period: "1 Month", count: 0, tasks: [] },
    twoMonths: { period: "2 Months", count: 0, tasks: [] },
    threeMonths: { period: "3 Months", count: 0, tasks: [] },
  };

  tasks?.forEach((task: any) => {
    const dueDate = new Date(task.due_date);
    const timelineTask: TimelineTask = {
      id: task.id,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      status: task.status,
      subject: task.subject,
      contact_name: task.contacts
        ? `${task.contacts.first_name} ${task.contacts.last_name}`
        : undefined,
    };

    if (isToday(dueDate)) {
      timelineData.today.tasks.push(timelineTask);
    } else if (isThisWeek(dueDate)) {
      timelineData.nextWeek.tasks.push(timelineTask);
    } else if (
      isThisMonth(dueDate) ||
      (isAfter(dueDate, now) && isBefore(dueDate, oneMonthFromNow))
    ) {
      timelineData.oneMonth.tasks.push(timelineTask);
    } else if (
      isAfter(dueDate, oneMonthFromNow) &&
      isBefore(dueDate, twoMonthsFromNow)
    ) {
      timelineData.twoMonths.tasks.push(timelineTask);
    } else if (
      isAfter(dueDate, twoMonthsFromNow) &&
      isBefore(dueDate, threeMonthsFromNow)
    ) {
      timelineData.threeMonths.tasks.push(timelineTask);
    }
  });

  Object.values(timelineData).forEach((group) => {
    group.tasks.sort(
      (a: TimelineTask, b: TimelineTask) => b.priority - a.priority
    );
    group.count = group.tasks.length;
  });

  return timelineData;
};

const fetchTaskPriorityData = async (
  organizationId: string
): Promise<TaskPriorityCount[]> => {
  const { data: tasks, error } = await supabase
    .from("activities")
    .select("priority")
    .eq("organization_id", organizationId)
    .in("status", ["todo", "in-progress"]);

  if (error) {
    throw new Error(`Failed to fetch task priority data: ${error.message}`);
  }

  const priorityCounts = new Map<number, number>();
  tasks?.forEach((task) => {
    const priority = task.priority || 1;
    priorityCounts.set(priority, (priorityCounts.get(priority) || 0) + 1);
  });

  return [4, 3, 2, 1].map((priority) => ({
    priority,
    count: priorityCounts.get(priority) || 0,
    label: getPriorityLabel(priority),
  }));
};

const fetchProfileData = async (
  organizationId: string
): Promise<ProfileData> => {
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, engagement_score")
    .eq("organization_id", organizationId)
    .not("engagement_score", "is", null);

  if (error) {
    throw new Error(`Failed to fetch profile data: ${error.message}`);
  }

  const groups: ProfileGroup[] = [
    { scoreRange: "8-10", count: 0, contacts: [] },
    { scoreRange: "6-7", count: 0, contacts: [] },
    { scoreRange: "4-5", count: 0, contacts: [] },
    { scoreRange: "1-3", count: 0, contacts: [] },
  ];

  contacts?.forEach((contact) => {
    const score = contact.engagement_score || 0;
    let groupIndex = 3; // Default to Profile D (1-3)

    if (score >= 8 && score <= 10) groupIndex = 0; // Profile A: 8-10
    else if (score >= 6 && score <= 7) groupIndex = 1; // Profile B: 6-7
    else if (score >= 4 && score <= 5) groupIndex = 2; // Profile C: 4-5
    else if (score >= 1 && score <= 3) groupIndex = 3; // Profile D: 1-3

    const group = groups[groupIndex];
    if (group) {
      group.contacts.push({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        engagement_score: contact.engagement_score,
      });
      group.count = group.contacts.length;
    }
  });

  return {
    groups,
    totalContacts: contacts?.length || 0,
  };
};

const fetchRecentActivities = async (
  organizationId: string
): Promise<RecentActivity[]> => {
  const { data: activities, error } = await supabase
    .from("activities")
    .select(
      `
      id,
      type,
      description,
      created_at,
      contact_id,
      contacts:contact_id (
        first_name,
        last_name
      )
    `
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Failed to fetch recent activities: ${error.message}`);
  }

  return (
    activities?.map((activity: any) => ({
      id: activity.id,
      contactName: activity.contacts
        ? `${activity.contacts.first_name} ${activity.contacts.last_name}`
        : "Unknown Contact",
      contactId: activity.contact_id || "",
      type: activity.type,
      description: activity.description,
      createdAt: activity.created_at,
    })) || []
  );
};

const generateRecommendedActions = (
  contactsData: any,
  recentActivities: RecentActivity[]
): RecommendedAction[] => {
  const actions: RecommendedAction[] = [];

  const contactActions = contactsData.contactsOnly
    .slice(0, 5)
    .map((contact: any, index: number) => ({
      id: contact.id,
      contactId: contact.id,
      contactName: `${contact.first_name} ${contact.last_name}`,
      actionType: "follow_up",
      reason: contact.is_active_looking
        ? "Active job seeker - schedule interview"
        : "No recent activity - follow up needed",
      priority: contact.is_active_looking ? "high" : "medium",
      dueDate: new Date(Date.now() + 86400000 * (index + 1)).toISOString(),
      type: "contact" as const,
    }));

  const clientActions = contactsData.clientsOnly
    .slice(0, 3)
    .map((client: any, index: number) => ({
      id: client.id,
      contactId: client.id,
      contactName: `${client.first_name} ${client.last_name}`,
      actionType: "follow_up",
      reason: "Check for new job openings and requirements",
      priority: "medium" as const,
      dueDate: new Date(
        Date.now() + 86400000 * (index + contactActions.length + 1)
      ).toISOString(),
      type: "client" as const,
    }));

  actions.push(...contactActions, ...clientActions);

  return actions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

export const fetchUnifiedDashboardData = async (
  userId: string
): Promise<UnifiedDashboardData> => {
  const profile = await fetchUserProfile(userId);
  const organizationId = profile.organization_id;

  const [
    contactsData,
    timelineData,
    taskPriorityData,
    profileData,
    recentActivities,
  ] = await Promise.all([
    fetchContactsData(organizationId),
    fetchTimelineData(organizationId),
    fetchTaskPriorityData(organizationId),
    fetchProfileData(organizationId),
    fetchRecentActivities(organizationId),
  ]);

  const recommendedActions = generateRecommendedActions(
    contactsData,
    recentActivities
  );

  const stats: DashboardStats = {
    totalContacts: contactsData.contactsAndBoth.length,
    totalClients: contactsData.clientsOnly.length,
    activeSearching: contactsData.activeSearching.length,
    recentActivities: recentActivities.length,
    pendingActions: recommendedActions.length,
  };

  return {
    stats,
    timeline: timelineData,
    taskPriority: taskPriorityData,
    profileData,
    recentActivities,
    recommendedActions,
  };
};

export const unifiedDashboardService = {
  fetchUnifiedDashboardData,
  fetchUserProfile,
  fetchContactsData,
  fetchTimelineData,
  fetchTaskPriorityData,
  fetchProfileData,
  fetchRecentActivities,
  generateRecommendedActions,
  getPriorityLabel,
  getPriorityColor,
};
