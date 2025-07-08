"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
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
  onRefetchContacts: () => void;
  selectId: string | null;
}

const deleteContactFn = async (id: string): Promise<void> => {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
};

const DeleteContact = ({
  isOpen,
  onClose,
  onRefetchContacts,
  selectId,
}: Props) => {
  const queryClient = useQueryClient();
  
  const {
    mutate: deleteContact,
    isPending: deleting,
    error,
  } = useMutation({
    mutationFn: deleteContactFn,
    onSuccess: () => {
      // Invalidate contacts queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onRefetchContacts();
      onClose();
    },
    onError: (err) => {
      console.error("Delete error:", err);
    },
  });

  const handleDelete = async () => {
    if (!selectId) return;
    deleteContact(selectId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-[30%] h-[180px]">
        <DialogHeader>
          <DialogTitle className="mb-2">Delete Contact</DialogTitle>
          <DialogDescription>
            {error ? (
              <div className="text-base font-normal text-red-500">
                Failed to delete contact.
              </div>
            ) : (
              <span className="text-base font-normal mt-4">
                Are you sure you want to delete this contact?
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

export default DeleteContact;
