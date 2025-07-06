export interface DashboardStats {
  totalContacts: number;
  totalClients: number;
  activeSearching: number;
  recentActivities: number;
  pendingActions: number;
}

export interface RecommendedAction {
  id: string;
  contactId: string;
  contactName: string;
  actionType: string;
  reason: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  type: "contact" | "client" | "both";
}

export interface RecentActivity {
  id: string;
  contactId: string;
  contactName: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface ActivityWithContact {
  id: string;
  type: string;
  description: string;
  created_at: string;
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}
