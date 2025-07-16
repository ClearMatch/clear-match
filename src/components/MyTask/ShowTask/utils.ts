import { EngagementLevel, RecentActivity, SalaryRange } from "./interfaces";

export const getScoreToPriority = (score: number): number => {
  if (score >= 90) return 1;
  if (score >= 60) return 2;
  if (score >= 40) return 3;
  if (score >= 20) return 4;
  if (score >= 10) return 5;
  return 6;
};

export const getPriorityFromScore = (priority: number): number => {
  switch (priority) {
    case 1:
      return 95;
    case 2:
      return 80;
    case 3:
      return 50;
    case 4:
      return 30;
    case 5:
      return 15;
    case 6:
      return 5;
    default:
      return 5;
  }
};

export const getEngagementScore = (
  priority: number,
  contactId?: string | null
): number => {
  if (!contactId) return 1;
  if (priority === 2) return 8;
  const expectedScore = getPriorityFromScore(priority);
  return Math.ceil(Math.sqrt(expectedScore));
};

export const getEventImportanceScore = (
  priority: number,
  eventId?: string | null
): number => {
  if (!eventId) return 1;
  if (priority === 2) return 10;
  const expectedScore = getPriorityFromScore(priority);
  return Math.floor(Math.sqrt(expectedScore));
};

export const getScoreRange = (score: number): string => {
  if (score >= 90) return "90+ range";
  if (score >= 60) return "60-89 range";
  if (score >= 40) return "40-59 range";
  if (score >= 20) return "20-39 range";
  if (score >= 10) return "10-19 range";
  return "0-9 range";
};

export const formatSalaryRange = (salaryRange: SalaryRange | null): string => {
  if (!salaryRange) return "Not specified";

  const { min, max, currency = "USD" } = salaryRange;
  if (min && max) {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  } else if (min) {
    return `${currency} ${min.toLocaleString()}+`;
  } else if (max) {
    return `Up to ${currency} ${max.toLocaleString()}`;
  }

  return "Not specified";
};

export const getEngagementLevel = (
  recentActivities: RecentActivity[]
): EngagementLevel => {
  const recentActivityThreshold = 30;
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - recentActivityThreshold);

  const recentActivitiesCount = recentActivities.filter(
    (activity) => new Date(activity.created_at) > recentDate
  ).length;

  if (recentActivitiesCount >= 3) {
    return {
      level: "High",
      color: "text-green-700 bg-green-50 border-green-200",
      description: "Very active engagement with multiple recent interactions",
    };
  } else if (recentActivitiesCount >= 1) {
    return {
      level: "Medium",
      color: "text-yellow-700 bg-yellow-50 border-yellow-200",
      description: "Moderate engagement with some recent activity",
    };
  } else {
    return {
      level: "Low",
      color: "text-red-700 bg-red-50 border-red-200",
      description: "Limited engagement with few recent interactions",
    };
  }
};
