import { useOpenable } from "@/hooks";
import DeleteTask from "../DeleteTask";

function TaskList() {
  const { isOpen, onClose } = useOpenable();

  return (
    <div>
      <h2>Task List</h2>
      <DeleteTask isOpen={isOpen} onClose={onClose} />
    </div>
  );
}

export default TaskList;
