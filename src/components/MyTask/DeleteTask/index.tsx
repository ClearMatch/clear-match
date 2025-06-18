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

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteCandidate = ({ isOpen, onClose }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-[30%] h-[180px]">
        <DialogHeader>
          <DialogTitle className="mb-2">Delete Candidate</DialogTitle>
          <DialogDescription>
            <span className="text-base font-normal mt-4">
              Are you sure you want to delete this Task?
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex !justify-center gap-2 pt-4 items-center">
          <Button variant="outline" onClick={onClose} className="w-40">
            Cancel
          </Button>
          <Button variant="destructive" className="bg-black text-white w-40">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCandidate;
