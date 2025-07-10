"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVerticalIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventActionsProps {
  id: string;
  showEdit?: boolean;
  showView?: boolean;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

export const EventActions = ({
  id,
  showEdit = true,
  showView = true,
  showDelete = false,
  onDelete,
}: EventActionsProps) => {
  const router = useRouter();

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const hasActions = showEdit || showView || showDelete;
  if (!hasActions) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-1 hover:bg-gray-100 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open event actions menu"
          aria-haspopup="true"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white w-fit !px-4" role="menu">
        <div className="flex flex-col gap-2">
          {showView && (
            <button
              className="text-sm text-gray-700 hover:text-gray-900 text-left px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              onClick={() => router.push(`/event/show/${id}`)}
              role="menuitem"
              aria-label="View event details"
            >
              View
            </button>
          )}

          {showEdit && (
            <button
              className="text-sm text-gray-700 hover:text-gray-900 text-left px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              onClick={() => router.push(`/event/edit/${id}`)}
              role="menuitem"
              aria-label="Edit event"
            >
              Edit
            </button>
          )}

          {showDelete && (
            <button
              className="text-sm text-red-600 hover:text-red-800 text-left px-2 py-1 rounded hover:bg-red-50 focus:outline-none focus:bg-red-50"
              onClick={handleDelete}
              role="menuitem"
              aria-label="Delete event"
            >
              Delete
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EventActions;
