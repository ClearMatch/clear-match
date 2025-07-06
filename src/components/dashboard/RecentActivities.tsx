"use client";

import { Calendar, Mail, Phone } from "lucide-react";
import { RecentActivity } from "./Types";

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

interface ActivityItemProps {
  activity: RecentActivity;
  isLast: boolean;
}

const ActivityIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap = {
    email: Mail,
    call: Phone,
    default: Calendar,
  };

  const Icon = iconMap[type as keyof typeof iconMap] || iconMap.default;

  return (
    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
      <Icon className="h-5 w-5 text-gray-500" />
    </span>
  );
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isLast }) => {
  return (
    <li>
      <div className="relative pb-8">
        {!isLast && (
          <span
            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <div className="relative flex space-x-3">
          <div>
            <ActivityIcon type={activity.type} />
          </div>
          <div className="min-w-0 flex-1">
            <div>
              <div className="text-sm text-gray-500">
                <a href="#" className="font-medium text-gray-900">
                  {activity.contactName}
                </a>{" "}
                {activity.description}
              </div>
              <p className="mt-0.5 text-sm text-gray-500">
                {new Date(activity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
}) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activities
        </h2>
        <div className="flow-root">
          {activities.length > 0 ? (
            <ul className="-mb-8">
              {activities.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === activities.length - 1}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No recent activities
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
