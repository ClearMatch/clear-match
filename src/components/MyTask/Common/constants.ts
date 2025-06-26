export const activityTypeOptions = [
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
  { value: "video", label: "Video" },
  { value: "call", label: "Call" },
];

export const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const priorityOptions = [
  { value: "1", label: "High" },
  { value: "2", label: "High-Medium" },
  { value: "3", label: "Medium" },
  { value: "4", label: "Low-Medium" },
  { value: "5", label: "Low" },
  { value: "6", label: "Very Low" },
];

export const criticalityTypeOptions = priorityOptions;

export const getPriorityNumber = (priorityString: string): number | null => {
  const priority = parseInt(priorityString);
  return isNaN(priority) ? null : priority;
};
