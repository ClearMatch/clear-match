"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
}

const DeleteTask = ({ isOpen, onClose, taskId }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!taskId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast.success("Task deleted successfully");
      mutate("activitiesWithRelations");
      onClose();
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-[30%] h-[180px]">
        <DialogHeader>
          <DialogTitle className="mb-2">Delete Task</DialogTitle>
          <DialogDescription>
            <span className="text-base font-normal mt-4">
              Are you sure you want to delete this task?
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex !justify-center gap-2 pt-4 items-center">
          <Button variant="outline" onClick={onClose} className="w-40" disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            className="bg-black text-white w-40"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTask;
