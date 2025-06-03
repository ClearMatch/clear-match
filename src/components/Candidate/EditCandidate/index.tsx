"use client";

import { supabase } from "@/lib/supabase";
import { Loader } from "lucide-react";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import EditForm from "./EditForm";
import { Candidate } from "./Types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setRefetchCandidate: (value: boolean) => void;
  selectId: string | null;
}

const EditCandidate = ({
  isOpen,
  onClose,
  setRefetchCandidate,
  selectId,
}: Props) => {
  const fetchCandidateById = async (id: string): Promise<Candidate> => {
    const { data, error } = await supabase
      .from("candidates")
      .select(
        `
        first_name,
        last_name,
        personal_email,
        work_email,
        phone,
        linkedin_url,
        github_url,
        resume_url,
        functional_role,
        current_location,
        current_job_title,
        current_company,
        current_company_size
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  };

  const { data, error, isLoading } = useSWR<Candidate>(
    selectId ? ["candidate", selectId] : null,
    () => fetchCandidateById(selectId!)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-[70%]">
        <DialogHeader>
          <DialogTitle>Edit Candidate</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin w-6 h-6 text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            Failed to load candidate data.
          </div>
        ) : data ? (
          <EditForm
            selectId={selectId!}
            data={data}
            onClose={onClose}
            setRefetchCandidate={setRefetchCandidate}
          />
        ) : (
          <div className="text-center py-4 text-gray-600">
            No candidate selected.
          </div>
        )}

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default EditCandidate;
