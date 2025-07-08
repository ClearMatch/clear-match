"use client";

import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ActivityData } from "../Services/Types";
import { fetchTaskById } from "../Services";

import EditForm from "./EditForm";

const EditTask = () => {
  const params = useParams();
  const selectId = params?.id as string;

  const { data, error, isLoading } = useSWR<ActivityData>(
    selectId ? ["activity", selectId] : null,
    () => fetchTaskById(selectId)
  );

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="font-bold text-md mb-4">Update Task</h1>
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
