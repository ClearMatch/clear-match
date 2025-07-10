"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import { EventData } from "../Services/Types";
import { fetchEventById } from "../Services/dataFetchers";
import EditEventForm from "./EditForm";

const EditEvent = () => {
  const params = useParams();
  const selectId = params?.id as string;

  const { data, error, isLoading } = useQuery<EventData>({
    queryKey: ["event", selectId],
    queryFn: () => fetchEventById(selectId),
    enabled: !!selectId,
  });

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="font-bold text-md mb-4">Update Event</h1>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin w-6 h-6 text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            Failed to load event data.
          </div>
        ) : data ? (
          <EditEventForm data={data} selectId={selectId} />
        ) : (
          <div className="text-center py-4 text-gray-600">No Event found.</div>
        )}
      </div>
    </div>
  );
};

export default EditEvent;
