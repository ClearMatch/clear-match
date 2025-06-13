"use client";

import { supabase } from "@/lib/supabase";
import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import EditForm from "./EditForm";
import { Candidate } from "./Types";

const EditCandidate = () => {
  const params = useParams();
  const selectId = params?.id as string;

  const fetchCandidateById = async (id: string): Promise<Candidate> => {
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  };

  const { data, error, isLoading } = useSWR<Candidate>(
    selectId ? ["candidate", selectId] : null,
    () => fetchCandidateById(selectId)
  );

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="font-bold text-md mb-4">Update Candidate</h1>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin w-6 h-6 text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            Failed to load candidate data.
          </div>
        ) : data ? (
          <EditForm data={data} id={selectId} />
        ) : (
          <div className="text-center py-4 text-gray-600">
            No candidate found.
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCandidate;
