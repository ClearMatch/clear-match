"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { RecentActivities } from "./dashboard/RecentActivities";
import { RecommendedActions } from "./dashboard/RecommendedActions";
import { StatsGrid } from "./dashboard/StatsGrid";
import { useDashboard } from "./dashboard/useDashboard";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
}) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="text-red-600 mb-4">
      <p className="text-lg font-medium">Error loading dashboard</p>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useDashboard(user?.id);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardHeader
        title="Dashboard"
        subtitle="Overview of your candidate pipeline and recommended actions"
      />

      <StatsGrid stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecommendedActions actions={data.recommendedActions} />
        <RecentActivities activities={data.recentActivities} />
      </div>
    </div>
  );
}
