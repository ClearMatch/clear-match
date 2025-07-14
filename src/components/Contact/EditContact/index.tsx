"use client";

import { supabase } from "@/lib/supabase";
import { ArrowLeftIcon, Loader } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contactKeys } from "@/lib/query-keys";
import EditForm from "./EditForm";
import { Contact } from "./Types";

const EditContact = () => {
  const params = useParams();
  const selectId = params?.id as string;
  const router = useRouter();

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
    queryKey: contactKeys.detail(selectId),
    queryFn: () => fetchContactById(selectId),
    enabled: !!selectId,
  });

  return (
    <div className="p-4 bg-white">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <div className="flex gap-2 items-center mb-4">
          <ArrowLeftIcon
            className="cursor-pointer"
            onClick={() => router.push("/contacts")}
          />
          <h1 className="font-bold text-md ">Update Contact</h1>
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
