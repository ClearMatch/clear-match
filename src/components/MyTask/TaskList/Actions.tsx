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
        <button className="p-1 hover:bg-gray-100 rounded cursor-pointer">
          <MoreVerticalIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-white w-fit !px-4">
        <div className="flex flex-col gap-2">
          <button
            className="text-sm text-gray-700 hover:text-gray-900"
            onClick={() => router.push(`/task/show/${id}`)}
          >
            Show
          </button>
          <button
            className="text-sm text-gray-700 hover:text-gray-900"
            onClick={() => router.push(`/task/edit/${id}`)}
          >
            Edit
          </button>
          <button
            className="text-sm text-red-600 hover:text-red-800"
            onClick={() => onDelete(id)}
          >
            Delete
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Actions;
