"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { updateActivityStatus } from "../Services";
import { statusOptions } from "../Services/Types";

interface Props {
  status: string;
  id: string;
}

const TaskStatus = ({ status, id }: Props) => {
  const [taskStatus, setTaskStatus] = useState<string>(status);

  const { trigger: updateStatus, isMutating } = useSWRMutation(
    `update-activity-${id}`,
    async (_, { arg }: { arg: string }) => {
      return updateActivityStatus(id, arg);
    },
    {
      onSuccess: () => {
        toast.success("Task status updated successfully");
        mutate("activitiesWithRelations");
      },
      onError: (error) => {
        toast.error("Failed to update task status");
        setTaskStatus(status);
      },
    }
  );

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === taskStatus) return;
    setTaskStatus(newStatus);
    updateStatus(newStatus);
  };

  return (
    <div className="relative">
      <Select
        onValueChange={handleStatusChange}
        value={taskStatus}
        disabled={isMutating}
      >
        <SelectTrigger
          className={"rounded-lg p-2 h-8 border-2 border-indigo-200 bg-white"}
        >
          <div className="flex items-center justify-between w-full">
            <SelectValue placeholder="Select status" />
            {isMutating && (
              <Loader2 className="h-3 w-3 animate-spin ml-2 text-indigo-500" />
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white">
          {statusOptions.map((option) => (
            <SelectItem className="p-2" key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskStatus;
