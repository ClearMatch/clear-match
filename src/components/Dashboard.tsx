"use client";

import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import TaskPriority from "./dashboard/TaskPriority";
import TaskTimeLine from "./dashboard/TaskTimeLine";
import ProfileCard from "./dashboard/ProfileCard";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-normal text-gray-800">
          {format(new Date(), "EEEE MMMM d, yyyy")}
        </h1>
        <TaskPriority userId={user.id} />
        <TaskTimeLine userId={user.id} />
        <ProfileCard />
      </div>
    </div>
  );
}
