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
}

function Actions({ id }: Props) {
  const router = useRouter();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-1 hover:bg-gray-100 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open task actions menu"
          aria-haspopup="true"
        >
          <MoreVerticalIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white w-fit !px-4" role="menu">
        <div className="flex flex-col gap-2">
          <button
            className="text-sm text-gray-700 hover:text-gray-900 text-left px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            onClick={() => router.push(`/event/edit/${id}`)}
            role="menuitem"
            aria-label="Edit event"
          >
            Edit
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Actions;
