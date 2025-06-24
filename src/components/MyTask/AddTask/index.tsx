import React from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTaskData } from "../Services/useTaskData";
import { AddTaskForm } from "../Common/AddTaskForm";

function AddTask() {
  const { candidates, organizations, users, events, jobPostings, isLoading } =
    useTaskData();

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
        jobPostings={jobPostings}
      />
    </div>
  );
}

export default AddTask;
