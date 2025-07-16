"use client";

import { useRouter } from "next/navigation";
import { useTaskPriorityData } from "./hooks/useUnifiedDashboard";
import { getPriorityColor } from "./Services";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskPriorityProps {
  userId: string;
}

function TaskPriority({ userId }: TaskPriorityProps) {
  const router = useRouter();
  const { taskPriority, isLoading, error } = useTaskPriorityData(userId);

  const priorityCards =
    taskPriority?.map((item) => ({
      label: item.label,
      priority: item.priority,
      count: item.count,
      color: getPriorityColor(item.priority),
    })) || [];

  const handleCardClick = (priority: number) => {
    // Navigate to task page with priority filter in URL
    const searchParams = new URLSearchParams();
    searchParams.set("priority", priority.toString());
    router.push(`/task?${searchParams.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load priority data
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {priorityCards.map((card, index) => (
        <div
          key={index}
          onClick={() => handleCardClick(card.priority)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-2.5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(`w-5 h-5 rounded-full`, card.color)} />
            <span className="text-lg font-normal text-gray-700">
              {card.label}
            </span>
          </div>
          <div className="text-4xl font-thin text-gray-900">{card.count}</div>
        </div>
      ))}
    </div>
  );
}

export default TaskPriority;
