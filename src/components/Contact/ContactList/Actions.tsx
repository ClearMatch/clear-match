"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVerticalIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  onDelete: (id: string) => void;
}

function Actions({ id, onDelete }: Props) {
  const router = useRouter();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-1 hover:bg-gray-100 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open contact actions menu"
          aria-haspopup="true"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white w-fit !px-4" role="menu">
        <div className="flex flex-col gap-2">
          <button
            className="text-sm text-gray-700 hover:text-gray-900 text-left px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            onClick={() => router.push(`/contacts/show/${id}`)}
            role="menuitem"
            aria-label="View contact details"
          >
            Show
          </button>
          <button
            className="text-sm text-gray-700 hover:text-gray-900 text-left px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            onClick={() => router.push(`/contacts/edit/${id}`)}
            role="menuitem"
            aria-label="Edit contact"
          >
            Edit
          </button>
          <button
            className="text-sm text-red-600 hover:text-red-800 text-left px-2 py-1 rounded hover:bg-red-50 focus:outline-none focus:bg-red-50"
            onClick={() => onDelete(id)}
            role="menuitem"
            aria-label="Delete contact"
          >
            Delete
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Actions;
