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
        <MoreVerticalIcon />
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Actions;
