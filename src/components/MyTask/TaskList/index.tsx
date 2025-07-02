"use client";
import DataTable from "@/components/ui/DataTable";
import { Column } from "@/components/ui/DataTable/Types";
import { useOpenable } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { Loader } from "lucide-react";
import DeleteTask from "../DeleteTask";
import {
  ActivityWithRelations,
  getFullName,
  getPriorityLabel,
} from "../Services/Types";
import Actions from "./Actions";
import TaskStatus from "./TaskStatus";

interface TaskListProps {
  tasks: ActivityWithRelations[];
  loading: boolean;
  isSearching: boolean;
  hasNoResults: boolean;
}

function TaskList({
  tasks,
  loading,
  isSearching,
  hasNoResults,
}: TaskListProps) {
  const { isOpen, onClose } = useOpenable();

  const taskColumns: Column<ActivityWithRelations>[] = [
    {
      key: "description",
      header: "Title",
      render: (row) => <span className="text-sm">{row.description}</span>,
    },
    {
      key: "due_date",
      header: "Due Date",
      render: (row) => (
        <span className="text-sm">{formatDate(row.due_date)}</span>
      ),
    },
    {
      key: "candidate_id",
      header: "Assigned To",
      render: (row) => {
        const { first_name, last_name } = row.candidates || {};
        return (
          <span className="text-sm">{getFullName(first_name, last_name)}</span>
        );
      },
    },
    {
      key: "created_by",
      header: "Created By",
      render: (row) => {
        const { first_name, last_name } = row.profiles || {};
        return (
          <span className="text-sm">{getFullName(first_name, last_name)}</span>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <span className="text-sm">{row.type}</span>,
    },
    {
      key: "priority",
      header: "Priority Level",
      render: (row) => (
        <span className="text-sm">{getPriorityLabel(row.priority)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <TaskStatus status={row.status} id={row.id} />,
    },
    {
      key: "created_at",
      header: "Created At",
      render: (row) => (
        <span className="text-sm">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  if (loading || isSearching) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin h-6 w-6 text-indigo-600" />
        <span className="ml-2 text-sm text-gray-600">
          {isSearching ? "Searching..." : "Loading tasks..."}
        </span>
      </div>
    );
  }

  if (hasNoResults) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No tasks found matching your search criteria
        </p>
      </div>
    );
  }

  return (
    <div>
      <DeleteTask isOpen={isOpen} onClose={onClose} />
      {tasks?.length && (
        <DataTable
          columns={taskColumns}
          data={tasks}
          rowKey="id"
          hideHeaderCheckBox
          hideRowCheckBox
          renderAction={(row) => <Actions id={row.id} />}
        />
      )}
    </div>
  );
}

export default TaskList;
