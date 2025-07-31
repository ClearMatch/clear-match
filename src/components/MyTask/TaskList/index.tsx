"use client";
import DataTable from "@/components/ui/DataTable";
import { Column } from "@/components/ui/DataTable/Types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useOpenable } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import DeleteTask from "../DeleteTask";
import { ActivityWithRelations, getFullName } from "../Services/Types";
import Actions from "./Actions";
import { PriorityIndicatorCompact } from "./PriorityIndicator";
import TaskStatus from "./TaskStatus";

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
      key: "contact_id",
      header: "Contact",
      render: (row) => {
        const { first_name, last_name } = row.contacts || {};
        return (
          <span className="text-sm">{getFullName(first_name, last_name)}</span>
        );
      },
    },
    {
      key: "assigned_to",
      header: "Assigned To",
      render: (row) => {
        const { first_name, last_name } = row.assigned_to_profile || {};
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
      render: (row) => {
        return (
          <PriorityIndicatorCompact
            priority={row.priority || 2}
            creationType={row.creation_type || "manual"}
            showTooltip={true}
          />
        );
      },
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
