export interface DashboardStats {
  totalCandidates: number;
  totalClients: number;
  activeSearching: number;
  recentActivities: number;
  pendingActions: number;
}

export interface RecommendedAction {
  id: string;
  candidateId: string;
  candidateName: string;
  actionType: string;
  reason: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  type: "candidate" | "client" | "both";
}

export interface RecentActivity {
  id: string;
  candidateId: string;
  candidateName: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface ActivityWithCandidate {
  id: string;
  type: string;
  description: string;
  created_at: string;
  candidates: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}
