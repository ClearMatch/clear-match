"use client";

import type { LucideIcon } from "lucide-react";
import { Bell, Briefcase, Clock, UserCheck, Users } from "lucide-react";
import { DashboardStats } from "./Types";

interface StatsGridProps {
  stats: DashboardStats;
}

interface StatItemProps {
  icon: LucideIcon;
  label: string;
  value: number;
  iconColor?: string;
}

const StatItem: React.FC<StatItemProps> = ({
  icon: Icon,
  label,
  value,
  iconColor = "text-gray-400",
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {label}
            </dt>
            <dd className="text-lg font-semibold text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const statItems = [
    {
      icon: Users,
      label: "Total Candidates",
      value: stats.totalCandidates,
    },
    {
      icon: UserCheck,
      label: "Total Clients",
      value: stats.totalClients,
    },
    {
      icon: Briefcase,
      label: "Total Job Seekers",
      value: stats.activeSearching,
    },
    {
      icon: Clock,
      label: "Recent Activities",
      value: stats.recentActivities,
    },
    {
      icon: Bell,
      label: "Pending Actions",
      value: stats.pendingActions,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
      {statItems.map((item) => (
        <StatItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  );
};
