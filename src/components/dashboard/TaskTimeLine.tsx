import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTimelineData } from "./hooks/useUnifiedDashboard";
import { getPriorityLabel, getPriorityColor, TimelineTask } from "./Services";
import { cn } from "@/lib/utils";

interface TaskTimeLineProps {
  userId: string;
}

function TaskTimeLine({ userId }: TaskTimeLineProps) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const { timeline, isLoading, error } = useTimelineData(userId);

  const timelineGroups = timeline
    ? [
        timeline.today,
        timeline.nextWeek,
        timeline.oneMonth,
        timeline.twoMonths,
        timeline.threeMonths,
      ]
    : [];

  const formatTaskText = (task: TimelineTask): string => {
    const priorityLabel = getPriorityLabel(task.priority);
    const contactInfo = task.contact_name ? ` - ${task.contact_name}` : "";
    const subjectInfo = task.subject ? ` (${task.subject})` : "";
    return `[${priorityLabel}] ${task.description}${contactInfo}${subjectInfo}`;
  };
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between w-full mb-6">
          <h2 className="text-xl font-medium text-gray-900">Timeline</h2>
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-5 divide-x divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="px-4">
              <div className="text-center py-2 mb-6">
                <div className="text-xs text-gray-500 mb-2">Loading...</div>
                <div className="text-3xl font-light text-gray-900">-</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between w-full mb-6">
          <h2 className="text-xl font-medium text-gray-900">Timeline</h2>
          <div className="w-5 h-5 text-red-500">⚠</div>
        </div>
        <div className="text-center py-8 text-red-600">
          Error loading timeline data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <button
        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
        className="flex items-center justify-between w-full mb-6 hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
      >
        <h2 className="text-xl font-medium text-gray-900">Timeline</h2>
        {isTimelineOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <div className="grid grid-cols-5 divide-x divide-gray-200">
        {timelineGroups.map((group, index) => (
          <div key={index} className="px-4">
            {/* Timeline period and number */}
            <div className="text-center py-2 mb-6">
              <div className="text-xs text-gray-500 mb-2">{group.period}</div>
              <div className="text-3xl font-light text-gray-900">
                {group.count}
              </div>
            </div>

            {/* Collapsible Content for each column */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isTimelineOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {group.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="flex items-start gap-3">
                    <div
                      className={cn(
                        `w-6 h-6 rounded-full mt-1.5`,
                        getPriorityColor(task.priority)
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 block">
                        {formatTaskText(task)}
                      </span>
                      {task.status !== "todo" && (
                        <span className="text-xs text-gray-500 capitalize">
                          {task.status.replace("-", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {group.tasks.length === 0 && (
                  <div className="text-center py-4">
                    <span className="text-sm text-gray-400">No tasks</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskTimeLine;
