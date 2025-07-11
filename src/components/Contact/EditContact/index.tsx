"use client";

import { supabase } from "@/lib/supabase";
import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import EditForm from "./EditForm";
import { Contact } from "./Types";

const EditContact = () => {
  const params = useParams();
  const selectId = params?.id as string;

  const fetchContactById = async (id: string): Promise<Contact> => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  };

  const { data, error, isLoading } = useQuery<Contact>({
    queryKey: ["contact", selectId],
    queryFn: () => fetchContactById(selectId),
    enabled: !!selectId,
  });

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="font-bold text-md mb-4">Update Contact</h1>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin w-6 h-6 text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            Failed to load contact data.
          </div>
        ) : data ? (
          <EditForm key={selectId} data={data} id={selectId} />
        ) : (
          <div className="text-center py-4 text-gray-600">
            No contact found.
          </div>
        )}
      </div>
    </div>
  );
};

export default EditContact;
