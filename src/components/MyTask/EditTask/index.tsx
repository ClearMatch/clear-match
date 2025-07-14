"use client";

import { ArrowLeftIcon, Loader } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ActivityData } from "../Services/Types";
import { fetchTaskById } from "../Services";

import EditForm from "./EditForm";

const EditTask = () => {
  const params = useParams();
  const selectId = params?.id as string;
  const router = useRouter();

  const { data, error, isLoading } = useQuery<ActivityData>({
    queryKey: ["activity", selectId],
    queryFn: () => fetchTaskById(selectId),
    enabled: !!selectId,
  });

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <div className="flex gap-2 items-center mb-4">
          <ArrowLeftIcon
            className="cursor-pointer"
            onClick={() => router.push("/task")}
          />
          <h1 className="font-bold text-md ">Update Task</h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin w-6 h-6 text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            Failed to load contact data.
          </div>
        ) : data ? (
          <EditForm data={data} selectId={selectId} />
        ) : (
          <div className="text-center py-4 text-gray-600">
            No contact found.
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTask;
