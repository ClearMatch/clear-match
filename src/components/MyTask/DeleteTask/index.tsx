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
import { useQueryClient } from "@tanstack/react-query";
import { CACHE_KEYS } from "../Common/cacheKeys";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskId: string | null;
}

const DeleteTask = ({ isOpen, onClose, taskId }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!taskId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete task");
      }

      const result = await response.json();
      toast.success("Task deleted successfully");
      
      // Only invalidate cache after successful server confirmation
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Force refetch TaskPriority counts for dashboard
      queryClient.refetchQueries({ 
        queryKey: ["taskPriorityCounts"],
        type: "all" // Refetch all matching queries regardless of state
      });
      onClose();
    } catch (error) {
      console.error("Delete task error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-sm h-auto">
        <DialogHeader>
          <DialogTitle className="mb-2">Delete Task</DialogTitle>
          <DialogDescription>
            <span className="text-base font-normal mt-4">
              Are you sure you want to delete this task? This action cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex !justify-center gap-2 pt-4 items-center">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-40" 
            disabled={isDeleting}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            className="bg-red-600 hover:bg-red-700 text-white w-40"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Confirm deletion"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTask;