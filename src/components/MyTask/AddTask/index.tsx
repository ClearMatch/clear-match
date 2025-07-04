"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AddTaskForm } from "../Common/AddTaskForm";
import { useTaskData } from "../Services/useTaskData";

function AddTask() {
  const { candidates, organizations, users, events, isLoading } = useTaskData();

  if (isLoading) {
    return (
      <div className="p-4 bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <AddTaskForm
        candidates={candidates}
        organizations={organizations}
        users={users}
        events={events}
        isLoading={isLoading}
      />
    </div>
  );
}

export default AddTask;
