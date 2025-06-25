"use client";
import DataTable from "@/components/ui/DataTable";
import { Column } from "@/components/ui/DataTable/Types";
import { useOpenable } from "@/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import { Loader, MoreVerticalIcon } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import DeleteTask from "../DeleteTask";
import { fetchActivitiesWithRelations } from "../Service";
import {
  ActivityWithRelations,
  getFullName,
  getPriorityLabel,
} from "../Service/Types";
import TaskStatus from "./TaskStatus";

interface TaskListProps {
  searchTerm: string;
}

function TaskList({ searchTerm }: TaskListProps) {
  const { isOpen, onClose } = useOpenable();
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const swrKey = debouncedSearchTerm
    ? `activitiesWithRelations-${debouncedSearchTerm}`
    : "activitiesWithRelations";

  const { data, error, isLoading } = useSWR<ActivityWithRelations[]>(
    swrKey,
    () => fetchActivitiesWithRelations(debouncedSearchTerm)
  );

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

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

  if (error) return <div>Error loading data</div>;

  if (isLoading || isSearching) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin h-6 w-6 text-indigo-600" />
        <span className="ml-2 text-sm text-gray-600">
          {isSearching ? "Searching..." : "Loading tasks..."}
        </span>
      </div>
    );
  }

  if (data?.length === 0 && debouncedSearchTerm) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No tasks found for {debouncedSearchTerm}
        </p>
      </div>
    );
  }

  return (
    <div>
      <DeleteTask isOpen={isOpen} onClose={onClose} />
      {data?.length && (
        <DataTable
          columns={taskColumns}
          data={data}
          rowKey="id"
          renderAction={() => <MoreVerticalIcon />}
          renderActionHeader={() => <MoreVerticalIcon />}
        />
      )}
    </div>
  );
}

export default TaskList;
