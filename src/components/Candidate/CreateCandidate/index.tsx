"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import AddCandidate from "./AddCandidate";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setRefetchCandidate: (value: boolean) => void;
}

const CreateCandidate = ({ isOpen, onClose, setRefetchCandidate }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-[70%]">
        <DialogDescription />
        <DialogHeader>
          <DialogTitle>Add Candidate</DialogTitle>
        </DialogHeader>
        <AddCandidate
          onClose={onClose}
          setRefetchCandidate={setRefetchCandidate}
        />
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCandidate;
