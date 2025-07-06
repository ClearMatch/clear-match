"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskList from "@/components/MyTask/TaskList";
import { ActivityWithRelations } from "@/components/MyTask/Services/Types";
import { Plus } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import AddTaskForm from "./AddTaskForm";
import { fetchTasksByCandidate } from "./tasksService";

interface TasksTabProps {
  candidateId: string;
  candidateName?: string;
}

function TasksTab({ candidateId, candidateName = "Contact" }: TasksTabProps) {
  const [showAddTask, setShowAddTask] = useState(false);

  const {
    data: tasks = [],
    isLoading,
    error,
    mutate,
  } = useSWR<ActivityWithRelations[]>(
    candidateId ? ["candidate-tasks", candidateId] : null,
    () => fetchTasksByCandidate(candidateId)
  );

  const handleAddTask = () => {
    setShowAddTask(true);
  };

  const handleTaskAdded = () => {
    setShowAddTask(false);
    mutate(); // Refresh the tasks list
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Related Tasks ({tasks.length})
        </h3>
        <Button 
          onClick={handleAddTask} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      <TaskList
        tasks={tasks}
        loading={isLoading}
        isSearching={false}
        hasNoResults={!isLoading && tasks.length === 0}
      />

      {error && (
        <div className="text-center py-4">
          <p className="text-red-500">Error loading tasks: {error.message}</p>
        </div>
      )}

      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl p-0">
          <AddTaskForm
            candidateId={candidateId}
            candidateName={candidateName}
            onSuccess={handleTaskAdded}
            onCancel={() => setShowAddTask(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TasksTab;