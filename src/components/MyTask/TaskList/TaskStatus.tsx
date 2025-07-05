"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { updateActivityStatus } from "../Services";
import { statusOptions } from "../Services/Types";
import { CACHE_KEYS } from "../Common/cacheKeys";

// Status color mapping - moved outside component to prevent recreation
const STATUS_COLORS = {
  "todo": "bg-red-100 border-red-300 text-red-800",
  "in-progress": "bg-yellow-100 border-yellow-300 text-yellow-800",
  "done": "bg-green-100 border-green-300 text-green-800",
  "default": "bg-gray-100 border-gray-300 text-gray-800"
} as const;

// Status text alternatives for accessibility
const STATUS_TEXT = {
  "todo": "To Do (High Priority)",
  "in-progress": "In Progress (Medium Priority)", 
  "done": "Completed (Low Priority)"
} as const;

interface Props {
  status: string;
  id: string;
}

const TaskStatus = ({ status, id }: Props) => {
  const [taskStatus, setTaskStatus] = useState<string>(status);
  const [previousStatus, setPreviousStatus] = useState<string>(status);

  const { trigger: updateStatus, isMutating } = useSWRMutation(
    CACHE_KEYS.UPDATE_ACTIVITY(id),
    async (_, { arg }: { arg: string }) => {
      return updateActivityStatus(id, arg);
    },
    {
      onSuccess: () => {
        toast.success("Task status updated successfully");
        mutate(CACHE_KEYS.ACTIVITIES_WITH_RELATIONS);
      },
      onError: (error) => {
        console.error("Status update error:", error);
        toast.error("Failed to update task status");
        // Rollback to previous status, not initial prop
        setTaskStatus(previousStatus);
      },
    }
  );

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === taskStatus) return;
    setPreviousStatus(taskStatus); // Store current status before change
    setTaskStatus(newStatus);
    updateStatus(newStatus);
  };

  // Memoize color calculation
  const statusColor = useMemo(() => {
    return STATUS_COLORS[taskStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
  }, [taskStatus]);

  // Get accessible status text
  const statusText = useMemo(() => {
    return STATUS_TEXT[taskStatus as keyof typeof STATUS_TEXT] || taskStatus;
  }, [taskStatus]);

  return (
    <div className="relative">
      <Select
        onValueChange={handleStatusChange}
        value={taskStatus}
        disabled={isMutating}
      >
        <SelectTrigger
          className={`rounded-lg p-2 h-8 border-2 ${statusColor}`}
          aria-label={`Change task status. Current status: ${statusText}`}
        >
          <div className="flex items-center justify-between w-full">
            <SelectValue placeholder="Select status" aria-label={statusText} />
            {isMutating && (
              <Loader2 className="h-3 w-3 animate-spin ml-2 text-indigo-500" />
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white">
          {statusOptions.map((option) => (
            <SelectItem 
              className="p-2" 
              key={option.value} 
              value={option.value}
              aria-label={`Set status to ${option.label}`}
            >
              <span className="sr-only">Status:</span>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskStatus;
