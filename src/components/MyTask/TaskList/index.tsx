"use client";
import DataTable from "@/components/ui/DataTable";
import { Column } from "@/components/ui/DataTable/Types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOpenable } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import DeleteTask from "../DeleteTask";
import {
  ActivityWithRelations,
  getFullName,
  getPriorityLabel,
} from "../Services/Types";
import Actions from "./Actions";
import TaskStatus from "./TaskStatus";
import { supabase } from "@/lib/supabase";

interface TaskListProps {
  tasks: ActivityWithRelations[];
  loading: boolean;
  isValidating: boolean;
  isFetchingNextPage: boolean;
  isSearching: boolean;
  hasMoreData: boolean;
  fetchMoreData: () => void;
  error: any;
  totalCount: number;
  hasNoResults: boolean;
}

function TaskList({
  tasks,
  loading,
  isValidating,
  isFetchingNextPage,
  isSearching,
  hasMoreData,
  fetchMoreData,
  error,
  totalCount,
  hasNoResults,
}: TaskListProps) {
  const { isOpen, onClose, onOpen } = useOpenable();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
    onOpen();
  };

  const handleDeleteClose = () => {
    setTaskToDelete(null);
    onClose();
  };

  const taskColumns: Column<ActivityWithRelations>[] = [
    {
      key: "subject",
      header: "Smart Title",
      render: (row) => (
        <span className="text-sm font-medium">
          {row.subject || row.description || "No Title"}
        </span>
      ),
    },
    {
      key: "events",
      header: "Company",
      render: (row) => {
        const companyName = row.events?.company_name;
        return (
          <span className={`text-sm ${!companyName ? 'text-gray-400 italic' : ''}`}>
            {companyName || "No Company"}
          </span>
        );
      },
    },
    {
      key: "event_id",
      header: "Job Title",
      render: (row) => {
        const jobTitle = row.events?.job_title || row.events?.position;
        return (
          <span className={`text-sm ${!jobTitle ? 'text-gray-400 italic' : ''}`}>
            {jobTitle || "No Job Title"}
          </span>
        );
      },
    },
    {
      key: "contact_id",
      header: "Contact",
      render: (row) => {
        const { first_name, last_name } = row.contacts || {};
        const fullName = getFullName(first_name, last_name);
        const hasContact = fullName && fullName !== "N/A";
        return (
          <span className={`text-sm ${!hasContact ? 'text-gray-400 italic' : ''}`}>
            {hasContact ? fullName : "No Contact"}
          </span>
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
      header: "Priority",
      render: (row) => (
        <span className="text-sm">{getPriorityLabel(row.priority)}</span>
      ),
    },
    {
      key: "due_date",
      header: "Due Date",
      render: (row) => (
        <span className="text-sm">{formatDate(row.due_date)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <TaskStatus status={row.status} id={row.id} />,
    },
  ];

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading tasks: {error.message}
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
    <>
      <DeleteTask
        isOpen={isOpen}
        onClose={handleDeleteClose}
        taskId={taskToDelete}
      />

      {/* Task Counter Display */}
      {!hasNoResults && !error && totalCount > 0 && (
        <div className="mb-4 px-4 py-2 bg-gray-50 border rounded-lg">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {tasks.length} of {""}
              {totalCount} tasks
            </span>
          </p>
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="relative">
          {/* Background refresh indicator */}
          {isValidating && !isFetchingNextPage && tasks.length > 0 && (
            <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-2 shadow-sm">
              <LoadingSpinner size="sm" />
            </div>
          )}
          <InfiniteScroll
            dataLength={tasks.length}
            next={fetchMoreData}
            hasMore={hasMoreData}
            scrollableTarget="scrollableDiv"
            loader={
              isFetchingNextPage && (
                <div className="flex justify-center p-4">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading more tasks...
                  </span>
                </div>
              )
            }
          >
            <div
              id="scrollableDiv"
              className="max-h-[calc(100vh-286px)] w-full overflow-auto"
            >
              <DataTable
                columns={taskColumns}
                data={tasks}
                rowKey="id"
                hideHeaderCheckBox
                hideRowCheckBox
                renderAction={(row) => (
                  <Actions id={row.id} onDelete={handleDeleteClick} />
                )}
              />
            </div>
          </InfiniteScroll>
        </div>
      )}
    </>
  );
}

export default TaskList;
