import { formatDate } from "@/lib/utils";
import { AlertCircle, Calendar } from "lucide-react";
import { RecentActivity } from "../interfaces";

interface RecentActivityListProps {
  recentActivities: RecentActivity[];
}

export default function RecentActivityList({
  recentActivities,
}: RecentActivityListProps) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Recent Activity
      </h4>

      {recentActivities.length > 0 ? (
        <div className="space-y-2">
          {recentActivities.slice(0, 3).map((activity) => (
            <div
              key={activity.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {activity.type.replace("-", " ")}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(activity.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {activity.description}
              </p>
            </div>
          ))}

          {recentActivities.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              +{recentActivities.length - 3} more activities
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No recent activities found</p>
        </div>
      )}
    </div>
  );
}
