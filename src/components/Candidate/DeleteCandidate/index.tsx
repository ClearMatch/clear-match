"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader } from "lucide-react";
import useSWRMutation from "swr/mutation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefetchCandidates: () => void;
  selectId: string | null;
}

const deleteCandidateFn = async (
  url: string,
  { arg: id }: { arg: string }
): Promise<void> => {
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) throw error;
};

const DeleteCandidate = ({
  isOpen,
  onClose,
  onRefetchCandidates,
  selectId,
}: Props) => {
  const {
    trigger: deleteCandidate,
    isMutating: deleting,
    error,
  } = useSWRMutation("delete-candidate", deleteCandidateFn);

  const handleDelete = async () => {
    if (!selectId) return;
    try {
      await deleteCandidate(selectId);
      onRefetchCandidates();
      onClose();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-[30%] h-[180px]">
        <DialogHeader>
          <DialogTitle className="mb-2">Delete Candidate</DialogTitle>
          <DialogDescription>
            {error ? (
              <div className="text-base font-normal text-red-500">
                Failed to delete candidate.
              </div>
            ) : (
              <span className="text-base font-normal mt-4">
                Are you sure you want to delete this candidate?
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex !justify-center gap-2 pt-4 items-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="w-40"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-black text-white w-40"
          >
            {deleting && <Loader className="animate-spin h-4 w-4 mr-2" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCandidate;
